import { z } from "zod";
import { emailQueue } from "../../config/bullMq.js";
import { generateContactEmail } from "../../templates/Email/contactus.js";
import { contactUsSchema } from "../../validators/generalValidators.js";

export const contactUsController = async (req, res) => {
  try {
    const validatedBody = contactUsSchema.parse(req.body);
    const { email, fullName, subject, query, message } = validatedBody;

    const template = generateContactEmail(email, fullName, subject, query, message);
    const title = "Your request has been received";

    await emailQueue.add(
      "contact",
      { email, template, title },
      { jobId: `${Date.now()}-${email}` }
    );

    return res.status(200).json({
      success: true,
      message: "Your message has been sent successfully. We will get back to you shortly.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid input data",
        errors: error.flatten().fieldErrors,
      });
    }

    console.log("Error in contact us controller:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred. Please try again later.",
    });
  }
};
