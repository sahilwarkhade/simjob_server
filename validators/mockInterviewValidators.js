import { z } from "zod";

export const companySpecificMockSchema = z.object({
  mockCategory: z.literal("companyspecific", {
    errorMap: () => ({
      message:
        "This endpoint only supports the 'companyspecific' mock category.",
    }),
  }),

  companyName: z
    .string({ required_error: "Company name is required." })
    .min(2, { message: "Company name must be at least 2 characters long." })
    .max(100, { message: "Company name cannot exceed 100 characters." }),

  experienceLevel: z.enum(
    [
      "Internship",
      "Entry Level",
      "Junior",
      "Mid Level",
      "Senior",
      "Lead",
      "Principal",
    ],
    { errorMap: () => ({ message: "Please select a valid experience level." }) }
  ),

  role: z
    .string({ required_error: "Role is required." })
    .min(3, { message: "Role must be at least 3 characters long." })
    .max(100, { message: "Role cannot exceed 100 characters." }),
});

export const skillBasedMockSchema = z.object({
  mockCategory: z.literal("skillbased", {
    errorMap: () => ({
      message: "This endpoint only supports the 'skillbased' mock category.",
    }),
  }),

  skills: z
    .array(z.string())
    .min(1, { message: "You must select at least one skill." }),

  experienceLevel: z.enum(
    [
      "Internship",
      "Entry Level",
      "Junior",
      "Mid Level",
      "Senior",
      "Lead",
      "Principal",
    ],
    { errorMap: () => ({ message: "Please select a valid experience level." }) }
  ),

  difficulty: z.enum(["Easy", "Medium", "Hard"], {
    errorMap: () => ({
      message: 'Difficulty must be one of "Easy", "Medium", or "Hard".',
    }),
  }),
});
