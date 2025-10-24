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
    const [mockInterviewResults, oaTestResults] = await Promise.all([
      MockInterview.find({ user: userId, status: "submitted" })
        .sort({ updatedAt: -1 })
        .limit(3)
        .lean(), 
      OATest.find({ user: userId, status: "submitted" })
        .sort({ updatedAt: -1 })
        .limit(3)
        .lean(),
    ]);

    const allRecentSessions = [
      ...mockInterviewResults.map((item) => ({
        ...item,
        category: item.mockCategory || null,
        difficulty: item.difficultyLevel || null,
        type: "interview",
      })),
      ...oaTestResults.map((item) => ({
        ...item,
        category: item.testCategory || null,
        type: "test",
      })),
    ];

    allRecentSessions.sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
    );

    const top5RecentSessions = allRecentSessions.slice(0, 5);

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
    const [mockHistory, oaHistory] = await Promise.all([
      MockInterview.find({ user: userId })
        .select(
          "mockCategory companyName skills role difficultyLevel duration feedback.overallSummary updatedAt score status"
        )
        .sort({ updatedAt: -1 })
        .lean(),
      OATest.find({ user: userId })
        .select(
          "testCategory companyName role difficulty duration feedback.overallSummary score updatedAt status"
        )
        .sort({ updatedAt: -1 })
        .lean(),
    ]);

    const combinedHistory = [
      ...mockHistory.map((item) => ({
        ...item,
        category: item.mockCategory || null,
        difficulty: item.difficultyLevel || null,
        type: "interview",
      })),
      ...oaHistory.map((item) => ({
        ...item,
        category: item.testCategory || null,
        type: "test",
      })),
    ];

    combinedHistory.sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
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
