import { z } from "zod";
import mongoose from "mongoose";
import User from "../../models/User.model.js";
import bcrypt from "bcrypt";
import Profile from "../../models/Profile.model.js";
import Analytics from "../../models/Analytics.model.js";
import OTP from "../../models/OTP.model.js";
import { otpTemplate } from "../../templates/Email/registrationOtp.js";
import { forgetPasswordOtpTemplate } from "../../templates/Email/forgetPasswordOpt.js";
import { getTokenData } from "../../utils/GoogleAuth/index.js";
import {
  getAccessToken,
  getPrimaryEmail,
  getUserProfile,
} from "../../utils/GithubAuth/index.js";
import {
  createSession,
  deleteSession,
  invalidateAllUserSessions,
} from "../../utils/Sessions/index.js";
import { emailQueue } from "../../config/bullMq.js";
import {
  forgetPasswordSchema,
  loginSchema,
  sendOtpSchema,
  signupSchema,
  updatePasswordSchema,
  verifyOtpSchema,
} from "../../validators/authValidators.js";

export const registerUser = async (req, res) => {
  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();

  try {
    const validatedBody = signupSchema.parse(req.body);
    const { fullName, email, password, otp } = validatedBody;

    const existingUser = await User.findOne({ email }).session(mongoSession);
    if (existingUser) {
      await mongoSession.abortTransaction();
      return res
        .status(409)
        .json({ success: false, message: "Email already registered." });
    }

    const otpRecord = await OTP.findOne({ email, otp })
      .select("otp")
      .lean()
      .session(mongoSession);
    if (!otpRecord) {
      await mongoSession.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "OTP is not valid, please enter valid otp",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const additionalDetails = new Profile();
    await additionalDetails.save({ session: mongoSession });

    const user = new User({
      fullName,
      email,
      password: hashedPassword,
      accountType: "candidate",
      authStrategy: "local",
      additionalDetails: additionalDetails._id,
    });

    await user.save({ session: mongoSession });

    const userAnalytics = new Analytics({
      user: user._id,
      totalMockInterviews: 0,
      totalOaTests: 0,
      averageMockScore: 0,
      averageOaScore: 0,
      weakPoints: "",
      strongPoints: "",
      imporvedPoints: "",
      improvementSuggestions: "",
    });

    await userAnalytics.save({ session: mongoSession });

    const sessionId = await createSession(user._id.toString());

    if (!sessionId) {
      await mongoSession.abortTransaction();
      return res
        .status(429)
        .json({ message: "Maximum number of active sessions reached." });
    }

    const cookieOptions = {
      httpOnly: true,
      signed: true,
      maxAge: 1000 * 60 * 60 * 24,
    };

    res.cookie("session_id", sessionId, cookieOptions);
    await mongoSession.commitTransaction();

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        accountType: user.accountType,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    await mongoSession.abortTransaction();

    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid input data",
        errors: err.flatten().fieldErrors,
      });
    }
    console.log("error in register", err);
    res.status(500).json({
      success: false,
      message: "An unexpected server error occurred. Please try again later.",
    });
  } finally {
    await mongoSession.endSession();
  }
};

export const loginUser = async (req, res) => {
  try {
    const validatedBody = loginSchema.parse(req.body);
    const { email, password } = validatedBody;

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials." });
    }

    if (!user.password || user.password.length === 0) {
      return res.status(401).json({
        success: false,
        message: `Invalid credentials`,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials." });
    }

    const sessionId = await createSession(user?._id);

    if (!sessionId) {
      return res
        .status(429)
        .json({ message: "Maximum number of active sessions reached." });
    }

    const cookieOptions = {
      httpOnly: true,
      signed: true,
      sameSite: 'none',
      maxAge: 1000 * 60 * 60 * 24,
    };

    res.cookie("session_id", sessionId, cookieOptions);

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid input data",
        errors: err.flatten().fieldErrors,
      });
    }

    console.log("Error in login user :: ", err);
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred. Please try again later.",
    });
  }
};

export const updatePassword = async (req, res) => {
  const { userId } = req.user;

  try {
    const validatedBody = updatePasswordSchema.parse(req.body);
    const { currentPassword, newPassword } = validatedBody;

    const user = await User.findById(userId);

    if (user.authStrategy === "local") {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password is required to change password.",
        });
      }
      const isPasswordCorrect = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isPasswordCorrect) {
        return res.status(400).json({
          success: false,
          message: "Please, enter the correct current password.",
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: `You registered via ${user.authStrategy}. Please change your password through ${user.authStrategy} or use the 'Forgot Password' link to set a local password.`,
      });
    }

    const newHashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = newHashedPassword;
    await user.save();

    await invalidateAllUserSessions(user._id);

    return res.status(200).json({
      success: true,
      message:
        "Password changed successfully. Please log in with your new password.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid input data",
        errors: error.flatten().fieldErrors,
      });
    }

    console.log("Error in updating password :: ", error);
    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred during password update. Please try again later.",
    });
  }
};

export const sendOtp = async (req, res) => {
  try {
    console.log(req.body.type)
    const validatedBody = sendOtpSchema.parse(req.body);
    const { email, type } = validatedBody;
    
    if (type === "forget-password") {
      const user = await User.findOne({ email: email }).select("_id").lean();
      if (!user) {
        return res.status(200).json({
          success: true,
          message: "If an account with that email exists, an OTP has been sent.",
        });
      }
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    await OTP.findOneAndUpdate(
      { email },
      { otp: otpCode, createdAt: new Date() },
      { upsert: true, new: true }
    );

    if (type === "signup") {
      const title = "Registration OTP from SimJob";
      const template = otpTemplate(otpCode);
      await emailQueue.add(
        "signup",
        { email, title, template },
        { jobId: `sign-up-otp-${email}` }
      );
    } else { 
      const title = "Forget Password OTP from SimJob";
      const template = forgetPasswordOtpTemplate(otpCode);
      await emailQueue.add(
        "forget-password",
        { email, title, template },
        { jobId: `forget-password-otp-${email}` }
      );
    }

    return res.status(201).json({
      success: true,
      message: "An OTP has been sent to your provided email.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid input data",
        errors: error.flatten().fieldErrors,
      });
    }

    console.log("Error in sending otp :: ", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong, please try again later...",
    });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const validatedBody = verifyOtpSchema.parse(req.body);
    const { email, otp } = validatedBody;

    const otpRecord = await OTP.findOne({ email, otp }).select("_id").lean();

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "The OTP is invalid or has expired. Please try again.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid input data",
        errors: error.flatten().fieldErrors,
      });
    }

    console.log("Error in verifying otp :: ", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong, please try again later...",
    });
  }
};

export const forgetPassword = async (req, res) => {
  try {
    const validatedBody = forgetPasswordSchema.parse(req.body);
    const { email, newPassword } = validatedBody;

    const user = await User.findOne({ email }).select("password");

    if (!user) {
      return res.status(200).json({
        success: false,
        message: "User is not registered.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    user.password = hashedPassword;
    await user.save();

    await invalidateAllUserSessions(user._id);

    return res.status(200).json({
      success: true,
      message: "Password changed successfully. You can now log in with your new password.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid input data",
        errors: error.flatten().fieldErrors,
      });
    }

    console.log("Error in forgetting password controller :: ", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong, please try again later...",
    });
  }
};

export const logOut = async (req, res) => {
  const { session_id } = req.signedCookies;

  try {
    await deleteSession(session_id);
    return res.status(201).json({
      success: true,
      message: "Log out successfully",
    });
  } catch (error) {
    console.log("Error in log out :: ", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong, please try again later...",
    });
  }
};

export const continueWithGoogle = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({
      success: false,
      message: "Invalid request",
    });
  }

  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();
  try {
    const { email, picture, name, sub } = await getTokenData(idToken);

    let user = await User.findOne({ email }).lean();

    let session;
    if (user) {
      if (user.authStrategy !== "google") {
        return res.status(401).json({
          success: false,
          message: "Not able to get google account, please register",
        });
      }

      session = await createSession(user?._id);

      if (!session) {
        return res
          .status(429)
          .json({ message: "Maximum number of active sessions reached." });
      }
    } else {
      const additionalDetails = new Profile();
      await additionalDetails.save({ session: mongoSession });

      const newUser = new User({
        fullName: name,
        email,
        avatar: picture,
        authStrategy: "google",
        accountType: "candidate",
        google: sub,
        additionalDetails: additionalDetails._id,
      });

      await newUser.save({ session: mongoSession });

      const userAnalytics = new Analytics({
        user: newUser._id,
        totalMockInterviews: 0,
        totalOaTests: 0,
        averageMockScore: 0,
        averageOaScore: 0,
        weakPoints: "",
        strongPoints: "",
        imporvedPoints: "",
        improvementSuggestions: "",
      });

      await userAnalytics.save({ session: mongoSession });

      session = await createSession(user?._id);

      if (!session) {
        return res
          .status(429)
          .json({ message: "Maximum number of active sessions reached." });
      }

      user = newUser;
    }

    res.cookie("session_id", session, {
      httpOnly: true,
      signed: true,
      
      maxAge: 1000 * 60 * 60 * 24,
    });

    await mongoSession.commitTransaction();
    return res.status(200).json({
      success: true,
      message: "Successfully logged in...",
      user,
    });
  } catch (error) {
    await mongoSession.abortTransaction();
    console.log("Error in login with google :: ", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong, please try again later...",
    });
  } finally {
    await mongoSession.endSession();
  }
};

export const continueWithGitHub = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ message: "Authorization code is missing." });
  }
  const mongoSession = await mongoose.startSession();
  try {
    const access_token = await getAccessToken(code);

    const primaryEmail = await getPrimaryEmail(access_token);

    let user = await User.findOne({ email: primaryEmail }).lean();
    let session;

    mongoSession.startTransaction();
    if (user) {
      if (user.authStrategy !== "github") {
        return res.status(401).json({
          success: false,
          message: `This email is already registered using ${user.authStrategy} login using that, or do forget password`,
        });
      }

      session = await createSession(user?._id);

      if (!session) {
        return res
          .status(429)
          .json({ message: "Maximum number of active sessions reached." });
      }
    } else {
      const profile = await getUserProfile(access_token);

      const additionalDetails = new Profile();
      await additionalDetails.save({ session: mongoSession });

      const newUser = new User({
        fullName: profile?.name,
        email: primaryEmail,
        authStrategy: "github",
        additionalDetails: additionalDetails?._id,
        accountType: "candidate",
        avatar: profile?.avatar_url,
        github: profile?.id.toString(),
      });

      await newUser.save({ session: mongoSession });

      const userAnalytics = new Analytics({
        user: newUser._id,
        totalMockInterviews: 0,
        totalOaTests: 0,
        averageMockScore: 0,
        averageOaScore: 0,
        weakPoints: "",
        strongPoints: "",
        imporvedPoints: "",
        improvementSuggestions: "",
      });

      await userAnalytics.save({ session: mongoSession });

      session = await createSession(user?._id);

      if (!session) {
        return res
          .status(429)
          .json({ message: "Maximum number of active sessions reached." });
      }

      user = newUser;
    }

    console.log("SESSION GITHUB :: ", session);
    res.cookie("session_id", session, {
      httpOnly: true,
      signed: true,
      
      maxAge: 1000 * 60 * 60 * 24,
    });

    await mongoSession.commitTransaction();

    return res.redirect(process.env.FRONTEND_URL);
  } catch (error) {
    await mongoSession.abortTransaction();

    console.log("Error in login with google :: ", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong, please try again later...",
    });
  } finally {
    await mongoSession.endSession();
  }
};
