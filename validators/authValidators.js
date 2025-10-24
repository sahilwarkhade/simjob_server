import { z } from "zod";

export const signupSchema = z
  .object({
    fullName: z
      .string()
      .min(3, { message: "Full name must be at least 3 characters long." })
      .regex(/^[a-zA-Z\s]+$/, {
        message: "Full name can only contain letters and spaces.",
      }),

    email: z.email({ message: "Please enter a valid email address." }),

    password: z
      .string()
      .min(5, { message: "Password must be at least 5 characters long." }),

    confirmPassword: z.string(),

    otp: z
      .string()
      .regex(/^\d{6}$/, { message: "OTP must be exactly 6 digits." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.email({ message: "Please enter a valid email address." }),

  password: z.string().min(1, { message: "Password is required." }),
});

export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: z
      .string()
      .min(5, { message: "New password must be at least 5 characters long." }),
    newConfirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.newConfirmPassword, {
    message: "New passwords do not match.",
    path: ["newConfirmPassword"],
  });

export const sendOtpSchema = z.object({
  email: z.email({ message: "Please provide a valid email address." }),

  type: z.enum(["signup", "forget-password"], {
    errorMap: () => ({
      message:
        'Invalid OTP type specified. Must be "signup" or "forget-password".',
    }),
  }),
});

export const verifyOtpSchema = z.object({
  email: z.email({ message: "Please provide a valid email address." }),

  otp: z
    .string()
    .regex(/^\d{6}$/, { message: "OTP must be exactly 6 digits." }),
});

export const forgetPasswordSchema = z
  .object({
    email: z.email({ message: "Please provide a valid email address." }),

    newPassword: z
      .string()
      .min(5, { message: "New password must be at least 5 characters long." }),

    newConfirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.newConfirmPassword, {
    message: "Passwords do not match.",
    path: ["newConfirmPassword"],
  });
