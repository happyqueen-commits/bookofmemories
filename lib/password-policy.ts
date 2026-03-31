import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[A-Za-z])(?=.*\d).+$/;

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Пароль должен содержать минимум ${PASSWORD_MIN_LENGTH} символов.`)
  .regex(PASSWORD_COMPLEXITY_REGEX, "Пароль должен содержать минимум одну букву и одну цифру.");

export const passwordRequirements = [
  `Минимум ${PASSWORD_MIN_LENGTH} символов`,
  "Минимум одна буква",
  "Минимум одна цифра"
] as const;
