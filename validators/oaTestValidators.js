import { z } from "zod";
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
export const runCodeSchema = z.object({
  languageId: z
    .number({ required_error: "Language ID is required." })
    .int()
    .positive({ message: "Language ID must be a positive number." }),

  sourceCode: z
    .string({ required_error: "Source code is required." })
    .min(1, { message: "Source code cannot be empty." }),

  id: z
    .string({ required_error: "Question ID is required." })
    .regex(objectIdRegex, { message: "Invalid Test ID format." }),
});

export const submitAnswerSchema = z.object({
  sectionId: z
    .string({ required_error: "Section ID is required." })
    .regex(objectIdRegex, { message: "Invalid Test ID format." }),

  questionId: z
    .string({ required_error: "Question ID is required." })
    .regex(objectIdRegex, { message: "Invalid Test ID format." }),

  problemId: z
    .string({ required_error: "Problem ID is required." })
    .regex(objectIdRegex, { message: "Invalid Test ID format." }),

  programmingLanguage: z.enum(["javascript", "python", "java", "cpp", "c"], {
    errorMap: () => ({
      message: "Please select a supported programming language.",
    }),
  }),

  sourceCode: z
    .string({ required_error: "Source code is required." })
    .min(1, { message: "Source code cannot be empty." }),

  languageId: z
    .number({ required_error: "Language ID is required." })
    .int()
    .positive({ message: "A valid language ID is required." }),
});

export const submitSectionSchema = z.object({
  sectionId: z
    .string({ required_error: "Section ID is required." })
    .regex(objectIdRegex, { message: "Invalid Test ID format." }),

  userAnswer: z
    .record(
      z.string().regex(objectIdRegex, { message: "Invalid Test ID format." }),
      z.union([
        z.string().min(1, { message: "Answer cannot be an empty string." }),
        z
          .array(z.string())
          .min(1, { message: "Answer array cannot be empty." }),
      ]),
      { required_error: "User answers are required." }
    )
    .refine((obj) => Object.keys(obj).length > 0, {
      message: "At least one answer must be submitted.",
    }),
});

export const submitTestSchema = z.object({
  testId: z
    .string({ required_error: "Test ID is required." })
    .regex(objectIdRegex, { message: "Invalid Test ID format." }),
});

export const generateCompanySpecificTestSchema = z.object({
  testCategory: z.literal("companyspecific", {
    errorMap: () => ({
      message:
        "This endpoint only supports the 'companyspecific' test category.",
    }),
  }),

  companyName: z
    .string({ required_error: "Company name is required." })
    .min(2, { message: "Company name must be at least 2 characters long." }),

  role: z
    .string({ required_error: "Role is required." })
    .min(3, { message: "Role must be at least 3 characters long." }),

  experienceLevel: z.enum(
     ["Internship", "Entry Level", "Junior", "Mid Level", "Senior", "Lead", "Principal"],
    { errorMap: () => ({ message: "Please select a valid experience level." }) }
  ),
});

export const generatePracticeTestSchema = z.object({
  testCategory: z.literal("practice", {
    errorMap: () => ({
      message: "This endpoint only supports the 'practice' test category.",
    }),
  }),

  difficulty: z.enum(["Easy", "Medium", "Hard"], {
    errorMap: () => ({
      message: 'Difficulty must be "Easy", "Medium", or "Hard".',
    }),
  }),

  userSelectedSections: z
    .array(z.string())
    .min(1, { message: "Please select at least one section." }),

  specialInstructions: z.string().optional(),
});
