import { describe, expect, it } from "vitest";
import {
  AUDIT_AREA_KEYS,
  BIBLE_MASTER_LIST_KEYS,
  BIBLE_SECTION_KEYS,
  JOB_ACTIONS,
  PACKAGE_DELIVERABLES,
  PIPELINE_STEPS,
  REGISTRY_TYPES,
  RUN_STAGES,
  VISUAL_ARCHETYPE_FIELDS,
  estimateDurationSec,
  isPackageDeliverableKey,
  validateAnswer,
  validateConfigQuestion,
} from "../src/index.js";

/**
 * Contract test — the counts the design programme settled. If one of
 * these changes, the change is deliberate and the specs move with it.
 */
describe("shared contract", () => {
  it("package deliverables: 19 deliverables + 2 records = 21 entries", () => {
    expect(PACKAGE_DELIVERABLES).toHaveLength(21);
    const keys = PACKAGE_DELIVERABLES.map((d) => d.key);
    expect(new Set(keys).size).toBe(21);
    expect(isPackageDeliverableKey("viewerGlossary")).toBe(true);
    expect(isPackageDeliverableKey("completionCertificate")).toBe(true);
    expect(isPackageDeliverableKey("notARealKey")).toBe(false);
  });

  it("15 job actions", () => {
    expect(JOB_ACTIONS).toHaveLength(15);
  });

  it("11 registry types", () => {
    expect(REGISTRY_TYPES).toHaveLength(11);
    expect(REGISTRY_TYPES).toContain("propsWardrobe");
  });

  it("14 Bible sections, 7 master lists, 12 audit areas", () => {
    expect(BIBLE_SECTION_KEYS).toHaveLength(14);
    expect(BIBLE_MASTER_LIST_KEYS).toHaveLength(7);
    expect(AUDIT_AREA_KEYS).toHaveLength(12);
  });

  it("17 pipeline steps in order; 11 run stages", () => {
    expect(PIPELINE_STEPS).toHaveLength(17);
    expect(PIPELINE_STEPS.map((s) => s.stepNo)).toEqual(
      Array.from({ length: 17 }, (_, i) => i + 1),
    );
    expect(PIPELINE_STEPS.filter((s) => s.optional)).toHaveLength(2);
    expect(RUN_STAGES).toHaveLength(11);
  });

  it("visual archetype schema has 10 fields", () => {
    expect(VISUAL_ARCHETYPE_FIELDS).toHaveLength(10);
  });

  it("estimateDurationSec: 150 words at 150 wpm = 60s", () => {
    expect(estimateDurationSec(150, 150)).toBe(60);
    expect(estimateDurationSec(0, 150)).toBe(0);
  });

  it("question + answer validators enforce the dynamic rules", () => {
    const q = {
      key: "tone_preset",
      label: "Tone",
      type: "single_choice" as const,
      scope: "project" as const,
      required: true,
      allowCustomAnswer: true,
      options: [{ value: "warm", label: "Warm" }],
    };
    expect(validateConfigQuestion(q).valid).toBe(true);
    expect(validateAnswer(q as never, { value: "warm" }).valid).toBe(true);
    expect(validateAnswer(q as never, { value: "nope" }).valid).toBe(false);
    expect(
      validateAnswer(q as never, { value: "custom", customText: "dry wit" }).valid,
    ).toBe(true);
  });
});
