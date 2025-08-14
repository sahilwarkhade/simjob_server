import { contactUsEmail } from "../../Templates/Email/contactus"
import { mailSender } from "../../utils/SendEmail"

export const contactUsController = async (req, res) => {
  const { email, fullName, subject, query, message } = req.body
  console.log(req.body)
  try {
    const emailRes = await mailSender(
      email,
      "Your Data send successfully",
      contactUsEmail(email, fullName, subject, query, message)
    )
    console.log("Email Res ", emailRes)
    return res.json({
      success: true,
      message: "Email send successfully",
    })
  } catch (error) {
    console.log("Error", error)
    console.log("Error message :", error.message)
    return res.json({
      success: false,
      message: "Something went wrong...",
    })
  }
}