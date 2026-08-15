import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Required").max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color, e.g. #64748b"),
});
export type CategoryInput = z.infer<typeof categorySchema>;
