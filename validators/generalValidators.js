import { z } from "zod";

export const contactUsSchema = z.object({
  email: z.email({ message: "Please provide a valid email address." }),

  fullName: z
    .string({ required_error: "Full name is required." })
    .min(3, { message: "Full name must be at least 3 characters long." }),

  subject: z
    .string({ required_error: "Subject is required." })
    .min(5, { message: "Subject must be at least 5 characters long." }),

  query: z
    .string({ required_error: "Please select a query type." })
    .min(1, { message: "Query type cannot be empty." }),

  message: z
    .string({ required_error: "Message is required." })
    .min(10, { message: "Message must be at least 10 characters long." })
    .max(5000, { message: "Message cannot exceed 5000 characters." }),
});
