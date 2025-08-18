import User from "../../models/User.model.js";
import bcrypt from "bcrypt";
import Profile from "../../models/Profile.model.js";
import Analytics from "../../models/Analytics.model.js";
import OTP from "../../models/OTP.model.js";
import { mailSender } from "../../utils/SendEmail/index.js";
import { otpTemplate } from "../../templates/Email/registrationOtp.js";
import { forgetPasswordOtpTemplate } from "../../templates/Email/forgetPasswordOpt.js";
import Session from "../../models/Session.model.js";

export const registerUser = async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword, otp } = req.body;
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

    const hashedPassword = await bcrypt.hash(password, 10);

    const additionalDetailes = new Profile();
    await additionalDetailes.save();

    const user = new User({
      fullName,
      email,
      password: hashedPassword,
      accountType: "candidate",
      additionalDetailes: additionalDetailes._id,
    });

    await user.save();

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

    return res
      .status(201)
      .json({ success: true, message: "User registered successfully.", user });
  } catch (err) {
    console.log("error in resgister", err);
    res.status(500).json({ success: false, message: "Server error." });
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
    const user = await User.findOne({ email }).select("-password");
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials." });
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
    if (!currentPassword || !newPassword) {
      return res.status(403).json({
        success: false,
        message: "All fields are required",
      });
    }

    const user = await User.findById(userId);

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

    const user = await User.findOne({ email }).lean();
    if (user) {
      return res.status(401).json({
        success: false,
        message: "User is already registered, please do login",
      });
    }

    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

    await OTP.findOneAndUpdate(
      { email },
      { otp: otpCode, createdAt: new Date() },
      { upsert: true, new: true }
    );

    await mailSender(
      email,
      type === "signup"
        ? "Registration OTP from SimJob"
        : "Forget Password OTP from SimJob",
      type === "signup"
        ? otpTemplate(otpCode)
        : forgetPasswordOtpTemplate(otpCode)
    );

    type === "signupotp"
      ? await mailSender(
          email,
          "Registration OTP from SimJob",
          otpTemplate(otpCode)
        )
      : await mailSender(
          email,
          "Forget Password OTP from SimJob",
          forgetPasswordOtpTemplate(otpCode)
        );

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
  try {
    if (!email || !otp) {
      return res.status(403).json({
        success: false,
        message: "All fields are required",
      });
    }

    const otpRecord = await OTP.find({ email, otp }).select("otp").lean();
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
