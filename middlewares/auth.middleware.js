import { getSession } from "../utils/Sessions/index.js";


const auth = async (req, res, next) => {
  const { session_id } = req.signedCookies;
  try {
    if (!session_id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in.",
      });
    }

    const session = await getSession(session_id)
    if (!session) {
      res.clearCookie("session_id");
      return res.status(401).json({
        success: false,
        message: "Invalid session. Please log in again.",
      });
    }

    req.user = req.user || {};
    req.user.userId = session.userId;
    req.user.sessionId=session;
    next();
  } catch (error) {
    console.log("Error in auth middleware :: ", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong, please login again, auth",
    });
  }
};

export default auth;
