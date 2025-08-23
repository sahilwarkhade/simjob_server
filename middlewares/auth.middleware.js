import Session from "../models/Session.model.js";

const auth = async(req, res, next) => {
  const { session_id } = req.signedCookies;

  try {
    if (!session_id) {
      res.clearCookie("session_id");
      res.status(401).json({
        success: false,
        message: "Please do login",
      });
    }

    const userSession=await Session.findById(session_id);
    if(!userSession){
        return res.status(404).json({
            success:false,
            message:"Unauthorize, please do login"
        })
    }

    console.log("User Session :: ", userSession?.user);
    req.user.userId=userSession?.user;
    next()
  } catch (error) {
    console.log("Error in auth middleware :: ", error);
    return res.status(500).json({
      success: false,
      message: "Somrthing went wrong, please login again",
    });
  }
};

export default auth;
