import User from "../../models/User.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Profile from "../../models/Profile.model.js";
import Analytics from "../../models/Analytics.model.js";


export const registerUser = async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword } = req.body;
    if (
      !fullName ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      return res.status(403).json({
        success: false,
        message: "All Fields are required",
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
  try {
    const { email, password } = req.body;

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

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: 60 * 60 * 24 * 7,
    });

    return res.json({
      success: true,
      token,
      user,
    });
  } catch (err) {
    console.log("Error in generating token :: ", err);
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
