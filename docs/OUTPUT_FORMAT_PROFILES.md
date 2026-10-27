# Output Format Profiles — Per-Tool Script Format Rules (2026-10-27)

User direction: format rules deserve their own rule page, because the
AI video / audio / image tools that consume our scripts each accept a
**specific** script format. This supersedes the looser "formatting is
an export render" note in docs/SCENE_BREAKDOWN.md: renders are driven
by these profiles.

## Why this exists

The user's Phase 3 file contradicted itself on formatting (plain text,
no bold, no separators, 3 blank lines — vs a bold-markdown template
with `---` separators and 2 blank lines). Both rule sets were right —
**for different target tools**. One universal format is the mistake;
per-tool profiles are the fix:

- A TTS / voice tool wants clean plain text (or SSML): markdown
  symbols get read aloud or break synthesis.
- An AI video tool wants one descriptive prompt per clip, often with
  a hard clip-duration cap — narration text is useless to it.
- An AI image tool wants a prompt + parameters, not scenes.
- A human editor wants a structured sheet/CSV with fixed columns.

## The model

**Output Format Profile** (Admin library `/format-profiles`, dynamic,
unlimited — same pattern as Question Library / Annex Library):

```
{ key, name, toolType: video | audio | image | edit,
  textStyle: plain | markdown | ssml | structured_fields,
  separator (e.g. none | "---" | blank lines count),
  speakerLabelStyle (e.g. "NARRATOR:" | none | field),
  blankLinesBetweenScenes,
  maxCharsPerUnit? (per prompt / per line),
  clipDurationCapSec? (video tools — drives handoff clip-splitting),
  fields[] (which scene fields the tool receives, in order),
  languageNotes?, notes }
```

- Project config's `asset_method` (Package handoff question) maps to
  a default profile; the creator can pick a different profile per
  Production Package in the Web Package screen, with a **render
  preview** before download.
- The **AI Generation Handoff** renders scenes through the profile:
  only the profile's `fields[]`, in its `textStyle`, with its
  separator/labels; clip-splitting (clip-A/clip-B + stitching note)
  uses the profile's `clipDurationCapSec`.
- Clean VO export likewise renders through the chosen **audio**
  profile (plain text or SSML; SSML gets break tags + pronunciation
  from Bible §10 Glossary).
- Audit/validation: a rendered handoff is checked against its
  profile (e.g. no markdown characters in a plain-text profile, no
  unit over maxCharsPerUnit) before the Package is marked ready.

## Seed profiles (Admin-editable starting set)

1. **Plain Text VO — Generic TTS / Human Narrator** (audio, plain):
   no markdown symbols, no separators, speaker labels uppercase
   (`NARRATOR:`), exactly 3 blank lines between scenes, narration
   only + timing notes. (The Phase 3 checklist's rule set.)
2. **SSML Voice** (audio, ssml): SSML tags allowed, `<break>` pauses
   at scene boundaries, pronunciation lexicon from the Bible
   Glossary, no visible markdown.
3. **AI Video — Veo-style** (video, structured_fields): one
   descriptive prompt per clip, clip cap 8s, fields = visual prompt,
   camera terms, negative prompt; narration delivered as separate
   timed text, not inside the prompt.
4. **AI Video — Generic Prompt Tools** (video, structured_fields):
   prompt + negative prompt fields, configurable clip cap, on-screen
   text supplied as a separate field (tools render text poorly).
5. **AI Image — Prompt Tools** (image, structured_fields): image
   prompt + style parameters per scene, locked registry descriptions
   appended (character/place consistency).
6. **Editor Timeline Sheet** (edit, structured_fields): the scene
   breakdown CSV/sheet with fixed column order (scene, timing,
   narration, visual, prompts, SFX, music, on-screen text) — the
   markdown-style structured variant. (The Phase 3 template's rule
   set, in its proper home.)

New tools = new profiles in Admin. No code change, no cap — the same
fully-dynamic principle as questions, annexes and registries.
