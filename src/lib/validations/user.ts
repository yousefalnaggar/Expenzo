import { z } from "zod";
import { passwordSchema } from "@/lib/validations/auth";

export const currencySchema = z.object({
  currency: z.enum(["USD", "EGP", "EUR"]),
});
export type CurrencyInput = z.infer<typeof currencySchema>;

export const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
});
export type ProfileInput = z.infer<typeof profileSchema>;

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp"];

export const avatarSchema = z
  .instanceof(File)
  .refine((file) => file.size <= MAX_AVATAR_BYTES, "Image must be 2MB or smaller")
  .refine(
    (file) => ALLOWED_AVATAR_TYPES.includes(file.type),
    "Image must be a PNG, JPEG, or WebP file",
  );

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Required"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
