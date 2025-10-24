import { z } from "zod";
import fs from "fs/promises";
import mongoose from "mongoose";
import Analytics from "../../models/Analytics.model.js";
import MockInterview from "../../models/MockInterview.model.js";
import OATest from "../../models/OATest.model.js";
import Profile from "../../models/Profile.model.js";
import User from "../../models/User.model.js";
import { uploadToCloudinary } from "../../utils/Upload/uploadToCloudinary.js";
import { deleteAssetFromCloudinary } from "../../utils/Upload/deleteAssetFromClodinary.js";
import { invalidateAllUserSessions } from "../../utils/Sessions/index.js";
import {
  updatePersonalDetailsSchema,
  updateProfessionalDetailsSchema,
  updateProfileSchema,
} from "../../validators/profileValidators.js";

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
  try {
    const validatedBody = updatePersonalDetailsSchema.parse(req.body);
    const { userId } = req.user;

    const user = await User.findById(userId)
      .select("fullName additionalDetails")
      .populate({
        path: "additionalDetails",
        select: "personalInformation",
      });

    if (!user || !user.additionalDetails) {
      return res.status(404).json({
        success: false,
        message: "User or associated profile not found.",
      });
    }

    const { fullName, ...personalInfoUpdates } = validatedBody;
    const userProfile = user.additionalDetails;

    if (fullName) {
      user.fullName = fullName;
    }

    Object.assign(userProfile.personalInformation, personalInfoUpdates);

    await Promise.all([user.save(), userProfile.save()]);

    return res.status(200).json({
      success: true,
      message: "Personal details successfully updated.",
      updatedPersonalDetails: userProfile.personalInformation,
      updatedFullName: user.fullName,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid input data",
        errors: error.flatten().fieldErrors,
      });
    }

    console.error("Error in updateUserPersonalDetails controller:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred while updating personal details.",
    });
  }
};

export const updateUserProfessionalDetails = async (req, res) => {
  try {
    const validatedBody = updateProfessionalDetailsSchema.parse(req.body);
    const { userId } = req.user;

    const user = await User.findById(userId)
      .select("additionalDetails")
      .populate({
        path: "additionalDetails",
        select: "professionalInformation",
      });

    if (!user || !user.additionalDetails) {
      return res.status(404).json({
        success: false,
        message: "User or associated profile not found.",
      });
    }

    const userProfile = user.additionalDetails;

    const { experience, targetRole, ...otherUpdates } = validatedBody;

    const updates = { ...otherUpdates };
    if (experience) updates.experienceLevel = experience;
    if (targetRole) updates.targetedRole = targetRole;

    Object.assign(userProfile.professionalInformation, updates);

    await userProfile.save();

    return res.status(200).json({
      success: true,
      message: "Professional details successfully updated.",
      updatedProfessionalDetails: userProfile.professionalInformation,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log(error.flatten().fieldErrors,)
      return res.status(400).json({
        success: false,
        message: "Invalid input data",
        errors: error.flatten().fieldErrors,
      });
    }

    console.error("Error in updateUserProfessionalDetails controller:", error);
    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while updating professional details.",
    });
  }
};

export const updateProfile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "A profile image file is required.",
    });
  }

  const profileTempPath = req.file.path;
  let cloudinaryResult;

  try {
    updateProfileSchema.parse({
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    const { userId } = req.user;
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const fileExtension = req.file.mimetype.split("/")[1];
    cloudinaryResult = await uploadToCloudinary(
      profileTempPath,
      "simjob_users_profile",
      fileExtension,
      "image"
    );

    if (!cloudinaryResult?.secure_url) {
      return res.status(503).json({
        success: false,
        message: "Failed to upload image. Please try again.",
      });
    }

    user.avatar = cloudinaryResult.secure_url;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      avatar: user.avatar,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid file provided.",
        errors: error.flatten().fieldErrors,
      });
    }

    if (cloudinaryResult?.public_id) {
      await deleteAssetFromCloudinary(cloudinaryResult.public_id);
    }

    console.log("Error in updating profile :: ", error);
    return res.status(500).json({
      success: false,
      message:
        "An unexpected server error occurred while updating the profile.",
    });
  } finally {
    await fs.unlink(profileTempPath);
  }
};

export const deleteAccount = async (req, res) => {
  const { userId } = req.user;

  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();

  try {
    const user = await User.findOne({ _id: userId })
      .select("additionalDetails")
      .session(mongoSession);

    if (!user) {
      await mongoSession.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (!user.additionalDetails) {
      console.warn(
        `User ${userId} found but missing additionalDetails reference. Proceeding with other deletions.`
      );
    }

    await Analytics.findOneAndDelete({ user: userId }).session(mongoSession);

    if (user.additionalDetails) {
      await Profile.findOneAndDelete({ _id: user.additionalDetails }).session(
        mongoSession
      );
    }

    await MockInterview.deleteMany({ user: userId }).session(mongoSession);
    await OATest.deleteMany({ user: userId }).session(mongoSession);
    await invalidateAllUserSessions(user._id);
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
      message:
        "An unexpected error occurred while deleting the account. Please try again later.",
    });
  } finally {
    await mongoSession.endSession();
  }
};

