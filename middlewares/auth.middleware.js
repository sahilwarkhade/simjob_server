import Session from "../models/Session.model.js";

const auth = async (req, res, next) => {
  const { session_id } = req.signedCookies;

  try {
    if (!session_id) {
      res.clearCookie("session_id");
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in.",
      });
    }

    const userSession = await Session.findById(session_id);
    if (!userSession) {
      res.clearCookie("session_id");
      return res.status(401).json({
        success: false,
        message: "Invalid session. Please log in again.",
      });
    }

    console.log("User Session :: ", userSession?.user);

    req.user = req.user || {};
    req.user.userId = userSession.user;
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
