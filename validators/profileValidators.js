import { z } from "zod";

export const updatePersonalDetailsSchema = z
  .object({
    fullName: z
      .string()
      .min(3, { message: "Full name must be at least 3 characters." })
      .or(z.literal(""))
      .optional(),

    bio: z
      .string()
      .max(500, { message: "Bio cannot exceed 500 characters." })
      .or(z.literal(""))
      .optional(),

    gender: z
      .enum(["Male", "Female", "Prefer not to say"], {
        errorMap: () => ({ message: "Please select a valid gender." }),
      })
      .or(z.literal(""))
      .optional(),

    mobileNumber: z
      .string()
      .regex(/^\+?[1-9]\d{9,14}$/, {
        message: "Please enter a valid mobile number.",
      })
      .or(z.literal(""))
      .optional(),

    address: z
      .string()
      .max(255, { message: "Address cannot exceed 255 characters." })
      .or(z.literal(""))
      .optional(),

    website: z.url({ message: "Please enter a valid website URL." }).optional(),

    linkedinUrl: z
      .url({ message: "Please enter a valid LinkedIn URL." })
      .refine((url) => url.includes("linkedin.com"), {
        message: "URL must be a valid LinkedIn profile URL.",
      })
      .or(z.literal(""))
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update.",
  });

export const updateProfessionalDetailsSchema = z
  .object({
    currentRole: z
      .string()
      .min(3, { message: "Current role must be at least 3 characters." })
      .max(100, { message: "Current role cannot exceed 100 characters." })
      .or(z.literal(""))
      .optional(),

    targetRole: z
      .string()
      .min(3, { message: "Target role must be at least 3 characters." })
      .max(100, { message: "Target role cannot exceed 100 characters." })
      .or(z.literal(""))
      .optional(),

    experience: z
      .enum(
        [
          "Internship",
          "Entry Level",
          "Junior",
          "Mid Level",
          "Senior",
          "Lead",
          "Principal",
        ],
        {
          errorMap: () => ({
            message: "Please select a valid experience level.",
          }),
        }
      )
      .optional(),

    skills: z
      .array(z.string().min(1, { message: "Skills cannot be empty strings." }))
      .max(50, { message: "You can add a maximum of 50 skills." })
      .optional(),

    targetCompanies: z
      .array(
        z.string().min(1, { message: "Company names cannot be empty strings." })
      )
      .max(50, { message: "You can add a maximum of 50 target companies." })
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update.",
  });

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

export const updateProfileSchema = z.object({
  mimetype: z.string().refine((type) => ACCEPTED_IMAGE_TYPES.includes(type), {
    message:
      "Invalid file type. Only JPEG, PNG, WEBP, and GIF images are allowed.",
  }),
  size: z.number().max(MAX_FILE_SIZE_BYTES, {
    message: `File size cannot exceed ${MAX_FILE_SIZE_MB}MB.`,
  }),
});
