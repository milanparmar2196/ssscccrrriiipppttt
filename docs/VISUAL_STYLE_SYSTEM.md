# Visual Style System v2 — Archetype-First (2026-10-27)

Rebuild of the user's `VISUAL_STYLE_MASTER_DATABASE___500.txt`
(34 of 500 rows present; review: docs/USER_FILES_REVIEW.md).

**The fix:** the old file repeated near-identical rows per niche. The
real asset inside it was ~13 **archetypes**. v2 defines each archetype
**fully, once** (all 10 schema fields — including the Texture and
Graphics columns the old table dropped, and a *distinct* Motion per
archetype instead of the copy-pasted one), then maps every niche to an
archetype + small per-niche **overrides** (deltas only). A project's
Bible Visual section (§5) = archetype snapshot + overrides.
**Resolution order (C-block, mirrors the registry resolution in
A8):** a niche-level mapping row wins over its category row; the
category row wins over the default; a niche with **no** row at
either level uses **A13 Editorial Documentary** (the generalist
default). Overrides are deltas on the resolved archetype — they
never redefine schema fields wholesale, and a project may further
override in its Bible Visual section (project > niche > category >
default).

**Dual-archetype field split (D5, resolved 2026-10-27):** where a
mapping row gives a niche TWO archetypes (a primary + a secondary),
fields resolve by **owner group**, not winner-takes-all:

| Schema field | Owner |
|---|---|
| Visual Language | primary (composition) |
| Camera/Lens | primary (composition) |
| Motion | primary (motion/pacing) |
| Thumbnail | primary (composition of the hero frame; its colours still come from the resolved Palette) |
| Palette | secondary |
| Lighting | secondary |
| Texture | secondary |
| Graphics | secondary (surface treatment — assigned via this documented configuration; changeable in Admin's field-owner settings) |
| AI Prompt Keywords (base) | **union** — both archetypes' keywords merge (additive, cannot conflict) |
| Avoid | **union** — both avoid lists merge; if one archetype *requires* what the other avoids, that's an incompatibility → flagged for Admin review, never resolved by guessing |

- **Fallback:** if the owning archetype has no value for a field,
  the other archetype's value is used when compatible; if neither
  has one, the existing default chain applies (category row → A13).
- **Source recording:** the resolved Bible Visual stores, per
  field, `{ value, source: primary | secondary | union |
  project_override | default, archetypeId }` — every value's origin
  is inspectable, and Admin's mapping view shows both archetypes +
  the resolved fields with their sources.
- **Precedence interaction:** the mapping row is chosen FIRST by
  the existing precedence (niche → category → A13) — that row
  determines which primary/secondary pair (or single archetype)
  applies; the field split then resolves within the pair.
  **Project Bible overrides apply LAST, per field**, are recorded
  as `project_override`, and are never silently overwritten by
  re-resolution: if a mapping changes later, existing projects
  keep their snapshotted resolution; the change reaches a project
  only through a new Bible version (the normal approval flow).
  Locked runs are likewise frozen to their snapshot.
- **Validation of the existing mappings (done with this rule):**
  most "dual" rows are NOT simultaneous pairs — they are
  replacement overrides (e.g. Horror → A7: the niche row simply
  names A7 as its single archetype; precedence handles it) or
  **contextual splits** (Geography: A1 for map scenes, A10 for
  place scenes — the row declares the content kinds, and the split
  applies per scene kind, not per field). Two rows are **flagged
  ambiguous, not guessed** — both were recorded in the seed's
  dualMappingReview and **resolved by the user on 2026-10-27**:
  Music history is a **contextual split by era** (pre-1900 → A6
  Introspective; 1900 onward → A13 Editorial), and Farming stories
  are a **true dual pair: A14 Naturalist primary + A10 Adventure
  secondary** under this field split. No flagged rows remain.
- **Worked examples:** *Conflict* — niche pair (A13 primary, A7
  secondary): Motion comes from A13, Palette from A7; both are
  recorded with sources. *Missing owner value* — secondary has no
  Lighting value: primary's Lighting is used (source recorded as
  primary-fallback). *Union field* — both archetypes list prompt
  keywords: the resolved set is the merge, source `union`.
  *Project override* — the project's Bible sets Palette directly:
  source `project_override`; a later mapping edit does not change
  it — only a new Bible version can. Scene
image prompt = archetype keywords + the scene visual + locked
descriptions from Character/Product/Place registries.

Global production rules (kept from the user's file): one visual
identity per video unless the story changes era/place/emotion on
purpose; palette is guidance, not forced colour; character, wardrobe,
architecture, props, period, lighting stay consistent across scenes;
documentary = believable, period-appropriate, source-faithful;
educational = clarity over spectacle, readable sparse labels;
devotional/mythological = distinguish traditional representation from
cinematic interpretation when accuracy matters.

Schema per archetype: Visual Language · Palette · Lighting ·
Camera/Lens · Motion · Texture · Graphics · Thumbnail · AI Prompt
Keywords (base) · Avoid.

---

## Part A — The 16 Archetypes

**A1. Cinematic Historical Documentary** *(from user rows 2, 3, 14)*
Language: period reconstruction + archival textures + maps. Palette:
earth / bronze / parchment / charcoal. Lighting: warm directional key,
smoky atmosphere. Camera: 24mm environments, 50mm portraits, aerial
maps. Motion: slow push-ins, parallax layers, motivated tracking.
Texture: film grain, aged paper, tactile stone/wood/metal. Graphics:
minimal era-styled captions, aged-map overlays. Thumbnail: hero
subject + era/location cue + bold negative space. Keywords: cinematic
historical reconstruction, period-authentic, photoreal, tactile
materials, atmospheric depth, documentary realism. Avoid: modern
objects, generic fantasy armour, anachronisms, plastic-looking CGI.

**A2. Sacred Cinematic Devotional** *(rows 4, 18, 23)*
Language: temple-scale compositions + symbolic macro details.
Palette: saffron / gold / vermilion / deep indigo. Lighting: soft
sunrise glow, volumetric rays. Camera: 24mm grandeur, 50mm devotional
portrait, macro details. Motion: slow reverent push-ins, gentle
parallax, stillness holds. Texture: carved stone, brass, flower, smoke
and lamp glow. Graphics: minimal, respectful typography, no clutter
over sacred subjects. Thumbnail: deity/sacred object + radiant focal
point + uncluttered title area. Keywords: sacred cinematic, respectful
devotional atmosphere, temple architecture, warm divine glow,
intricate detail, reverent composition. Avoid: disrespectful
depictions, random fantasy elements, modern props, excessive neon.

**A3. Scientific Cinematic Explainer** *(rows 6, 12, 26–28, 30, 32)*
Language: photoreal macro + scientific visualisation + clean diagrams.
Palette: midnight blue / teal / white. Lighting: neutral studio light
with selective glow. Camera: macro, 50mm, wide scientific
environments. Motion: slow orbital moves, scale zooms, diagram
build-ups. Texture: clean glass/metal/lab surfaces, starfield and
deep-sea depth. Graphics: sparse precise labels, data callouts,
scale bars. Thumbnail: single scientific subject + scale cue + clean
label. Keywords: scientific visualisation, photoreal macro, accurate
anatomy/physics, clean composition, cinematic realism. Avoid:
scientific inaccuracies, unreadable labels, sensationalised imagery.

**A4. Futuristic Tech Editorial** *(rows 1, 7, 13, 19)*
Language: clean cinematic UI + macro hardware. Palette: deep navy /
electric cyan / violet. Lighting: cool rim light, controlled
contrast. Camera: 35mm + macro + screen inserts. Motion: precise
controlled cuts, smooth slider moves, UI element animation. Texture:
brushed metal, glass, circuit detail. Graphics: minimal HUD accents,
never fake unreadable UI text as content. Thumbnail: hero
device/system + one high-contrast UI/data element. Keywords:
futuristic technology editorial, photoreal hardware, cinematic UI,
cool rim light, premium commercial realism. Avoid: generic sci-fi
clutter, fake UI text, impossible hardware details.

**A5. Premium Business Editorial** *(rows 5, 8, 21)*
Language: luxury b-roll + data overlays + polished portraits.
Palette: charcoal / ivory / emerald / gold. Lighting: soft studio key,
crisp highlights. Camera: 35mm corporate, 85mm portrait, overhead
detail. Motion: controlled cuts, purposeful moves, chart build-ins.
Texture: glass towers, leather, paper, polished wood. Graphics:
restrained charts, one data cue per frame. Thumbnail: person/object +
premium environment + one data cue. Keywords: premium editorial,
sophisticated office, polished portrait, cinematic commercial
lighting, restrained graphics. Avoid: stock-photo clichés, luxury
flexing, cluttered dashboards.

**A6. Introspective Cinematic Essay** *(rows 9, 16)*
Language: human close-ups + metaphorical imagery + minimal graphics.
Palette: deep blue / warm skin / charcoal. Lighting: soft window
light, gentle falloff. Camera: 50mm/85mm portraits + symbolic wides.
Motion: very slow push-ins, long holds, breathing pauses. Texture:
natural skin, fabric, rain/glass, everyday objects as symbols.
Graphics: near-none; single-line text moments only. Thumbnail:
expressive face/object + metaphorical visual. Keywords: introspective
cinematic essay, human emotion, symbolic imagery, soft window light,
shallow depth of field. Avoid: melodramatic clichés, heavy text
overlays, artificial expressions.

**A7. Dark Mystery Documentary** *(rows 10, 11, 33)*
Language: moody reenactment + evidence inserts + atmospheric
locations. Palette: black / desaturated blue / muted red. Lighting:
low-key, hard practicals, haze. Camera: 35mm handheld, 85mm detail,
slow push-ins. Motion: creeping push-ins, still surveillance-style
holds, reveal pans. Texture: rain, dust, paper files, tape, chalk.
Graphics: evidence-board elements sparingly, redacted-document
motifs. Thumbnail: single evidence/subject + shadow + mystery hook.
Keywords: dark cinematic documentary, investigative mood, low-key
lighting, atmospheric haze, realistic evidence, restrained colour.
Avoid: gore for shock value, cartoon horror, excessive red grading,
implausible evidence.

**A8. Clean Educational Visuals** *(row 15)*
Language: clear diagrams + object/presenter-style shots + restrained
motion graphics. Palette: white / navy / one accent. Lighting: bright
soft studio. Camera: 35mm, top-down, diagram inserts. Motion:
step-by-step build-ups, highlight pulses, calm cuts. Texture: clean
paper/desk, simple props. Graphics: the content itself — labelled
diagrams, numbered steps, generous whitespace. Thumbnail: one
concept + simple diagram + readable hierarchy. Keywords: clean
educational visualisation, accurate diagram, uncluttered composition,
soft studio light, clear hierarchy. Avoid: dense text, decorative
clutter, misleading diagrams.

**A9. High-Impact Engineering Cinema** *(rows 17*, 22, 31)*
Language: hero machines + mechanical macro + kinetic tracking.
Palette: graphite / steel / amber. Lighting: hard directional,
metallic highlights. Camera: 24mm tracking, 50mm hero, macro.
Motion: kinetic tracking shots, speed ramps, mechanical close passes.
Texture: machined metal, grease, sparks, rivets, worn paint.
Graphics: spec callouts, blueprint lines, measurement overlays.
Thumbnail: hero machine + dramatic perspective + scale cue.
Keywords: engineering cinematic, industrial realism, mechanical
macro, dramatic scale, metallic detail, tracking shot. Avoid:
impossible mechanisms, toy-like machinery, unsafe fabrication detail.
*Row 17 in the old file wrongly assigned this archetype to Kids
Cartoon Stories — fixed in Part B (→ A15).*

**A10. Immersive Adventure Cinema** *(rows 20, 34)*
Language: expedition footage + sweeping landscapes + tactile details.
Palette: forest green / sand / sky blue. Lighting: natural golden
hour, weather realism. Camera: 16mm/24mm landscapes, 35mm action,
drone. Motion: drone sweeps, walking tracking, weather-driven moves.
Texture: rock, rope, canvas, mud, ice — real expedition materials.
Graphics: route maps, elevation/distance markers. Thumbnail: hero
landscape/person + strong depth + location cue. Keywords: adventure
documentary, vast landscape, realistic weather, natural light,
expedition realism, cinematic depth. Avoid: over-saturated travel
clichés, impossible weather, fake expedition gear.

**A11. Cinematic Food Editorial** *(row 24)*
Language: hero food macro + hands-in-frame process + cultural
context. Palette: warm cream / spice tones / dark wood. Lighting:
soft warm side light, glossy highlights. Camera: 50mm + macro +
overhead. Motion: slow push-ins, pour/steam reveals, overhead
process flows. Texture: steam, oil sheen, grain, spice, handmade
vessels. Graphics: minimal ingredient labels, recipe step markers.
Thumbnail: hero dish macro + ingredient/process detail. Keywords:
cinematic food photography, appetising macro, tactile ingredients,
warm side light, editorial realism. Avoid: messy framing, fake food
textures, excessive filters.

**A12. Dynamic Pop-Culture Motion** *(row 25)*
Language: graphic overlays + kinetic typography + cinematic
character shots. Palette: neon cyan / magenta / black. Lighting:
neon practicals, punchy contrast. Camera: 24mm action, 50mm
character, UI inserts. Motion: fast purposeful cuts, beat-synced
moves, kinetic type. Texture: screen glow, gloss, stylised surfaces.
Graphics: bold titles, stat cards, versus frames. Thumbnail: hero
character + kinetic graphic + strong silhouette. Keywords: dynamic
pop-culture cinematic, stylised characters, neon accents, kinetic
composition, high energy. Avoid: copying copyrighted characters,
unreadable UI, visual overload.

**A13. Cinematic Editorial Documentary** *(row 29) — the generalist*
Language: story-driven b-roll + contextual environments + restrained
graphics. Palette: natural neutrals + one thematic accent. Lighting:
soft cinematic contrast, motivated practicals. Camera: 35mm
storytelling, 50mm details, wide establishing. Motion: slow push-ins,
parallax, motivated tracking. Texture: real-world surfaces of the
subject's world. Graphics: restrained lower-thirds, chapter cards.
Thumbnail: single hero subject + contextual environment + clear
hierarchy. Keywords: cinematic editorial documentary, photoreal,
story-driven composition, natural light, restrained graphics. Avoid:
generic stock imagery, visual clutter, inconsistent lighting,
excessive effects. *Default archetype when no other fits.*

**A14. Wild Naturalist Cinema** *(NEW — nature/wildlife/ocean)*
Language: telephoto wildlife + habitat wides + underwater/field
macro. Palette: habitat-true greens / browns / ocean blues. Lighting:
natural only — dawn/dusk preference, underwater light falloff.
Camera: long telephoto behaviour shots, wide habitat establishing,
macro for small life. Motion: patient tracking, slow follows,
drone habitat sweeps (never harassing subjects). Texture: fur,
feather, scales, bark, coral, water surface. Graphics: species labels,
range maps, scale comparisons — sparse. Thumbnail: animal hero +
habitat + scale cue. Keywords: wildlife cinematography, natural
history documentary, photoreal animal, habitat realism, telephoto,
natural light. Avoid: zoo/captive look for wild stories, impossible
animal behaviour, anthropomorphic expressions, oversaturation.

**A15. Bright Storybook Animation** *(NEW — kids/family; fixes row 17)*
Language: warm 2D/3D storybook animation + expressive characters +
simple readable scenes. Palette: bright primaries + soft pastels,
high cheerfulness. Lighting: soft even cartoon light, no harsh
shadow. Camera (virtual): simple wide/medium framing, gentle moves
young viewers can follow. Motion: bouncy character motion, clear
cause-effect, calm pacing. Texture: soft matte, paper/crayon accents
optional per series. Graphics: big friendly labels, counting/letter
elements for learning content. Thumbnail: happy hero character +
one clear object + bold simple title space. Keywords: bright
storybook animation, cute expressive characters, soft colours,
child-friendly, clean simple composition, warm and safe mood. Avoid:
scary imagery, dark grading, complex cluttered scenes, realistic
violence, fast flashing cuts.

**A16. Luxury Opulence Editorial** *(NEW — luxury/lifestyle/hospitality)*
Language: slow glamour b-roll + material macro + architectural
grandeur. Palette: black / gold / ivory / deep jewel accent.
Lighting: dramatic soft key, sparkling highlights, candle/chandelier
practicals. Camera: slow dolly 35mm interiors, 85mm detail macro,
aerial property reveals. Motion: very slow glides, reveal pans,
no fast cuts. Texture: marble, gold leaf, silk, polished glass,
water reflections. Graphics: minimal serif titles, price/record
callouts sparingly. Thumbnail: one iconic luxury object/place +
dramatic light + minimal text space. Keywords: luxury editorial,
opulent interiors, cinematic glamour, gold accents, premium material
detail, slow elegant camera. Avoid: cheap-looking stock, cluttered
frames, loud colours, excessive flex montage.


---

## Part B — Category Mapping (all 25 categories, merged list v2)

Rows use the merged list's canonical names; the `categoryKey` in
each row is the stable reference for all assignments (A6).

| # | Category | Archetype | Category-level override |
|---|---|---|---|
| 1 | History & Heritage (`history_heritage`) | A1 Historical | Maps get parchment treatment; portraits follow Character Registry |
| 2 | Geography, Places & Maps (`geography_places_maps`) | A1 Historical (maps) / A10 Adventure (places) | Aerial map sequences are a signature shot |
| 3 | Science, Space & Earth (`science_space_earth`) | A3 Scientific | Space: deeper blacks; Earth science: natural palette shift |
| 4 | Health, Wellness & Ayurveda (`health_wellness_ayurveda`) | A8 Educational | Ayurveda niches: A2-lite override — warm natural light, herb macro, no devotional deity framing unless the niche is devotional |
| 5 | Finance, Business & Economics (`finance_business_economics`) | A5 Business | Data scenes follow Data Visualisation specs (Bible file 06) |
| 6 | Technology, AI & Digital Life (`technology_ai_digital`) | A4 Tech | Tutorials: A8 override for screen clarity |
| 7 | Crime, Mystery & Investigations (`crime_mystery_investigations`) | A7 Dark Mystery | Sensitivity: no graphic imagery regardless of archetype |
| 8 | Stories, Fiction & Fantasy Worlds (`stories_fiction_fantasy`) | A13 Editorial | Horror stories → A7 override; Fantasy worlds → richer saturated palette override |
| 9 | Religion, Philosophy & Spirituality (`religion_philosophy_spirituality`) | A2 Sacred | Philosophy niches → A6 Introspective override; academic religion explainers → A8 |
| 10 | Education & Learning (`education_learning`) | A8 Educational | Exam prep: maximum diagram clarity, zero decoration |
| 11 | Careers, Jobs & Professional Skills (`careers_jobs_skills`) | A5 Business | Softer palette override for guidance tone |
| 12 | Psychology, Mind & Relationships (`psychology_mind_relationships`) | A6 Introspective | Study/experiment explainers → A3 diagram inserts |
| 13 | Animals, Nature & Environment (`animals_nature_environment`) | A14 Naturalist | Ocean life: underwater variant (blue falloff, particulate) |
| 14 | Sports, Games & Play (`sports_games_play`) | A12 Pop-Culture | Sports history → A1 override; Chess/board → A13 calm override |
| 15 | Film, Entertainment & Media (`film_entertainment_media`) | A12 Pop-Culture | Documentary craft niches → A13; Music history → **contextual split by era (resolved 2026-10-27): pre-1900 → A6 Introspective, 1900 onward → A13 Editorial** |
| 16 | Food, Cooking & Farming (`food_cooking_farming`) | A11 Food | Farming stories → **dual pair (resolved 2026-10-27): A14 Naturalist primary + A10 Adventure secondary (D5 field split)** |
| 17 | Culture, Arts & Traditional Crafts (`culture_arts_crafts`) | A13 Editorial | Craft process → A11-style macro (hands + process) override |
| 18 | Home, DIY, Making & Hobbies (`home_diy_hobbies`) | A8 Educational | Build/process content: A9-lite (workshop texture, no spectacle) |
| 19 | Travel, Outdoors, Adventure & Survival (`travel_outdoors_adventure`) | A10 Adventure | Survival/disaster stories → A7 tension override (no gore) |
| 20 | Machines, Transport & Engineering (`machines_transport_engineering`) | A9 Engineering | Vehicle stories: hero-vehicle consistency from Product Registry |
| 21 | Politics, Law, Society & Public Systems (`politics_law_society`) | A13 Editorial | Geopolitics → A1 maps override; explainers → A8 diagrams |
| 22 | Luxury, Lifestyle & Living (`luxury_lifestyle_living`) | A16 Opulence | Shopping/consumer guides → A5 override |
| 23 | Future & Speculative Civilization (`future_speculative`) | A4 Tech | Speculative civilisations: A13 world-building override + speculation label in graphics |
| 24 | Kids, Family & Parenting (`kids_family_parenting`) | A15 Storybook | Parenting guidance → A8 override (for parents, not kids) |
| 25 | Facts, Lists, Records & Explainer Formats (`facts_lists_records`) | A12 Pop-Culture | Inherits subject niche's archetype when the list is single-niche; A12 only for mixed/ranking formats |

## Part C — Notable per-niche overrides & corrections to the old file

- **Kids Cartoon Stories [017] → A15** (old file wrongly: Engineering
  Cinema). Mythological Animation [018] → A2 (old file correct).
- **Ancient Technology / Lost Knowledge [013] → A1** (old file: A4
  Futuristic — anachronistic; ancient tech is shown as period craft).
- **Dinosaurs & Prehistoric [029] → A14** prehistoric variant: no
  humans, era-true habitats, consensus-based creature design.
- **Ocean & Deep Sea [028] → A14** underwater variant (old file: A3).
- **Documentary Storytelling [005] → A13.** Note: old visual file's
  ID 5 was "Business Storytelling" — a different niche; the name
  mismatch is resolved in favour of the niche list (ID 5 =
  Documentary Storytelling). Business storytelling content maps to
  A5 via §5 categories.
- **True Crime [010] / Horror Stories [011] / UFO [033] → A7** ✓ (old
  file correct); **Motivational Stories [016] → A6** ✓; **Personal
  Finance [008] → A5** ✓; **Luxury [021] → A16** (old file: A5 —
  upgraded to dedicated opulence); **Cars [022] → A9** ✓; **Food
  [024] → A11** ✓; **Gaming [025] → A12** ✓; **Travel [020] → A10** ✓;
  **AI niches [001/007] → A4** ✓; **History [002/003] → A1** ✓;
  **Sanatan [004] → A2** ✓.
- **Ayurveda [281] → A8 + A2-lite override** (natural warmth, herb
  macro — devotional framing only where the content is devotional).
- **Space [012/032] → A3** ✓ with deep-black space override.
- **Psychology [009] → A6** ✓. **Health Education [015] → A8** ✓.
- **Media Literacy [530] → A8** + screen-analysis inserts.
- **Cricket/Football [546/547] → A12** match-energy override; historic
  matches → A1.

## Part D — Use in the platform (specs)
- Admin: **Visual Style Library** — the 16 archetypes are Admin preset
  data (versioned like prompts); Admin can add archetypes and edit
  overrides; Niche Template's Bible Template references archetypeId +
  default overrides for its niche (mapping = Part B/C as seed data).
- API: archetypes served with niche/template data; project Bible
  Visual section stores `{ archetypeId, archetypeVersion, overrides }`.
- Web: Project wizard Bible step shows the archetype as a visual card
  (palette chips + keywords + thumbnail rule) with override editing;
  Scene Breakdown prompt preview shows the assembled prompt:
  archetype keywords + registry locked descriptions + scene visual.
- Shared: `VisualArchetype` DTO with the 10 schema fields.
