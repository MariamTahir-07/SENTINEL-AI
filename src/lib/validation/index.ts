import { z } from "zod/v4";

export const textAnalysisSchema = z.object({
  text: z.string().min(1, "Text is required.").max(10000, "Text is too long. Maximum 10,000 characters."),
  context: z.enum(["sms", "whatsapp", "email", "social", "general"]).default("general"),
});

export const urlAnalysisSchema = z.object({
  url: z.string().min(1, "URL is required.").max(2048, "URL is too long."),
});

export const signupSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters.").max(100),
  email: z.email("Invalid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string(),
  preferredLanguage: z.string().default("en"),
});

export const loginSchema = z.object({
  email: z.email("Invalid email address."),
  password: z.string().min(1, "Password is required."),
});

export const fileUploadSchema = z.object({
  size: z.number().max(10 * 1024 * 1024, "File size must be under 10MB."),
  type: z.string(),
});

export const imageUploadSchema = fileUploadSchema.extend({
  type: z.string().refine(
    (t) => ["image/png", "image/jpeg", "image/webp", "image/gif"].includes(t),
    "Only PNG, JPEG, WebP, and GIF images are supported."
  ),
});

export const audioUploadSchema = fileUploadSchema.extend({
  type: z.string().refine(
    (t) => [
      "audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg",
      "audio/webm", "audio/mp4", "audio/x-m4a",
    ].includes(t),
    "Supported audio formats: MP3, WAV, OGG, WebM, M4A."
  ),
});
