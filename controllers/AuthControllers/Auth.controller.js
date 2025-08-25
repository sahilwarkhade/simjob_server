import mongoose from "mongoose";
import User from "../../models/User.model.js";
import bcrypt from "bcrypt";
import Profile from "../../models/Profile.model.js";
import Analytics from "../../models/Analytics.model.js";
import OTP from "../../models/OTP.model.js";
import { mailSender } from "../../utils/SendEmail/index.js";
import { otpTemplate } from "../../templates/Email/registrationOtp.js";
import { forgetPasswordOtpTemplate } from "../../templates/Email/forgetPasswordOpt.js";
import Session from "../../models/Session.model.js";
import { getTokenData } from "../../utils/GoogleAuth/index.js";
import {
  getAccessToken,
  getPrimaryEmail,
  getUserProfile,
} from "../../utils/GithubAuth/index.js";

export const registerUser = async (req, res) => {
  const { fullName, email, password, confirmPassword, otp } = req.body;

  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();
  try {
    if (!fullName || !email || !password || !confirmPassword || !otp) {
      return res.status(403).json({
        success: false,
        message: "All fields are required",
      });
    }
    if (password !== confirmPassword) {
      return res.status(401).json({
        success: false,
        message: "Password and confirm password should match",
      });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already registered." });
    }

    const otpRecord = await OTP.findOne({ email, otp }).select("otp").lean();
    if (
      !otpRecord ||
      otpRecord.length === 0 ||
      otpRecord.otp !== otp.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: "OTP is not valid, please enter valid otp",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const additionalDetailes = new Profile();
    await additionalDetailes.save({ session: mongoSession });

    const user = new User({
      fullName,
      email,
      password: hashedPassword,
      accountType: "candidate",
      authStrategy: "local",
      additionalDetailes: additionalDetailes._id,
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

    await userAnalytics.save();

    await mongoSession.commitTransaction();
    return res
      .status(201)
      .json({ success: true, message: "User registered successfully.", user });
  } catch (err) {
    await mongoSession.abortTransaction();
    console.log("error in resgister", err);
    res.status(500).json({ success: false, message: "Server error." });
  } finally {
    await mongoSession.endSession();
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(403).json({
        success: false,
        message: "All fields are required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials." });
    }

    if (!user.password || user.password.length === 0) {
      return res.status(401).json({
        success: false,
        message: `You were sign up using ${user.authStrategy}, so use ${user.authStrategy} or do forget password`,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials." });
    }

    const isAlredyUserLoginWithSameCredentials = await Session.find({
      user: user._id,
    });

    if (isAlredyUserLoginWithSameCredentials.length > 0) {
      await Session.deleteMany({ user: user._id });
      res.clearCookie("session_id");
    }

    const session = new Session({ user: user._id });

    await session.save();

    const cookieOptions = {
      httpOnly: true,
      signed: true,
      secure: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    };
    return res
      .cookie("session_id", session._id, cookieOptions)
      .status(200)
      .json({
        success: true,
        message: "Logged in successfull",
        user,
      });
  } catch (err) {
    console.log("Error in login user :: ", err);
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong..." });
  }
};

export const updatePassword = async (req, res) => {
  const { userId } = req.user;
  const { currentPassword, newPassword } = req.body;

  try {
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please, login again...",
      });
    }

    if (!newPassword) {
      return res.status(403).json({
        success: false,
        message: "All fields are required",
      });
    }
    const user = await User.findById(userId);

    if (user.authStrategy === "local") {
      if (!currentPassword) {
        return res.status(403).json({
          success: false,
          message: "current password required",
        });
      }
      const isPasswordCorrect = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isPasswordCorrect) {
        return res.status(400).json({
          success: false,
          message: "please, enter correct current password",
        });
      }
    }
    const newHashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = newHashedPassword;

    await user.save();

    const isAlredyUserLoginWithSameCredentials = await Session.find({
      user: user._id,
    });

    if (isAlredyUserLoginWithSameCredentials.length > 0) {
      await Session.deleteMany({ user: user._id });
      res.clearCookie("session_id");
    }

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.log("Error in updating password :: ", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong please try again later...",
    });
  }
};

export const sendOtp = async (req, res) => {
  const { email, type } = req.body;
  try {
    if (!email || !type) {
      return res.status(403).json({
        success: false,
        message: "All fields are required",
      });
    }

    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

    await OTP.findOneAndUpdate(
      { email },
      { otp: otpCode, createdAt: new Date() },
      { upsert: true, new: true }
    );

    if (type === "signup") {
      await mailSender(
        email,
        "Registration OTP from SimJob",
        otpTemplate(otpCode)
      );

      console.log("SIGN UP")
    } else {
      await mailSender(
        email,
        "Forget Password OTP from SimJob",
        forgetPasswordOtpTemplate(otpCode)
      );
    }

    return res.status(201).json({
      success: true,
      message: "Otp sent successfully to your provided email",
    });
  } catch (error) {
    console.log("Error in sending otp :: ", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong, please try again later...",
    });
  }
};

export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  console.log("OTP :: ", otp)
  try {
    if (!email || !otp) {
      return res.status(403).json({
        success: false,
        message: "All fields are required",
      });
    }

    const otpRecord = await OTP.findOne({ email, otp }).select("otp").lean();
    console.log("OTP RECORD :: ", otpRecord)
    if (
      !otpRecord ||
      otpRecord.length === 0 ||
      otpRecord.otp !== otp
    ) {
      return res.status(400).json({
        success: false,
        message: "OTP is not valid, please enter valid otp",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Opt verified successfully",
    });
  } catch (error) {
    console.log("Error in verifying otp :: ", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong, please try again later...",
    });
  }
};

export const forgetPassword = async (req, res) => {
  const { email, newPassword, newConfirmPassword } = req.body;

  try {
    if (!email || !newPassword || !newConfirmPassword) {
      return res.status(403).json({
        success: false,
        message: "All fields are required",
      });
    }
    if (newPassword !== newConfirmPassword) {
      throw new Error("Password and confirm password should match");
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User is not registered, please register user",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;

    await user.save();

    const isAlredyUserLoginWithSameCredentials = await Session.find({
      user: user._id,
    });

    if (isAlredyUserLoginWithSameCredentials.length > 0) {
      await Session.deleteMany({ user: user._id });
      res.clearCookie("session_id");
    }

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.log("Error in frogetting password controller :: ", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong, please try again later...",
    });
  }
};

export const logOut = async (req, res) => {
  const { userId } = req.user;

  try {
    await Session.deleteMany({ user: userId });
    return res.status(200).json({
      success: true,
      message: "Successfully log out",
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

  console.log("IN GOOGLE AUTH CONTROLLER");

  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();
  try {
    // verifying idToken
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
      const allSessions = await Session.find({ user: user._id });
      if (allSessions.length > 0) {
        await Session.deleteMany({ user: user._id });
      }

      session = await Session.create({ user: user._id });
    } else {
      const additionalDetailes = new Profile();
      await additionalDetailes.save({ session: mongoSession });

      const newUser = new User({
        fullName: name,
        email,
        avatar: picture,
        authStrategy: "google",
        accountType: "candidate",
        google: sub,
        additionalDetailes: additionalDetailes._id,
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

      session = await Session.create({ user: newUser._id });

      user = newUser;
    }

    res.cookie("session_id", session._id, {
      httpOnly: true,
      signed: true,
      secure: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
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

      const allSessions = await Session.find({ user: user._id }).lean();
      if (allSessions.length > 0) {
        await Session.deleteMany({ user: user._id });
      }

      session = await Session.create({ user: user._id });
    } else {
      const profile = await getUserProfile(access_token);

      const additionalDetailes = new Profile();
      await additionalDetailes.save({ session: mongoSession });

      const newUser = new User({
        fullName: profile?.name,
        email: primaryEmail,
        authStrategy: "github",
        additionalDetailes: additionalDetailes?._id,
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

      session = await Session.create({ user: newUser._id });

      user = newUser;
    }

    res.cookie("session_id", session._id, {
      httpOnly: true,
      signed: true,
      secure: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
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
