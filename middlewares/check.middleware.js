import Session from "../models/Session.model.js";

export const checkLogin=async(req,res)=>{
  const { session_id } = req.signedCookies;
  try {
    const session=await Session.findById(session_id).lean();
    if(!session){
      return res.status(401).json({
        success:false,
        message:"Not logged in"
      })
    }

    return res.status(200).json({
      success:true,
      message:"Already logged in"
    })
  } catch (error) {
    console.log("ERROR in check", error)
    return res.status(500).json({
      success:false,
      message:"Something went wrong"
    })
  }
}