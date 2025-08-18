import Analytics from "../../models/Analytics.model.js";
import MockInterview from "../../models/MockInterview.model.js";
import OATest from "../../models/OATest.model.js";

export const getUserStats = async (req, res) => {
  const { userId } = req.user;
  try {
    const analytics = await Analytics.findOne({ user: userId });
    if (!analytics) {
      return res.status(401).json({
        success: false,
        message: "user analytics not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User analytics fetched",
      analytics,
    });
  } catch (err) {
    console.log("Error in getting user stats :: ", err);
    return res.status(500).json({
      success: false,
      message: "something went wrong while getting user stats",
    });
  }
};

export const getRecentSessions = async (req, res) => {
  const { userId } = req.user;
  try {
    const mockInterviewRecentSessions = await MockInterview.find({
      user: userId,
    }).limit(4);

    if (!mockInterviewRecentSessions) {
      return res.status(401).json({
        success: false,
        message: "Don't find any mock interviews",
      });
    }

    const oaRecentSessions = await OATest.find({ user: userId }).limit(4);
    if (!oaRecentSessions) {
      return res.status(401).json({
        success: false,
        message: "Don't find any online assessment session",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Successfully got recent sessions",
      mockInterviewRecentSessions,
      oaRecentSessions,
    });
  } catch (error) {
    console.log("Error in getting recent sessions :: ", error);
    return res.status(500).json({
      success: false,
      message: "Someting went wrong while getting recent sessions",
    });
  }
};

export const getHistory = async (req, res) => {
  const { userId } = req.user;

  try {
    const mockHistory = await MockInterview.find({ user: userId })
      .select(
        "mockCategory companyName skills role difficultyLevel duration feedback createdAt"
      )
      .sort(-1);

    const oaHistory = await OATest.find({ user: userId })
      .select(
        "oaCategory companies role difficulty duration feedback createdAt"
      )
      .sort(-1);

    return res.status(200).json({
      success: true,
      message: "Successfully got user history",
      mockHistory,
      oaHistory,
    });
  } catch (error) {
    console.log("Error in getting user history :: ", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while getting user history",
    });
  }
};

export const getUserProgress = async (req, res) => {};
