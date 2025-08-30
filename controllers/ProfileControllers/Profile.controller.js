import mongoose from "mongoose";
import Analytics from "../../models/Analytics.model.js";
import MockInterview from "../../models/MockInterview.model.js";
import OATest from "../../models/OATest.model.js";
import Profile from "../../models/Profile.model.js";
import User from "../../models/User.model.js";
import { uploadToCloudinary } from "../../utils/Upload/uploadToCloudinary.js";
import Session from "../../models/Session.model.js";

export const getUserProfileDetails = async (req, res) => {
  const { userId } = req.user;

  try {
    const user = await User.findById(userId)
      .select("-password -google -github")
      .populate("additionalDetails")
      .exec();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    console.log("USER DETAILES :: ", user);
    return res.status(200).json({
      success: true,
      message: "User profile details retrieved successfully.",
      user,
    });
  } catch (error) {
    console.log("Error in getting user profile details :: ", error);
    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while retrieving user profile. Please try again later.",
    });
  }
};

export const updateUserPersonalDetails = async (req, res) => {
  const { userId } = req.user;

  const { fullName, bio, gender, mobileNumber, address, website, linkedinUrl } =
    req.body;

  try {
    const user = await User.findById(userId)
      .select("additionalDetails")
      .populate({
        path: "additionalDetails",
        select: "personalInformation",
      })
      .exec();

    if (!user || !user.additionalDetails) {
      return res.status(404).json({
        success: false,
        message: "User or associated profile not found.",
      });
    }

    const userProfile = user?.additionalDetails;
    if (fullName !== undefined) user.fullName = fullName;
    if (bio !== undefined) userProfile.personalInformation.bio = bio;
    if (gender !== undefined) userProfile.personalInformation.gender = gender;
    if (mobileNumber !== undefined)
      userProfile.personalInformation.mobileNumber = mobileNumber;
    if (address !== undefined)
      userProfile.personalInformation.address = address;
    if (website !== undefined)
      userProfile.personalInformation.website = website;
    if (linkedinUrl !== undefined)
      userProfile.personalInformation.linkedinUrl = linkedinUrl;

    await userProfile.save();
    await user.save();
    console.log(
      "USER PROFILE UPDATE PERSONAL :: ",
      userProfile.personalInformation
    );

    return res.status(200).json({
      success: true,
      message: "Personal details successfully updated.",
      updatedPersonalDetails: userProfile.personalInformation,
    });
  } catch (error) {
    console.error("Error in updateUserPersonalDetails controller:", error);

    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while updating personal details. Please try again later.",
    });
  }
};

export const updateUserProfessionalDetails = async (req, res) => {
  const { userId } = req.user; 
  const { currentRole, targetRole, experience, skills, targetCompanies } = req.body;

  try {
    const user = await User.findById(userId)
      .select('additionalDetails')
      .populate({
        path: 'additionalDetails',
        select: 'professionalInformation'
      })
      .exec();
    
    if (!user || !user.additionalDetails) {
      return res.status(404).json({ 
        success: false,
        message: "User or associated profile not found.",
      });
    }

    const userProfile = user.additionalDetails; 
    
    if (currentRole !== undefined) userProfile.professionalInformation.currentRole = currentRole;
    if (targetRole !== undefined) userProfile.professionalInformation.targetedRole = targetRole; 
    if (experience !== undefined) userProfile.professionalInformation.experienceLevel = experience;
    if (skills !== undefined) userProfile.professionalInformation.skills = skills;
    if (targetCompanies !== undefined) userProfile.professionalInformation.targetCompanies = targetCompanies;

    await userProfile.save(); 

    return res.status(200).json({ 
      success: true,
      message: "Professional details successfully updated.",
      updatedProfessionalDetails: userProfile.professionalInformation, 
    });

  } catch (error) {
    console.error("Error in updateUserProfessionalDetails controller:", error); 
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred while updating professional details. Please try again later.",
    });
  }
};

export const updateProfile = async (req, res) => {
  const { userId } = req.user;
  const profileImage = req.file;

  if (!profileImage) {
    return res.status(400).json({
      success: false,
      message: "Select profile",
    });
  }
  const profileTempPath = profileImage?.path;
  const fileExtension = profileImage.mimetype.split("/")[1];
  
  
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Not able to find user",
      });
    }

    const result = await uploadToCloudinary(
      profileTempPath,
      "simjob_users_profile",
      fileExtension,
      "image"
    );
    
    const secure_url = result?.secure_url;

    if (!secure_url) {
      return res.status(503).json({
        success: false,
        message: "Fail to upload, please try again after some time...",
      });
    }
    user.avatar = secure_url;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile Updated successfully",
      avatar:user.avatar
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

export const deleteAccount = async (req, res) => {
  const { userId } = req.user; 

  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction(); 

  try {
    const user = await User.findOne({ _id: userId }).select(
      "additionalDetails"
    ).session(mongoSession); 

    if (!user) {
      await mongoSession.abortTransaction(); 
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }
    
    if (!user.additionalDetails) {
        console.warn(`User ${userId} found but missing additionalDetails reference. Proceeding with other deletions.`);
    }

    await Analytics.findOneAndDelete({ user: userId }).session(mongoSession); 
    
    if (user.additionalDetails) {
        await Profile.findOneAndDelete({ _id: user.additionalDetails }).session(mongoSession);
    }
    
    await MockInterview.deleteMany({ user: userId }).session(mongoSession); 
    await OATest.deleteMany({ user: userId }).session(mongoSession);
    await Session.deleteMany({ user: userId }).session(mongoSession);     

    await User.findOneAndDelete({ _id: userId }).session(mongoSession);

    await mongoSession.commitTransaction();

    res.clearCookie("session_id");

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully.",
    });

  } catch (error) {
    await mongoSession.abortTransaction();
    console.error("Error in deleteAccount controller:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred while deleting the account. Please try again later.",
    });
  } finally {
    await mongoSession.endSession();
  }
};
