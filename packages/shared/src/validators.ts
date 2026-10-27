/**
 * Runtime validators for the fully dynamic configuration system
 * (Shared SPEC §1A). Web's Dynamic Form, Admin's Question Builder and
 * API validation all use these — that is what makes "add it in Admin
 * and it appears in the user flow, uncapped" work end to end.
 */
import { QUESTION_TYPES } from "./enums.js";
import type { ConfigAnswerValue, ConfigQuestion } from "./dtos/core.js";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateConfigQuestion(q: Partial<ConfigQuestion>): ValidationResult {
  const errors: string[] = [];
  if (!q.key?.trim()) errors.push("key is required");
  if (q.key && !/^[a-z][a-z0-9_]*$/.test(q.key)) {
    errors.push("key must be a stable snake_case identifier");
  }
  if (!q.label?.trim()) errors.push("label is required");
  if (!q.type || !(QUESTION_TYPES as readonly string[]).includes(q.type)) {
    errors.push("type must be a valid QuestionType");
  }
  if (
    (q.type === "single_choice" || q.type === "multi_choice") &&
    (!q.options || q.options.length === 0)
  ) {
    errors.push("choice questions require at least one option");
  }
  if (q.options) {
    const values = q.options.map((o) => o.value);
    if (new Set(values).size !== values.length) errors.push("option values must be unique");
  }
  return { valid: errors.length === 0, errors };
}

export function validateAnswer(
  question: ConfigQuestion,
  answer: ConfigAnswerValue | undefined,
): ValidationResult {
  const errors: string[] = [];
  if (answer === undefined) {
    if (question.required) errors.push(`"${question.key}" is required`);
    return { valid: errors.length === 0, errors };
  }
  const value = answer.value;

  if (
    answer.value === "custom" ||
    (typeof value === "string" && (answer as { customText?: string }).customText)
  ) {
    // Custom answers (v2.2): allowed unless this question locks them off.
    if (!question.allowCustomAnswer) {
      errors.push(`"${question.key}" does not allow a custom answer`);
    }
    const text = (answer as { customText?: string }).customText;
    if (answer.value === "custom" && !text?.trim()) {
      errors.push(`"${question.key}" custom answer requires customText`);
    }
    return { valid: errors.length === 0, errors };
  }

  switch (question.type) {
    case "single_choice": {
      if (typeof value !== "string") errors.push(`"${question.key}" expects one option`);
      else if (!question.options?.some((o) => o.value === value)) {
        errors.push(`"${question.key}" value is not one of its options`);
      }
      break;
    }
    case "multi_choice": {
      if (!Array.isArray(value)) errors.push(`"${question.key}" expects a list of options`);
      else {
        for (const v of value) {
          if (!question.options?.some((o) => o.value === v)) {
            errors.push(`"${question.key}" value "${v}" is not one of its options`);
          }
        }
      }
      break;
    }
    case "number":
    case "scale":
      if (typeof value !== "number") errors.push(`"${question.key}" expects a number`);
      break;
    case "boolean":
      if (typeof value !== "boolean") errors.push(`"${question.key}" expects true/false`);
      break;
    case "text":
    case "long_text":
      if (typeof value !== "string") errors.push(`"${question.key}" expects text`);
      break;
  }
  return { valid: errors.length === 0, errors };
}
