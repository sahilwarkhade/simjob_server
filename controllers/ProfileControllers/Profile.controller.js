import mongoose from "mongoose";
import Analytics from "../../models/Analytics.model.js";
import MockInterview from "../../models/MockInterview.model.js";
import OATest from "../../models/OATest.model.js";
import Profile from "../../models/Profile.model.js";
import User from "../../models/User.model.js";
import { uploadToCloudinary } from "../../utils/MockInterview/Upload/uploadToCloudinary.js";

export const getUserProfileDetails = async (req, res) => {
  const { userId } = req.user;

  try {
    const user = await User.findOne({ _id: userId })
      .select("-password")
      .populate("additionalDetailes")
      .exec();

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not able to find user",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Successfully get all user details",
      user,
    });
  } catch (error) {
    console.log("Error in getting user profile details :: ", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while getting user profile...",
    });
  }
};

export const updateUserPersonalDetailes = async (req, res) => {
  const { userId } = req.user;
  const { bio, gender, mobileNumber, address, website, linkedin } = req.body;
  try {
    const user = await User.findOne({ _id: userId }).select(
      "additionalDetailes"
    );
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not valid",
      });
    }
    const userProfile = await Profile.findOne({
      _id: user?.additionalDetailes,
    }).select("personalInformation");

    if (!userProfile) {
      return res.status(401).json({
        success: false,
        message: "Not able to get user profile",
      });
    }

    userProfile.personalInformation.address = address;
    userProfile.personalInformation.bio = bio;
    userProfile.personalInformation.gender = gender;
    userProfile.personalInformation.mobileNumber = mobileNumber;
    userProfile.personalInformation.website = website;
    userProfile.personalInformation.linkedinUrl = linkedin;

    await userProfile.save();

    const updatedPersonalDetails = await Profile.findById(
      user?.additionalDetailes
    ).select("personalInformation");

    if (!updatedPersonalDetails) {
      throw new Error("Something went wrong...");
    }

    return res.status(201).json({
      success: true,
      message: "Personal details successully updated",
      updatedPersonalDetails,
    });
  } catch (error) {
    console.log("Error in updating user personal details :: ", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating user personal details...",
    });
  }
};

export const updateUserProfessionalDetailes = async (req, res) => {
  const { userId } = req.user;
  const { currentRole, targetRole, experienceLevel, skills, targetCompanies } =
    req.body;

  try {
    const user = await User.findOne({ _id: userId }).select(
      "additionalDetailes"
    );
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not valid",
      });
    }
    const userProfile = await Profile.findOne({
      _id: user?.additionalDetailes,
    }).select("professionalInformation");

    if (!userProfile) {
      return res.status(401).json({
        success: false,
        message: "Not able to get user profile",
      });
    }

    userProfile.professionalInformation.currentRole = currentRole;
    userProfile.professionalInformation.targetedRole = targetRole;
    userProfile.professionalInformation.experienceLevel = experienceLevel;
    userProfile.professionalInformation.skills = skills;
    userProfile.professionalInformation.targetCompanies = targetCompanies;

    await userProfile.save();

    const updatedProfessionalDetails = await Profile.findById(
      user?.additionalDetailes
    ).select("professionalInformation");

    if (!updatedProfessionalDetails) {
      throw new Error(
        "Something went wrong while getting Professional Information..."
      );
    }

    return res.status(201).json({
      success: true,
      message: "Professional details successully updated",
      updatedProfessionalDetails,
    });
  } catch (error) {
    console.log("Error in updating user professional details :: ", error);
    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while updating user professional details...",
    });
  }
};

export const updateProfile = async (req, res) => {
  const { userId } = req.user;
  const profile = req.file;

  if (!profile) {
    return res.status(400).json({
      success: false,
      message: "select profile",
    });
  }
  const profileTempPath = profile?.path;

  try {
    const user = await User.find({ _id: userId }).select("additionalDetailes");
    if (!user) {
      return res.status.json({
        success: false,
        message: "Not able to find user",
      });
    }

    const userProfile = await Profile.findOne({
      _id: user?.additionalDetailes,
    }).select("personalInformation");

    const result=await uploadToCloudinary(profileTempPath,"simjob_users_profile","jpg","image");
    const secure_url=result?.value?.secure_url;

    if(!secure_url){
        return res.status(400).json({
            success:false,
            message:"Fail to upload, please try again after some time..."
        })
    }
    userProfile.personalInformation.avatar=secure_url;
    await userProfile.save();

    return res.status(200).json({
        success:true,
        message:"Profile Updated successfully",
        secure_url
    })
  } catch (error) {
    console.log("Error in updating user professional details :: ", error);
    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while updating user professional details...",
    });
  }
};

export const deleteAccount = async (req, res) => {
  const { userId } = req.user;
  const mongodbSession=await mongoose.startSession();
  try {
    const user = await User.findOne({ _id: userId }).select(
      "additionalDetailes"
    );
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }
    mongodbSession.startTransaction()
    await Analytics.findOneAndDelete({ user:userId });
    await Profile.findOneAndDelete({ _id: user?.additionalDetailes });
    await MockInterview.deleteMany({ user: userId });
    await OATest.deleteMany({ user: userId });
    await User.findOneAndDelete({ _id: userId });
    await mongodbSession.commitTransaction()
    return res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    await mongodbSession.abortTransaction();
    console.log("Error in deleting user :: ", error);
    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while deleting user, please try again after some time",
    });
  }
  finally{
    mongodbSession.endSession();
  }
};
