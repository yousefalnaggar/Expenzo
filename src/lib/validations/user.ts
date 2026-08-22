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

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
export const ALLOWED_AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const AVATAR_FORMAT_ERROR =
  "That image format isn't supported (e.g. HEIC/HEIF). Please use PNG, JPEG, or WebP.";
export const AVATAR_SIZE_ERROR = "Image must be 2MB or smaller";

export const avatarSchema = z
  .instanceof(File)
  .refine((file) => ALLOWED_AVATAR_TYPES.includes(file.type), AVATAR_FORMAT_ERROR)
  .refine((file) => file.size <= MAX_AVATAR_BYTES, AVATAR_SIZE_ERROR);

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
