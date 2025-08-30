import Analytics from "../../models/Analytics.model.js";
import MockInterview from "../../models/MockInterview.model.js";
import OATest from "../../models/OATest.model.js";

export const getUserStats = async (req, res) => {
  const { userId } = req.user;
  try {
    const analytics = await Analytics.findOne({ user: userId }).select(
      "totalMockInterviews totalOaTests averageMockScore averageOaScore"
    );

    if (!analytics) {
      return res.status(404).json({
        success: false,
        message: "user analytics not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User analytics fetched",
      userStats: analytics,
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
    const mockInterviewResults = await MockInterview.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(3);

    const oaTestResults = await OATest.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(3);

    const allRecentSessions = [...mockInterviewResults, ...oaTestResults];

    allRecentSessions.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );

    let top5RecentSessions = allRecentSessions;
    if (allRecentSessions.length > 5) {
      top5RecentSessions = allRecentSessions.slice(0, 5);
    }

    return res.status(200).json({
      success: true,
      message: "Successfully retrieved 5 most recent sessions.",
      recentSessions: top5RecentSessions,
    });
  } catch (error) {
    console.error("Error in getRecentSessions controller:", error);
    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while retrieving recent sessions. Please try again later.",
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
      .sort({ createdAt: -1 })
      .lean();

    const oaHistory = await OATest.find({ user: userId })
      .select(
        "oaCategory companies role difficulty duration feedback createdAt"
      )
      .sort({ createdAt: -1 })
      .lean();

    const combinedHistory = [
      ...mockHistory.map((item) => ({ ...item, type: "mockInterview" })),
      ...oaHistory.map((item) => ({ ...item, type: "oaTest" })),
    ];

    combinedHistory.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );

    return res.status(200).json({
      success: true,
      message: "User history retrieved successfully.",
      history: combinedHistory,
    });
  } catch (error) {
    console.error("Error in getHistory controller:", error);
    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while retrieving user history. Please try again later.",
    });
  }
};

export const getUserProgress = async (req, res) => {};
