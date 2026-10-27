/** Platform settings defaults (Admin-tunable via platform_settings). */
export const PLATFORM_DEFAULTS = {
  /** Credit cost per job action (base units; per-unit actions multiply). */
  jobCosts: {
    topic_generate: 5,
    topic_evaluate: 1,
    research_run: 10,
    bible_generate: 8,
    outline_generate: 5,
    script_generate: 10,
    scene_generate: 10,
    audit_run: 6,
    audit_autofix: 4,
    package_generate: 3,
    asset_research: 5,
    publishing_generate: 3,
    insights_generate: 4,
    embedding_index: 1,
    export_generate: 2,
  } as Record<string, number>,
  auditPassThreshold: 70,
  auditWeightsStandard: {
    factualAccuracy: 16, sourceReliability: 12, originality: 10, narrativeCoherence: 10,
    engagement: 10, pacing: 8, continuity: 8, productionFeasibility: 8, repetition: 6,
    durationFit: 6, bibleCompliance: 6,
  } as Record<string, number>,
  auditWeightsBrand: {
    factualAccuracy: 14, sourceReliability: 11, originality: 9, narrativeCoherence: 9,
    engagement: 9, pacing: 7, continuity: 7, productionFeasibility: 7, repetition: 5,
    durationFit: 5, bibleCompliance: 7, brandCompliance: 10,
  } as Record<string, number>,
  similarityThresholds: { topicDedupe: 0.82, doNotRepeat: 0.82, originality: 0.85 },
  featureFlags: { module16_assets: true, module17_publishing: true, webResearchFallback: true },
  concurrentJobCap: 3,
  uploadMaxBytes: {
    scene_reference: 25 * 1024 * 1024,
    brand_asset: 50 * 1024 * 1024,
    asset_item: 100 * 1024 * 1024,
    document: 25 * 1024 * 1024,
    other: 25 * 1024 * 1024,
  } as Record<string, number>,
  uploadAllowedTypes: [
    "image/png", "image/jpeg", "image/webp", "image/svg+xml",
    "application/pdf", "text/plain", "text/markdown",
    "font/woff", "font/woff2", "audio/mpeg", "audio/wav", "video/mp4",
  ],
  sceneRangeSize: 25,
  auditRerunFullThreshold: 0.4, // changed-scene ratio above which re-audit is full
} as const;

export type PlatformSettings = typeof PLATFORM_DEFAULTS;
