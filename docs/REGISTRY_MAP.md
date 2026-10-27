# Registry Map — Proper Bible Registry for Every Niche (2026-10-27)

Built on the Merged Niche List v2 (`NICHE_LIST_MERGED.md`, Notion §52).

**How it works:** a *registry* is a typed collection of locked entity
entries inside a project's Bible (alongside Sections, Annexes and
Master Lists). Every niche gets: **one Primary registry** (the thing
its videos are about), **Secondary registries** (supporting entities),
plus the **Universal set** every niche has. A niche inherits its
category's assignment; niches that differ are listed as **Overrides**.
A Niche Template declares the registry set; applying it activates
exactly those registries in the project Bible. Entries are unlimited.

**Rules vs Entities:** Annexes hold *rules* (how to portray, disclose,
claim). Registries hold *entities* (the locked facts about each person,
place, herb, case…). Three registries already exist inside annexes and
stay there: Character (Character Annex), Place (Place & Region Annex),
Ingredient/Knowledge-safety (Ayurveda Subject Annex). The other types
are standalone registry modules in the Bible's Registries area.

---

## Part A — The 11 Registry Types (defined once, reused by all niches)

### 1. Character Registry — PERSON
Entry: `{ name, aliases[], role: main|supporting|recurring, era,
identitySummary, traits[], motivations, relationships[], lifeTimeline[],
lockedAppearanceDescription, imagePromptSuffix, variants[],
designStatus, negativePrompt, portrayalNotes, sensitivityNotes,
dialoguePolicyRef }`
Used by: Research, Outline, Script, Scene Breakdown (locked appearance
→ every image prompt), Continuity + Fact Audit. **Home: the project
Character Registry — the canonical LIVING home for character data
(A12, 2026-10-27).** The Bible's Character Annex holds portrayal
RULES only (portrayal rules + dialogue policy); each locked Bible
version carries an immutable snapshot of the registry entries (see
API §5 / Shared). Field reconciliation of the two former shapes:
the annex shape's `identity` = `identitySummary`; its
`appearanceLockedDescription` = `lockedAppearanceDescription`
(canonical name; the annex spelling is retired); its canonical
life-event timeline = the entries' `lifeTimeline[]`; its
relationship map = the entries' `relationships[]`.

### 2. Place Registry — PLACE
Entry: `{ name, canonicalName, localName, pronunciation, hierarchy,
placeType: city|region|site|natural|celestial|fictional-ref, eraContext,
lockedVisualDescription, imagePromptSuffix, mapNotes, namingSensitivity,
keyFacts[], cameraGeography }` — `cameraGeography` (wide/medium/detail
positions + reverse-shot rules) folded in from the Phase 2 review
(G5): crops and reverse angles are VIEWS of an entry, never new
entries.
Used by: Research, Scene Breakdown, Map scenes, Fact Audit.
Home: Place & Region Annex (or standalone where no annex).

### 3. Knowledge & Ingredient Registry — SUBJECT
Two variants:
- **Ingredient/Material** (Ayurveda, food, chemistry): `{ name,
  otherNames[], category, claimedProperties, verifiedNotes,
  safetyWarnings, usageStandards, disclaimerRef }`
- **Topic Knowledge** (general subjects): `{ topic, lockedDefinition,
  keyFacts[], commonMisconceptions[], sourceRefs[], boundaryNotes }`
Both variants (and the Verified Data variant) carry review metadata
the category notes assume (C-block): `reviewDate?, reviewBy?` — when
the entry's facts were last re-checked and by whom; time-sensitive
entries are re-reviewed on the niche's cadence, and research cites
the review date for figures.
Used by: Research, Script (accuracy), Glossary generation, Safety Audit.
Home: Subject Annex where one exists, else standalone.

### 4. Case / Event Registry — EVENT
Entry: `{ name, dateOrRange, placeRefs[], personRefs[], verifiedSummary,
eventTimeline[], outcome, disputedPoints[], sensitivityNotes
(victims/privacy/legal), sourceRefs[] }`
Used by: Research Brief seeding, Fact + Continuity Audit, Do-Not-Repeat
linkage (a covered case is flagged on re-selection).

### 5. Creature Registry — CREATURE
Entry: `{ commonName, scientificName, aliases[], habitatPlaceRefs[],
lockedAppearanceDescription, imagePromptSuffix, behaviourTraits[],
diet, sizeScale, conservationStatus, dangerNotes,
commonMisconceptions[] }`
Used by: Research, Scene Breakdown (consistent animal visuals), Fact Audit.

### 6. Story-World Registry — STORY
Entry: `{ worldName, premise, worldRules[], characterRefs[],
fictionalPlaceRefs[], inWorldTimeline, canonFacts[], toneNotes,
spoilerPolicy, originalityNotes }`
For fiction, horror, fantasy, lore, mythology-as-story, kids' worlds.
Used by: Outline, Script, Continuity Audit (story must obey world rules).

### 7. Organisation Registry — ORGANISATION
Entry: `{ name, orgType: company|institution|team|state|publication,
foundedOrPeriod, founderPersonRefs[], productRefs[], keyEventRefs[],
lockedFacts[], positioningNotes, rivalries[], sourceRefs[] }`
Used by: Research, Script, Fact Audit. Business, tech, politics, sports teams.

### 8. Product Registry — PRODUCT
Entry: `{ name, makerOrgRef, category, launchOrPeriod, lockedSpecs{},
variants[], lockedDesignDescription, imagePromptSuffix,
commonErrors[], priceAsOf?, priceNote? }` — `priceAsOf` dates any
price held in `lockedSpecs` (prices are time-sensitive facts; the
category notes for automotive/luxury/finance assume an as-of date).
For cars, gadgets, machines, luxury goods, dishes-as-products.
Used by: Research, Scene Breakdown (consistent product visuals), Fact Audit.

### 9. Concept Registry — CONCEPT
Entry: `{ concept, lockedDefinition (one canonical explanation),
simpleExplanation, exampleBank[], commonMisconceptions[],
relatedConceptRefs[], terminologyRules, beliefLabel?: boolean }`
Used by: Script (same concept explained identically in every video),
Glossary generation, Accuracy Audit. `beliefLabel` marks belief-based
concepts (astrology etc.) so scripts label them as belief, not fact.

### 10. Work Registry — WORK
Entry: `{ title, workType: film|series|book|match|song|game|text,
creators[], releaseOrDate, parts[] (episodes/chapters/matches),
canonSummary, characterRefs[], spoilerPolicy, rightsNote
(summarise/review only, no reproduction) }`
Used by: Outline (recaps/explainers), Script, Originality/Rights Audit.

### 11. Props & Wardrobe Registry — PROP
Entry: `{ name, kind: prop|wardrobe, ownerRef? (character/place),
lockedDescription, imagePromptSuffix, periodOrEra, stateTable[]
{ sceneRange, state, note } }` — locked descriptions for recurring
props and costumes so they look identical in every generated visual;
the per-scene state table tracks condition/possession changes across
the story (docs/PHASE2_ADDITIONS.md G3). Adopted from the user's
39-file Bible list (docs/BIBLE_FILE_MAPPING.md, Adoption 3); a full
registry type with its own entry DTO, RegistryModule endpoints and
Admin Registry Type Library entry (confirmed 2026-10-27, audit A3).
Used by: Scene Breakdown, Visual Prompts, Continuity Audit.

**Entry enrichments (part of the type definitions above):** the
Phase 2 review added fields that live in Addendum 2 of this
document and docs/PHASE2_ADDITIONS.md — Character variants +
design status + depiction class, Place camera geography, timeline
knowledge states, and the Project Shot Recipe Library. Treat those
addenda as part of Parts A–C, not optional extras.

### Angle Registry — per niche (Admin level, from user's system)
Not a Bible registry: Angles live **on the niche in Admin**, inherited
by every project of that niche. Entry (from user's ANGLE_PLAN):
`{ slug, angle, question, scope, evidence, boundary }` + status/version.
A Run selects one Angle + a concrete story question; the scope is
snapshotted into the Run config (Q3 in user's Q-set), bounds the
Research Brief, and the Audit checks the script stayed inside scope.

### Universal set — EVERY niche also has
Glossary & Pronunciation (Bible §10) · **all 7 Master Lists** ·
Angle Registry (on the niche). The 7 Master Lists (Master Source
List, Do-Not-Repeat, Master Timeline/Chronology, Master
Location/Setting List, Hook & Opening Library, Phrase Bank,
Approved Asset Source List) exist for **every project** (the
Master Lists design, API §5) — a list may simply be empty; the
Master Timeline is typically populated for time-based niches and
the Location/Setting List for niches with recurring visual sets.
(This replaces an earlier "5 + 2 where relevant" phrasing in this
document, which contradicted the 7-for-every-project rule.)

---

## Part B — Category Map (all 25 categories of the merged list)

Rows use the merged list's canonical names; the `categoryKey` in
each row is the stable reference for all assignments (A6).

| # | Category | Primary | Secondary | Notes |
|---|---|---|---|---|
| 1 | History & Heritage (`history_heritage`) | Character + Case/Event | Place, Master Timeline | Dialogue policy + dramatization labels (Character Annex rules) |
| 2 | Geography, Places & Maps (`geography_places_maps`) | Place | Case/Event (border changes), Concept | Neutral naming for disputed places |
| 3 | Science, Space & Earth (`science_space_earth`) | Concept + Knowledge | Creature (bio), Place (celestial/earth), Product (inventions) | Accuracy-first; misconception fields matter |
| 4 | Health, Wellness & Ayurveda (`health_wellness_ayurveda`) | Knowledge & Ingredient (safety variant) | Concept | Mandatory disclaimer + no-cure-claims audit gate |
| 5 | Finance, Business & Economics (`finance_business_economics`) | Organisation + Concept | Character (founders), Case/Event (crises, scams), Product (plans/products as concepts) | Financial Data Verified ties in (user Bible file 02) |
| 6 | Technology, AI & Digital Life (`technology_ai_digital`) | Product + Organisation | Concept, Case/Event (launches, breaches) | Fast-moving: entries carry review dates |
| 7 | Crime, Mystery & Investigations (`crime_mystery_investigations`) | Case/Event | Character (persons in case), Place (case locations) | Victim privacy + legal sensitivity mandatory |
| 8 | Stories, Fiction & Fantasy Worlds (`stories_fiction_fantasy`) | Story-World | Character (fictional), Place (in-world) | Originality audit vs Do-Not-Repeat stories |
| 9 | Religion, Philosophy & Spirituality (`religion_philosophy_spirituality`) | Concept + Character (deities, saints) | Place (sacred), Story-World (epics), Work (texts) | Respect/portrayal rules; belief labelling |
| 10 | Education & Learning (`education_learning`) | Concept + Knowledge | Work (books, syllabus), Case/Event (exam patterns) | Curriculum-version awareness |
| 11 | Careers, Jobs & Professional Skills (`careers_jobs_skills`) | Concept | Organisation (industries, employers), Knowledge | Advice-boundary notes (guidance, not guarantees) |
| 12 | Psychology, Mind & Relationships (`psychology_mind_relationships`) | Concept | Case/Event (famous studies/experiments), Character (illustrative personas, fictional-labelled) | No personal medical/therapy advice |
| 13 | Animals, Nature & Environment (`animals_nature_environment`) | Creature | Place (habitats, parks), Concept (ecology) | Conservation status kept current |
| 14 | Sports, Games & Play (`sports_games_play`) | Character (athletes) + Work (matches, games) | Organisation (teams, clubs), Case/Event (historic finals) | Scores/records verified per entry |
| 15 | Film, Entertainment & Media (`film_entertainment_media`) | Work | Character (characters + real persons), Organisation (studios), Story-World (lore) | Rights note: recap/review framing only |
| 16 | Food, Cooking & Farming (`food_cooking_farming`) | Knowledge & Ingredient | Place (regional cuisines), Product (signature dishes = recipe-variant entries) | Recipe entries carry format standard + safety (allergens) |
| 17 | Culture, Arts & Traditional Crafts (`culture_arts_crafts`) | Work (artworks, performances) + Knowledge (techniques) | Place (tradition regions), Product (craft objects) | Technique entries = Knowledge variant |
| 18 | Home, DIY, Making & Hobbies (`home_diy_hobbies`) | Product + Knowledge (techniques/steps) | Creature (hobby animals — primary stays §13), Place (spaces, light) | Safety notes on tools/process entries |
| 19 | Travel, Outdoors, Adventure & Survival (`travel_outdoors_adventure`) | Place | Case/Event (expeditions, disasters), Character (explorers, survivors) | Location safety/current-status notes |
| 20 | Machines, Transport & Engineering (`machines_transport_engineering`) | Product | Organisation (manufacturers), Case/Event (failures, disasters), Place (infrastructure) | Specs locked per model/variant |
| 21 | Politics, Law, Society & Public Systems (`politics_law_society`) | Organisation + Case/Event | Concept (laws, rights), Character (public figures), Place | Neutrality rules; legal-info-not-advice boundary |
| 22 | Luxury, Lifestyle & Living (`luxury_lifestyle_living`) | Product | Place (hotels, destinations), Organisation (brands) | Price claims dated per entry |
| 23 | Future & Speculative Civilization (`future_speculative`) | Concept + Story-World (scenarios) | Product (speculative tech, labelled speculative) | **Speculation label mandatory** — never presented as fact |
| 24 | Kids, Family & Parenting (`kids_family_parenting`) | Story-World + Character | Concept (values/lessons), Creature (animal characters) | Age-appropriateness gate on all entries |
| 25 | Facts, Lists, Records & Explainer Formats (`facts_lists_records`) | Inherits the topic niche's set | Concept + Case/Event | A list/format Run must declare its source niche and use that niche's registries |


---

## Part C — Per-Niche Overrides (niches that differ from their category)

**Resolution & storage (A8, 2026-10-27):** a niche's registry set
resolves in this order — **Niche Template `registries` section
(explicit) → per-niche override (this Part) → category map
(Part B)**. Overrides are stored as `NicheRegistryOverride
{ nicheId, primary?, secondary?, note? }` records (Admin; seeded
from this Part — extraction into registry_seed.json is pending and
entries are never guessed). Deleting an override record restores
inheritance; a template section set back to `null` does the same at
template level. An explicit `secondary: []` means *intentionally
none* and is not inheritance.

- **Castles, Forts & Palaces [037]** (§1 History) → Place *primary*
  (the place is the subject; kings are secondary Character entries)
- **Biography niches [146], Athlete/Entrepreneur/Celebrity biographies**
  → Character primary in their categories
- **Archaeology [039]** → Place + Case/Event co-primary (sites + digs)
- **Ancient Technology / Lost Knowledge [013]** → Product primary
  (ancient devices) + Concept
- **Sanatan / Hindu Mythology [004], Mythological Animation [018]** →
  Character (deities) + Story-World co-primary; Concept secondary
- **Sacred Texts & Epics [268 subs: 269–272, 540, 541]** → Work primary
- **Astrology / Numerology / Vastu [NEW §9]** → Concept primary with
  `beliefLabel: true` on every entry
- **Space & Universe [012], Space Exploration [032]** → Place primary
  with `placeType: celestial` + Concept secondary
- **Dinosaurs & Prehistoric [029]** → Creature primary (prehistoric
  variant: appearance locked to current scientific consensus + review date)
- **Inventions [089 subs]** (§3) → Product primary — **scope RESOLVED 2026-10-27 (user decision): applies to the 'Inventions & Inventors' sub-niche (id 563) ONLY; niche 089 itself keeps the science_space_earth category default.**
- **Banking & Money [293], Crypto [296]** (§5) → Concept primary,
  Organisation secondary (banks, exchanges), Case/Event (crashes, failures)
- **True Crime [010], UFO [033], Secret Societies [057]** (§7) →
  Case/Event primary confirmed; Character entries carry privacy flags
- **Horror / Mystery Stories [011]** (§8) → Story-World primary;
  recurring horror characters in Character Registry (fictional)
- **Gaming Stories & Lore [025]** (§14) → Story-World + Work co-primary
- **Chess & Board Games [133/134]** (§14) → Work primary (famous games),
  Character secondary (players)
- **Cricket [546] / Football [547]** → Work (matches) + Character
  (players) + Organisation (teams) — all three active
- **Movie & Series Explainers [080], Books [078]** (§15) → Work primary
  confirmed; spoiler policy enforced from Work entry
- **Recipes [091 subs]** (§16) → Knowledge registry, Recipe variant:
  `{ dish, regionPlaceRef, ingredients[] (ingredient refs), stepsStandard,
  allergenNotes, originNotes }`
- **Martial Arts History [253]** (§17) → Knowledge (techniques) +
  Character (masters) co-primary
- **Cars [022], Gadgets [063], Supercars/Luxury goods** → Product
  primary confirmed with locked design description (visual consistency)
- **Geopolitics [014]** (§21) → Organisation (states/institutions) +
  Case/Event + Place (disputed-place neutral naming from Place entry)
- **Exam Prep [NEW §10]** → Concept + Work (syllabus & past papers as
  works) + Knowledge; entries versioned by exam cycle
- **Kids Cartoon Stories [017]** (§24) → Story-World + Character
  co-primary; all entries pass the age-appropriateness gate
- **What If / Then vs Now [167/165]** (§25) → use the *compared*
  niches' registries (e.g. a history What-If uses §1's set) +
  speculation/comparison label in Concept entries

## Implementation (specs)
- API §5/§6A: `RegistryModule` per project Bible: `{ registryType,
  annexHome? , entries[] }`; niche template `registries[]` assignment
  (primary/secondary); CRUD endpoints mirroring master-lists;
  Angle Registry endpoints on niches (Admin): angle CRUD + run
  angle-selection snapshot.
- Admin §8: Registry Type Library (the 11 types, dynamic fields like
  annex templates) + Angle management per niche; Niche Template gains
  a Registries section (10th template section).
- Web §4: Bible screen gains a **Registries** tab (active registries
  only, entry CRUD + search); Run creation selects Angle + story
  question (Step 4/5), scope shown in Run Overview.
- Shared: `RegistryType`, entry DTOs per type, `Angle` DTO.


---

## Addendum (2026-10-27, from the 39-file Bible mapping)
- **Registry Type 11 — Props & Wardrobe Registry** (from user file
  31_PROPS_COSTUMES): `{ name, type: prop|wardrobe, ownerRef, era,
  lockedDescription, imagePromptSuffix, continuityNotes }` — recurring
  props/costumes with locked visual descriptions; story/history/
  fiction/devotional niches; Scene Breakdown + Continuity Audit.
- **Verified Data variant** of the Knowledge Registry (from user file
  02_Financial_Data_Verified): pre-verified standing figures
  `{ metric, value, unit, period, geography, sourceRef, verifiedOn,
  reviewBy, methodologyNote }` for finance/data niches
  (`methodologyNote` — how the figure is computed/defined — is
  required by the G7 adoption in docs/PHASE2_ADDITIONS.md; the A7
  seed flagged its absence here, now added).
- **Data Visualization Annex** (from user file 06): chart/data
  presentation rules annex for data-heavy niches (see
  docs/BIBLE_FILE_MAPPING.md, Adoptions).
Full mapping of all 39 user Bible files: docs/BIBLE_FILE_MAPPING.md.

## Addendum 2 — Phase 2 content review (2026-10-27, docs/PHASE2_ADDITIONS.md)
- **Character entries:** variants[] scoped by story date/event +
  scene range (persistent features protected), design status
  proposed|approved with evidence, negative-prompt/exclusion brief,
  expression/gesture sheet, depiction class depicted|mention_only|
  absent; appearance departures from sourced descriptions logged.
- **Props & Wardrobe entries:** per-scene state table (owner/wearer,
  reveal/transfer/damage/repair/costume-change) incl. offscreen state.
- **Place entries:** cameraGeography (wide/medium/detail positions,
  reverse-shot rules); crops/reverses are views, not new entries.
- **Timelines:** may record character knowledge states (feeds the
  Audit causality-failure taxonomy).
- **Project Shot Recipe Library:** reusable SHOT_ recipes + spatial
  continuity fields; scenes may reference a recipe.
