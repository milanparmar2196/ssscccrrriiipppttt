Here is the result of "fetch" for the Page with URL https://app.notion.com/p/406c42da1559801a9e10ebe0a277e727 as of 2026-10-27T06:05:38.410Z:
<page url="https://app.notion.com/p/406c42da1559801a9e10ebe0a277e727">
<ancestor-path></ancestor-path>
<properties>
{"title":"<p>\nscript \n</p>"}
</properties>
<iconMetadata>null</iconMetadata>
<content>
AI Script Writer SaaS — pure script generation platform. This page is the source of truth for the product. Build order: first define data and flow here in Notion, then create GitHub issues, then build.

<b>Status:</b> Planning / MVP definition<br /><b>Scope decision:</b> No audio, no video, no avatar, no voiceover, no video editor, no rendering. Only text script generation.

## 1. Product Overview

<b>What it is</b><br />A SaaS platform where a creator gives a topic / idea / rough notes and gets a ready-to-use script.

<b>Target user (Personal)</b>

- Solo creators: YouTube, Instagram Reels, YouTube Shorts, TikTok, Podcast (script only)
- Freelance script writers writing for themselves
- Beginners who need structure, hook, and CTA

<b>Core value</b><br />Idea -> Outline -> Full Script -> Edit / Rewrite -> Export, in minutes, in the creator's own style.

<b>Out of scope for MVP</b>

- Audio generation / TTS / voice clone
- Video generation / editing / timeline / stock video
- Avatar video
- Team / client collaboration (later phase)

## 2. Key Concept: Personal Project

A Personal Project is one creator's workspace / folder.

- One user can have multiple Personal Projects. Example: one for a Finance YouTube channel, one for Fitness Reels.
- Each project saves its style once, so the user does not set tone, language, audience, and platform for every script.
- No team invite, no client approval flow in a Personal Project. It is solo use only.

<b>Personal Project fields (saved once per project)</b>

- Project name
- Niche / category: Finance, Tech, Fitness, Education, Comedy, etc.
- Main platform: YouTube Long, YouTube Shorts, Instagram Reel, TikTok, Podcast
- Target audience: Beginners, Students, Founders, etc.
- Language
- Tone / creator persona: Educational, Funny, Storytelling, Motivational
- Default script duration: 60 seconds, 5 minutes, 10 minutes, custom

## 3. Personal Project Flow

### Step 1 - Signup and Onboarding

Login / Sign up -> What do you create? -> Select main platform -> Select language -> Select creator style -> Default profile created.

### Step 2 - Dashboard

User sees: My Projects, Recent Scripts, Credits / Plan, and a New Project button.

### Step 3 - Create Personal Project

New Project -> Select Personal -> Fill project fields listed in Section 2 -> Save -> Project Home opens.

### Step 4 - Project Home

Shows all scripts inside this project, project settings, and a New Script button.

### Step 5 - Create New Script (3-step wizard)

<b>Step 5a - Idea input (choose one)</b>

- Type a topic / idea
- Paste rough notes
- Paste a link or old script to rewrite
- Get AI topic ideas based on project niche

<b>Step 5b - Format</b>

- Script type / structure template: Hook-Story-CTA, Tutorial, Listicle, Review, Storytelling, Problem-Solution
- Duration (auto converts to target word count)
- Tone override (optional, defaults to project tone)
- Hook style
- CTA goal: Subscribe, Comment, Follow, Buy, Visit link

<b>Step 5c - Outline first (important)</b>

- AI generates only the outline first: Hook, Intro, Main Point 1, Main Point 2, Main Point 3, Conclusion, CTA
- User can edit, reorder, add, or delete outline points
- User approves outline before full script generation
- Why outline-first: better script quality, less wasted credits, user control

### Step 6 - Full Script Generation

AI generates section by section, using project profile + script brief + approved outline:

- 5 hook options to choose from
- Intro
- Main body for each outline point
- Transitions between sections
- Ending and CTA
- Text-only extras: scene description, B-roll suggestion as text, on-screen text suggestion
- Show estimated reading time based on word count

### Step 7 - Script Editor (core screen)

- Left: full script editor
- Right / on text selection: Rewrite, Make Shorter, Make Longer, Make Funnier, Simplify, Change Tone, Add Example, Add Story, Regenerate This Section Only
- Auto-save
- Version history: v1, v2, etc., with compare and restore
- Generate Another Version option

### Step 8 - Finalize and Export

- Generate title options
- Generate description and hashtags (optional extras)
- Final readability check
- Export: Copy, TXT, DOCX, PDF
- Script saved in Project Library

### Step 9 - Library Loop (repeat use)

- Search old scripts
- Duplicate a script
- Create a variation from a previous successful script
- Archive / Trash

## 4. User Journey Summary

New user: Sign up -> Onboarding -> Create Personal Project -> Create Script -> Idea -> Format -> Outline (approve) -> Full Script -> Edit in Editor -> Export

Returning user: Login -> Open Personal Project -> New Script -> Idea -> Format -> Outline -> Script -> Export

## 5. MVP Screens (7 screens only)

- [ ] 1\. Auth / Onboarding
- [ ] 2\. Dashboard (My Projects, Recent Scripts)
- [ ] 3\. Create Personal Project
- [ ] 4\. Project Home (list of scripts in a project)
- [ ] 5\. Create Script Wizard (Idea + Format)
- [ ] 6\. Outline Screen (edit and approve)
- [ ] 7\. Script Editor + Export

## 6. Features: MVP vs Later

| Area | MVP | Later |
| --- | --- | --- |
| Project | Personal Project only | Brand / Client Project, Team Project |
| Script input | Topic, rough notes, old script rewrite | Link / transcript import |
| Generation | Outline-first, section-wise script | AI topic trend suggestions |
| Editor | Rewrite, shorten, lengthen, tone change, regenerate section | Real-time collaboration |
| Versions | Version history, duplicate script | Compare view advanced |
| Export | Copy, TXT, DOCX, PDF | Direct publish integrations |
| Monetisation | Free credits + paid plan placeholder | Full billing, usage analytics |

## 7. Data Model (v1)

<b>User</b>

- id, name, email, plan, credits\_balance, created\_at

<b>PersonalProject</b>

- id, user\_id, name, niche, platform, target\_audience, language, tone, default\_duration, created\_at, updated\_at

<b>Script</b>

- id, project\_id, user\_id, title, topic / idea\_input, input\_type (topic / notes / rewrite), structure\_template, duration\_target, word\_count\_target, tone, cta\_goal, status (draft / outline / generated / final), created\_at, updated\_at

<b>ScriptVersion</b>

- id, script\_id, version\_number, outline (JSON), content (sections JSON / text), is\_current, created\_at

<b>Generation</b>

- id, script\_id, version\_id, prompt\_type (outline / hook / section / rewrite / title), credits\_used, model, created\_at

## 8. Prompt Logic (v1)

Order of generation - never generate the full script in one shot:

1. Project profile + script brief -> Outline prompt
2. Approved outline -> Hook prompt (generate 5 options)
3. Approved outline + selected hook -> Section-by-section script prompts
4. Full draft -> Polish prompt (transitions, CTA, readability)
5. Optional -> Title, description, hashtags prompt

Each editor action is a separate prompt type: rewrite, shorten, lengthen, funnier, simplify, tone change, add example, add story.

## 9. Rules and Decisions

- Pure script only. If a feature needs audio or video, it is out of MVP scope.
- Outline approval is mandatory before full script generation.
- Project style is the default; per-script settings can override it.
- Every generation must save a version. Nothing is overwritten silently.
- Notion is the source of truth for product and flow. GitHub issues are created from this page, not the other way round.

## 10. Next Steps

- [ ] Review and approve this Personal Project flow
- [ ] Finalise MVP screen list and fields for each screen
- [ ] Create GitHub repo structure and issues from Sections 5, 6, and 7 above
- [ ] Start build in this order: Auth -> Personal Project CRUD -> Script Wizard -> Outline -> Editor -> Export

---

# PART 2 - BRAND PROJECT

This part defines the Brand Project type. It builds on Part 1 (Personal Project) - the core engine (outline-first, section-wise generation, editor, export) stays the same. What changes is the setup, the controls, and the review flow.

<b>Status:</b> Flow defined, build after Personal Project MVP<br /><b>Scope reminder:</b> Pure script only. No audio, no video, no avatar, no rendering - same as Personal.

## Personal vs Brand - Quick Difference

| Point | Personal Project | Brand Project |
| --- | --- | --- |
| Who | Solo creator for themselves | Business / brand / agency for a brand |
| Voice | Creator's personal style, flexible | Brand voice, locked by guidelines |
| Structure | Project -> Scripts | Brand Project -> Campaigns -> Scripts |
| Setup | Light: niche, audience, tone | Detailed: brand, voice, audience, products, guidelines |
| Main goal | Views, subscribers, personal growth | Leads, sales, awareness, trust |
| Review | No approval needed, user is final | Approval flow: Draft -> Review -> Approved |
| Risk control | None needed | Banned words, claims check, disclaimers |
| Facts | Creator can improvise | AI must use only provided product facts, no invented claims |

## 11. Brand Project Overview

<b>What it is</b><br />A workspace for one brand, where every script is generated in that brand's voice, for that brand's products, customers, and campaign goals.

<b>Target users</b>

- D2C / e-commerce brands, SaaS / startups, local businesses
- In-house marketing teams and founders
- Agencies / freelancers writing scripts for a client brand

<b>Script types for a brand</b><br />Ad Script, Product Explainer Script, Product Demo Script, Launch / Offer Script, Reel / Shorts Ad Script, YouTube Ad Script, Testimonial Script (text only), Sales / Webinar Script

<b>Core value</b><br />One brand setup -> unlimited on-brand scripts for every campaign and product, without re-explaining the brand, and without off-brand or risky claims.

## 12. Key Concept: Brand Project

- One Brand Project = one brand. Example: one project for Brand A, a separate project for Brand B (useful for agencies).
- Structure: Brand Project -> Campaigns -> Scripts. A campaign groups scripts for one goal / launch / offer.
- Brand voice is locked. A per-script tone change cannot break brand guidelines unless the project owner allows an override.
- Products, disclaimers, CTAs, and banned words are saved in the project and reused in every script.

## 13. Brand Setup - Fields (saved once per brand)

Setup is a multi-step wizard, more detailed than Personal:

<b>Step A - Brand basics</b>

- Brand name, Industry / category, Website (reference only), Tagline, Short brand description, Language / market / country

<b>Step B - Voice and tone</b>

- Voice adjectives: Premium, Friendly, Bold, Trustworthy, Playful, etc. (pick 3)
- Formal to Casual level
- Example lines the brand would say / would never say
- Words to prefer, Words to avoid / banned words

<b>Step C - Audience and market</b>

- Target customer segments (can be more than one)
- Customer pain points, Customer objections, Competitors (reference only, not to be copied)

<b>Step D - Products / Services library</b><br />For each product / service: Name, Description, Key features (facts only), Price / offer (only if allowed to mention), USPs, Proof points (numbers, reviews, results - only verified facts given by the user)

<b>Step E - Guidelines and compliance</b>

- Mandatory phrases / mentions
- Disclaimers (by category, e.g. finance, health, earnings)
- Claims allowed / Claims NOT allowed
- Default CTA: Visit website, Buy now, Book a demo, DM us, etc.
- CTA link / offer text (as text in script)

## 14. Brand Project Flow

### Step 1 - Create Brand Project

Dashboard -> New Project -> Select Brand -> Brand Setup Wizard (Steps A to E in Section 13) -> Save -> Brand Project Home opens.

### Step 2 - Brand Project Home

Shows: Campaigns list, All Scripts, Brand Profile / Guidelines shortcut, Products Library, New Campaign and New Script buttons.

### Step 3 - Create Campaign (optional but recommended)

Campaign fields: Campaign name, Goal (Awareness / Consideration / Conversion), Product / service, Funnel stage, Offer, Key message, Campaign dates.<br />Scripts created without a campaign go to a default Uncategorised group.

### Step 4 - Create New Script (Brand wizard - extra steps vs Personal)

- <b>Step 4a - Campaign and product:</b> Select campaign, product / service, script type, funnel stage
- <b>Step 4b - Message:</b> Idea / topic, Key message, Offer, Proof points to use, Mandatory inclusions for this script
- <b>Step 4c - Format:</b> Duration, Structure template (Problem-Solution-CTA, Demo, Story-Testimonial, Offer / Launch, Comparison), Hook style, CTA for this script (defaults to brand CTA)

### Step 5 - Outline First (same rule as Personal)

AI generates outline only -> User edits / reorders / approves -> Only then full script.<br />Brand addition: outline is checked against key message and campaign goal before approval.

### Step 6 - Full Script Generation (brand-locked)

Same section-wise generation as Personal - 5 hook options, Intro, Body per outline point, Transitions, Ending + CTA - with 3 brand locks:

1. Voice lock: generated in saved brand voice only
2. Fact lock: only product facts from the Products Library are used. No invented price, feature, or result
3. Guideline lock: banned words are not used, mandatory phrases and correct disclaimer are added

### Step 7 - Compliance and Brand Check (new for Brand)

Before a script can be marked ready, auto-check and show result:

- Banned word found: Yes / No, with location
- Disclaimer required and present: Yes / No
- Unsupported claim warning: any claim not in the Products Library / proof points
- Mandatory phrase present: Yes / No
- Brand tone match: simple score / flag<br />User fixes issues in the editor, or regenerates that section only.

### Step 8 - Script Editor (same as Personal, plus brand tools)

All Personal editor tools, plus: Check Brand Voice, Insert Product Fact, Insert Saved CTA, Insert Disclaimer, Regenerate With Stricter Brand Voice.

### Step 9 - Review and Approval Flow (new for Brand)

Script status flow - status only in MVP, team comments later:<br />Draft -> In Review -> Changes Requested -> Approved -> Final

- On Approved, that version is frozen as the approved version
- Any edit after approval creates a new version and returns status to Draft
- Approver name / note can be recorded as text in MVP

### Step 10 - Finalize and Export

Same export as Personal: Copy, TXT, DOCX, PDF - plus brand and campaign name in the exported file header, and titles / captions / hashtags as optional extras.

## 15. User Journey Summary - Brand

New brand: Create Brand Project -> Complete Brand Setup (A-E) -> Add Products -> Create Campaign -> Create Script -> Message + Format -> Outline (approve) -> Script -> Compliance Check -> Review / Approve -> Export

Returning brand user: Open Brand Project -> Open Campaign (or New Script) -> Script Wizard -> Outline -> Script -> Compliance Check -> Approve -> Export

## 16. Additional Screens for Brand (over the 7 Personal screens)

- [ ] 8\. Brand Setup Wizard (5 steps: Basics, Voice, Audience, Products, Guidelines)
- [ ] 9\. Brand Project Home (Campaigns + Scripts)
- [ ] 10\. Brand Profile / Guidelines Page (view and edit brand setup)
- [ ] 11\. Products Library (list + add / edit product)
- [ ] 12\. Create Campaign
- [ ] 13\. Brand Script Wizard (Campaign/Product + Message + Format)
- [ ] 14\. Compliance and Brand Check (inside Editor / as a panel)
- [ ] 15\. Review and Approval Status (inside Script / Project Home)

Note: Screens 1-7 from Personal (Auth, Dashboard, Project list, Script Editor, Export, etc.) are reused, not rebuilt.

## 17. Features: Brand MVP vs Later

| Area | Brand MVP | Later |
| --- | --- | --- |
| Brand setup | Manual form wizard (Steps A-E) | Auto-fill brand profile from website |
| Products | Manual Products Library | Bulk import products |
| Campaigns | Create campaign, group scripts | Campaign calendar / planning |
| Generation | Brand-locked, fact-locked, guideline-locked | Multi-language campaigns in one go |
| Compliance | Banned words, disclaimer, mandatory phrase check | Industry-specific legal rule packs |
| Approval | Status flow only, approver note as text | Team roles, comments, client approval link |
| Team | Single owner account | Invite Writer / Approver / Client roles |
| Export | Copy, TXT, DOCX, PDF with brand header | Bulk campaign export |

## 18. Data Model - Additions for Brand (v1)

These tables are added to the Part 1 data model. User and ScriptVersion / Generation are reused.

<b>BrandProject</b>

- id, user\_id, brand\_name, industry, website, tagline, description, language, market, created\_at, updated\_at

<b>BrandVoice</b>

- id, brand\_project\_id, voice\_adjectives (JSON), formality\_level, example\_say (text), example\_never\_say (text), preferred\_words (JSON), banned\_words (JSON)

<b>BrandAudience</b>

- id, brand\_project\_id, segment\_name, description, pain\_points, objections

<b>Product</b>

- id, brand\_project\_id, name, description, key\_features (JSON - facts only), price\_text (optional), usps (JSON), proof\_points (JSON)

<b>BrandGuideline</b>

- id, brand\_project\_id, mandatory\_phrases (JSON), disclaimers (JSON by category), claims\_allowed (JSON), claims\_not\_allowed (JSON), default\_cta, default\_cta\_text

<b>Campaign</b>

- id, brand\_project\_id, name, goal, product\_id, funnel\_stage, offer, key\_message, start\_date, end\_date, status, created\_at

<b>Script - extra fields for Brand</b>

- campaign\_id, product\_id, funnel\_stage, key\_message, approval\_status (draft / in\_review / changes\_requested / approved / final), approved\_version\_id, compliance\_result (JSON)

## 19. Prompt Logic - Brand (v1)

Same order as Personal, with brand layers added:

1. Brand profile + BrandVoice + Guidelines + Product facts + Campaign brief -> Outline prompt
2. Approved outline -> Hook prompt (5 options, in brand voice)
3. Approved outline + selected hook -> Section-by-section script prompts (fact lock + guideline lock on every section)
4. Full draft -> Compliance prompt: check banned words, disclaimer, mandatory phrases, unsupported claims
5. If compliance fails -> Fix prompt for that section only, do not regenerate the whole script
6. Optional -> Title, caption, hashtags prompt (in brand voice)

<b>Hard prompt rules for Brand</b>

- Never invent a price, feature, discount, or result that is not in the Products Library / brief.
- Never use a banned word, even if the user topic contains it - replace it and note the change.
- If a required disclaimer applies to the script category, it must appear in the final script.

## 20. Rules and Decisions - Brand

- Brand guidelines override per-script tone requests. Override needs explicit owner action.
- Outline approval is mandatory - same as Personal.
- No script is Final without passing the Compliance and Brand Check, or an explicit user override with a recorded note.
- Approved version is frozen. Edits create a new version.
- Define Brand flow now in Notion, build it after Personal MVP is validated, unless priority is changed explicitly.

## 21. Next Steps - Brand

- [ ] Review and approve this Brand Project flow
- [ ] Decide: is Campaign layer mandatory or optional for MVP? (Recommendation: optional, with Uncategorised default)
- [ ] Finalise Brand Setup wizard fields (Section 13)
- [ ] After Personal MVP: create GitHub issues for Screens 8-15 from this part

---

# PART 3 - FACELESS PRODUCTION SYSTEM (CORE)

This part corrects and upgrades Part 1 and Part 2. This platform is for <b>faceless content</b> - no person appears on camera. The narrator is a voice only, and the visuals carry the story.

<b>This applies to both Personal and Brand projects.</b> Every project in this platform is a faceless project by default.

<b>Important scope clarity</b>

- The platform still does NOT generate audio or video.
- But every script MUST define the visuals in text: visual style, scene visuals, footage / image prompts, on-screen text. That text is the instruction for production outside the platform.
- A script without a visual for every scene is incomplete for faceless content.

<b>Core pipeline (one line)</b><br />Configuration Questions -> Production Bible -> Niche / Sub-Niche -> Topic List -> Research -> Outline -> Scene Breakdown + VO Script -> Audit -> Production Package

## 22. Configuration Questions (Project Setup)

No script is generated from a blank prompt. Every project is first configured by answering a structured question set. Answers are stored as structured data (not free text), become project settings, and are used to auto-generate the Production Bible.

User can skip a question - system uses a sensible default for that niche - but the question, answer, and default used are all saved and editable later in Project Settings.

<b>Group A - Channel / Project Identity</b>

- Project / channel name?
- Project type: Personal or Brand?
- Main platform and format: YouTube Long, YouTube Shorts, Reels / TikTok?
- Average video length target?
- Publishing frequency (used only for topic planning)?

<b>Group B - Niche System</b>

- What are your main niches? (Multiple niches allowed per project - see Section 24)
- For each niche: what are its sub-niches?
- Any niche / sub-niche to strictly avoid?
- Evergreen content, trending content, or both? In what ratio?

<b>Group C - Audience</b>

- Who is the audience? Age range, country / region, knowledge level (beginner / intermediate / expert)?
- What does this audience want from the video: learn, be entertained, relax, decide / buy, stay updated?
- What are their main pain points / questions / curiosities in this niche?
- What should the audience feel and do after watching?

<b>Group D - Language</b>

- Script language? (e.g. English US, English UK, Hindi, Hinglish, Spanish - one primary language per project)
- Language level: Simple, Standard, or Advanced vocabulary?
- Local slang / colloquial words: Allowed / Not allowed?
- Narration style in that language: Formal, Conversational, or Storytelling?
- Words, phrases, or pronunciations to always use / always avoid?

<b>Group E - Tone (as per requirement, not a fixed list only)</b>

- Primary tone: e.g. Documentary, Mysterious, Motivational, Dark / Serious, Warm / Calm, Energetic, Luxury / Premium, Friendly Explainer
- Secondary tone (optional, e.g. Documentary + Slightly Suspenseful)
- Tone intensity: Low / Medium / High
- Narrator persona: e.g. Knowledgeable Friend, Expert Narrator, Storyteller, Investigator, Calm Guide
- Pacing: Slow and calm, Medium, or Fast and punchy?
- Sentence style: Short punchy sentences, Long flowing sentences, or Mixed?
- Humour level: None / Light / High? Emotion level: Low / Medium / High? Formality: Formal / Neutral / Casual?

<b>Group F - Visual Style</b>

- Primary visual style: Stock Footage, AI Images, Animation / Motion Graphics, Maps and Timelines, Charts and Data, Screen Recording, Historical Photos / Archive, Text and Kinetic Typography, or a Mix?
- Visual mood: Dark, Bright, Cinematic, Minimal, Vintage, Futuristic, etc.?
- Colour feeling (as text guidance): e.g. dark blue and gold, muted earthy, high contrast?
- Visual pacing: New visual every how many seconds (default 5-8 seconds for long form)?
- Visuals to avoid: e.g. faces close-up, graphic content, low-quality stock, cartoon style?
- On-screen text style: Subtitles always, Key words only, or Minimal?

<b>Group G - Script Structure</b>

- Default structure for this project: e.g. Hook - Mystery - Reveal - Lesson - CTA, or Problem - Story - Explanation - Takeaway - CTA
- Hook style preference: Question, Shocking Fact, Mystery / Loop, Story Opening, Statistic?
- Open loops / cliffhangers inside the script: Yes / No, how many?
- CTA type: Subscribe, Watch Next, Comment, Link / Product (Brand), or Soft / No CTA?
- Series format: Standalone videos only, Series / Parts, or Both?

<b>Group H - Production Constraints</b>

- Visual source available to the production team: Free stock, Paid stock, AI image tool, Own footage / assets?
- Any topic, claim, or content type that is banned for this channel?
- Disclaimer needed? For which categories (finance, health, history claims, etc.)?
- Copyright caution level: Strict (only safe sources suggested) or Standard?

<b>Implementation note</b><br />Each answer maps to a field in FacelessConfig (Section 33) and to a variable used in prompts (Section 34). Changing configuration later updates the Production Bible version - it does NOT silently change scripts already generated. Each script records which config / bible version it was generated with.

## 23. Production Bible

<b>What it is</b><br />The Production Bible is the single locked reference document for a project - generated from the Configuration Questions, then edited and approved by the user. Every topic, research brief, outline, scene, audit, and package for that project must follow it. It is what makes 100 videos from one channel feel like one channel.

<b>How it is created (implementation)</b>

1. User completes Configuration Questions (Section 22)
2. System auto-generates a Bible draft from those answers (structured sections, not one blob of text)
3. User reviews, edits, and approves it -> Bible v1 is locked
4. Every generation step receives: full Bible summary + the specific Bible section relevant to that step
5. Any Bible edit creates a new version (v2, v3). Old scripts keep the version they used. A banner shows if a project Bible has changed since a script was generated

<b>Bible contents</b>

- <b>23.1 Channel Promise:</b> What the channel promises in every video, in one line. Niche and sub-niche map.
- <b>23.2 Audience Persona:</b> Who they are, what they know, what they feel, language they understand, what bores / offends them.
- <b>23.3 Tone Bible:</b> Primary / secondary tone, narrator persona, pacing, sentence style, humour and emotion levels, example narration lines in correct tone, example lines in wrong tone.
- <b>23.4 Language Bible:</b> Language, level, slang rule, words to use, words to avoid, number / date / name handling, subtitle language if different.
- <b>23.5 Visual Bible:</b> Primary visual style and mix ratio, visual mood and colour feeling, visual pacing rule, scene visual rules per scene type, on-screen text rule, visuals to avoid, stock search style and AI image prompt style (style suffix added to every image prompt).
- <b>23.6 Structure Bible:</b> Default structures by video type, hook formulas approved for this channel, retention rules (pattern interrupt every X seconds, open loop placement, payoff placement), CTA rules and placement.
- <b>23.7 Title and Packaging Bible:</b> Title formula and length, thumbnail text rule (max words, style - text concept only, no image generation), description structure, tags approach.
- <b>23.8 Compliance and Avoid Bible:</b> Banned topics / claims / words, disclaimer templates by category, fact rule (no fact without research, see Section 25), copyright caution rule.

## 24. Niche, Sub-Niche and Topic List System

<b>Hierarchy (implementation)</b><br />Project -> Niches (multiple) -> Sub-Niches (multiple per niche) -> Topics (list per sub-niche) -> One Script / Episode per Topic

Example only: Niche = History -> Sub-Niches = Ancient Civilisations, Wars, Unsolved Mysteries -> Topics = list under each sub-niche.

<b>Rules</b>

- A project can have multiple niches, but each niche must be added in Configuration / Settings - AI does not invent a new niche during script generation.
- Every topic belongs to exactly 1 niche + 1 sub-niche. Every script inherits niche, sub-niche, tone, and visual rules from its topic + Bible.
- Sub-niche can have its own override: e.g. same project, one sub-niche is Dark / Mysterious, another is Calm / Educational. Override is stored on the sub-niche and beats the project default for that topic only.

<b>Topic List (Topic Bank)</b>

- Add topic manually, OR generate topic list with AI: generate 20-50 topics for a selected niche + sub-niche, based on Bible, audience, evergreen / trending setting
- Import topic list as text / CSV (CSV in Later phase)
- Duplicate check: system flags topics that are too similar to an existing topic or a completed script
- Every topic has a status pipeline: Idea -> Shortlisted -> Researched -> Outlined -> Scripted -> Audited -> Packaged -> Done / Archived
- Topic fields: Title / working title, Niche, Sub-Niche, Angle (what is different in our video), Audience hook (why they will click / watch), Format, Target duration, Priority, Status, Score (below)

<b>Topic Scoring (helps user pick what to make first)</b><br />Each generated topic is scored 1-10 on: Audience Interest, Research Material Available, Visual Feasibility for Faceless (can this be shown without a face?), Originality / Low Duplication, Monetisation Fit (Brand: product / offer fit; Personal: niche value fit). Total score is shown - user can sort the Topic List by score. Scores are guidance only, user always decides.

## 25. Research Module

No factual script is generated directly from a topic. Research comes first.

<b>Flow</b><br />Select Topic -> Start Research -> System creates a Research Brief -> User reviews / adds notes / adds own sources -> User approves Research -> Outline is unlocked.

<b>Research Brief contents</b>

- Research questions this video must answer
- Key facts, each with its source note (source name / link as text)
- Timeline / sequence of events (if applicable)
- Important people, places, numbers, and definitions (spelling locked for narration)
- Statistics and claims list - every claim that may appear in the script, with its source
- Common myths vs facts (if applicable)
- Audience FAQs on this topic
- Possible angles and the recommended angle, with reason
- Hook material found in research: most shocking / interesting fact, mystery, or question
- Visual material available: what can actually be shown for this topic, scene by scene potential (maps, photos, footage types, charts needed)

<b>Implementation rules</b>

- Every factual claim in the final script must trace back to the Research Brief claims list or to Brand product facts. This is the Fact Lock for all faceless projects, not only Brand.
- Research Brief is saved and linked to the Topic and Script forever, and its source list is reused in the Production Package.
- If research is thin for a topic, system warns before outlining: Low Research - script may be weak. User can proceed with an override note, add research, or drop the topic.

## 26. Revised Faceless Script Flow (End to End)

1. Create Project -> Answer Configuration Questions -> Production Bible generated -> User approves Bible
2. Add / confirm Niches and Sub-Niches
3. Build Topic List (manual + AI generated) -> Score and shortlist topics
4. Select Topic -> Research Brief -> User approves research
5. Outline generated from Bible + Research + Topic angle -> User edits / approves outline (mandatory)
6. Scene Breakdown generated from outline (Section 27) -> User can reorder / edit scenes
7. VO Narration Script generated per scene, in Bible tone and language
8. Visual instruction generated per scene (same step, scene is not complete without it)
9. User edits in Scene Editor (Section 27)
10. Audit runs (Section 28) -> Failed items fixed section / scene-wise -> Re-audit
11. Production Package generated (Section 29) -> Export -> Topic status = Packaged / Done

## 27. Scene Breakdown and Scene Editor

For faceless content, the script is NOT one long text. It is a list of scenes. This is the most important implementation change.

<b>Scene rule</b><br />One scene = one idea / one visual moment. Approx 20-40 words of narration per scene for long form (adjusted by language and pacing in the Bible), approx 5-15 seconds per scene. A new scene starts when the visual or the idea changes.

<b>Scene fields (every scene must have all of these)</b>

| Field | Meaning |
| --- | --- |
| Scene No. | Order in the video |
| Section | Hook / Intro / Body point / Climax / Conclusion / CTA |
| Narration (VO) | Exact text the narrator reads - clean, no stage directions inside it |
| Visual | What is seen on screen for this scene, in detail |
| Visual Type | Stock Footage / AI Image / Animation / Map / Chart / Archive Photo / Screen / Text |
| Visual Prompt / Search Terms | For AI Image: full image prompt (with Bible style suffix). For Stock: search terms a producer can paste |
| On-Screen Text | Text shown on screen in this scene, or None |
| Music / SFX Note | Text note only, e.g. tense low music, whoosh transition |
| Transition | Cut / Fade / Zoom / Pan / etc. as a text note |
| Duration (est.) | Calculated from narration word count + project pacing |
| Retention Note | Why this scene keeps attention: open loop, payoff, pattern interrupt, question |

<b>Scene Editor (implementation)</b>

- Main view: scene table / cards - edit narration, visual, or any field per scene, reorder by drag, add / split / merge / delete a scene
- Second view: Clean VO view - only narration text in order, for reading / recording / copying. Editing here maps back to scenes
- Totals bar always visible: total scenes, total words, estimated video duration, scenes missing a visual (must be zero to pass audit)
- Regenerate works per scene: Regenerate Narration, Regenerate Visual, Make Scene Shorter / Longer - never regenerate the whole script for one bad scene

## 28. Audit System

Audit runs on a completed script draft, before the Production Package. It produces a scored Audit Report, not just pass / fail.

<b>Audit checks</b>

- <b>Hook Audit:</b> Is there a strong hook in the first scenes? Does it match the topic promise? Is the first open loop placed early?
- <b>Retention Audit:</b> Open loops and payoffs balanced? Any long stretch with no pattern interrupt / new visual idea? Pacing vs Bible?
- <b>Tone Audit:</b> Does narration match Bible tone, narrator persona, sentence style, humour / emotion level throughout - or does it drift?
- <b>Language Audit:</b> Correct language and level throughout? Banned words / phrases present? Names / numbers consistent with Research Brief spelling?
- <b>Fact Audit:</b> Every claim traced to Research Brief / product facts? Any unsupported or invented claim flagged with scene number.
- <b>Visual Audit (Faceless Audit):</b> Does EVERY scene have a visual? Is every visual actually producible without a face / on-camera person? Any visual repeated too many times? Visual pacing vs Bible rule?
- <b>Structure Audit:</b> Does the script follow the Bible structure for its format? Are all outline points covered? Is the payoff / conclusion satisfying the title promise?
- <b>Title Promise Audit:</b> Does the script actually deliver what the working title / topic angle promises?
- <b>Compliance Audit:</b> Banned topics / words, disclaimer present if required, copyright caution (no instruction to copy protected footage / text).
- <b>CTA Audit:</b> CTA present, correct type, correct placement, not too salesy for the Bible tone (Personal) / matches brand CTA (Brand)?

<b>Scoring and fix loop (implementation)</b>

- Each audit area scored out of 10, total out of 100. Project sets a pass threshold (default 80).
- Every failed check points to exact scene numbers and gives a fix suggestion.
- User can: Auto-Fix (regenerates only the failed scenes / items), Edit Manually, or Override with a note.
- After fixes, re-audit only the failed areas. Audit Report version is saved with the script.
- Production Package can be generated below threshold only with an explicit override note, and the package shows that warning.

## 29. Production Package

The final output of this platform is not just a script file. It is a complete Production Package (all text / documents) that a narrator and editor can produce from without asking any question.

<b>Package contents</b>

1. <b>Clean VO Script</b> - narration only, in order, with total word count and estimated duration. For the voice artist / external TTS.
2. <b>Full Production Script</b> - complete Scene Breakdown table (all fields from Section 27).
3. <b>Scene Breakdown Sheet</b> - scene list in a simple checklist form for production tracking.
4. <b>Visual Asset List</b> - per scene: visual type, stock search terms / AI image prompts, charts / maps / assets to create, in scene order.
5. <b>Title Package</b> - final title + 3-5 title options, description (built from Bible description structure), tags / hashtags, thumbnail text + thumbnail concept as text (max words per Bible).
6. <b>Chapters / Timestamps Outline</b> - section list with estimated start times from scene durations.
7. <b>Research and Sources List</b> - claims list with sources, from the Research Brief.
8. <b>Audit Report</b> - final scores, checks passed, any overrides with notes.
9. <b>Production Notes</b> - Bible version used, config summary (niche, sub-niche, tone, language, visual style), disclaimer text if applicable, CTA note.

<b>Implementation</b>

- Package is generated in one click only from an audited script version. Package records script version + Bible version + audit version - if the script changes after packaging, package is marked Outdated and must be regenerated.
- Export package: one ZIP containing DOCX / PDF / CSV files (scene breakdown as CSV / sheet is important for editors), OR export individual items. Individual script export (Copy / TXT / DOCX / PDF) from earlier parts still works.
- Package checklist shown before export: VO script ready, all scenes have visuals, audit passed or overridden, title selected, disclaimer included if required. Missing item = package blocked or warned, per checklist rule.

## 30. Additional Screens - Faceless

These are added over Personal Screens 1-7 and Brand Screens 8-15. Existing screens are updated, not rebuilt, where noted.

- [ ] 16\. Configuration Wizard (Groups A-H, Section 22) - replaces the simple project setup in Screens 3 and 8
- [ ] 17\. Production Bible Page - view / edit sections, version history, approve / lock
- [ ] 18\. Niche and Sub-Niche Manager - add / edit niches, sub-niches, sub-niche overrides
- [ ] 19\. Topic Bank / Topic List - list by niche + sub-niche + status, AI topic generation, scoring, shortlist
- [ ] 20\. Research Brief Page - view / edit brief, approve research, sources list
- [ ] 21\. Scene Editor - scene table view + Clean VO view, totals bar (updates Screen 7)
- [ ] 22\. Audit Report Page / Panel - scores by area, failed scenes, auto-fix, re-audit, override
- [ ] 23\. Production Package Page - package checklist, package contents, export ZIP / individual files, outdated warning

## 31. Implementation Phases and Build Order - Faceless

Build in this order. Do not build Package before Audit, and do not build generation before Bible - the pipeline depends on it.

<b>Phase 1 - Configuration and Bible</b><br />Configuration Wizard (Groups A-H) with structured storage and defaults, Production Bible auto-generation from config, Bible edit / version / lock. Acceptance: a new project can be fully configured and a Bible v1 approved without writing any script.

<b>Phase 2 - Niche, Topics and Research</b><br />Niche / Sub-Niche manager, Topic Bank with AI topic generation, dedupe and scoring, Research Brief generation and approval, topic status pipeline. Acceptance: user can go from niche to a shortlisted, researched, approved topic.

<b>Phase 3 - Scene-Based Generation</b><br />Outline from Bible + Research, Scene Breakdown generation (scene objects, not text blob), VO narration per scene, visual + prompt per scene, Scene Editor with Clean VO view and totals. Acceptance: a researched topic becomes a complete scene-wise script where every scene has narration and a visual.

<b>Phase 4 - Audit</b><br />All audit checks in Section 28, scoring, scene-level failure pointers, auto-fix failed scenes only, re-audit, override with note. Acceptance: a script below threshold cannot be silently packaged - it is fixed, re-audited, or overridden with a note.

<b>Phase 5 - Production Package</b><br />Package assembly from audited version, package checklist gate, ZIP + individual exports, outdated detection on script change. Acceptance: one click produces a complete package a narrator and editor can use with no missing item unflagged.

## 32. Data Model - Faceless Additions (v2)

Added to Part 1 and Part 2 models. Script is now built from Scene objects.

<b>FacelessConfig</b>

- id, project\_id, platform\_format, target\_duration, niches\_summary, audience (JSON: age, region, level, goal, pain\_points), language (JSON: language, level, slang\_allowed, narration\_style, use\_words, avoid\_words), tone (JSON: primary, secondary, intensity, persona, pacing, sentence\_style, humour\_level, emotion\_level, formality), visual\_style (JSON: primary, mix, mood, colour\_feeling, pacing\_seconds, avoid, on\_screen\_text\_style), structure (JSON: default\_structure, hook\_style, open\_loops, cta\_type, series\_format), production (JSON: visual\_source, banned\_content, disclaimer\_categories, copyright\_level), config\_version, created\_at, updated\_at

<b>ProductionBible</b>

- id, project\_id, version, status (draft / approved), sections (JSON: channel\_promise, audience\_persona, tone\_bible, language\_bible, visual\_bible, structure\_bible, packaging\_bible, compliance\_bible), config\_id, created\_at, approved\_at

<b>Niche / SubNiche</b>

- Niche: id, project\_id, name, description, order
- SubNiche: id, niche\_id, name, description, overrides (JSON: tone / visual / structure overrides or null)

<b>Topic</b>

- id, project\_id, niche\_id, sub\_niche\_id, title, angle, audience\_hook, format, target\_duration, priority, status (idea / shortlisted / researched / outlined / scripted / audited / packaged / done / archived), scores (JSON: interest, research, visual\_feasibility, originality, monetisation\_fit, total), created\_at

<b>ResearchBrief</b>

- id, topic\_id, research\_questions (JSON), key\_facts (JSON with source per fact), timeline (JSON), entities (JSON: people, places, numbers, definitions), claims (JSON with source per claim), myths\_vs\_facts (JSON), faqs (JSON), recommended\_angle, hook\_material, visual\_material (JSON), status (draft / approved), low\_research\_warning (boolean)

<b>Scene</b>

- id, script\_id, version\_id, scene\_no, section, narration, visual, visual\_type, visual\_prompt\_or\_search, on\_screen\_text, music\_sfx\_note, transition, duration\_est\_seconds, retention\_note

<b>AuditReport</b>

- id, script\_id, version\_id, scores (JSON per audit area + total), pass\_threshold, passed (boolean), failures (JSON: check, scene\_nos, suggestion), overrides (JSON with notes), created\_at

<b>ProductionPackage</b>

- id, script\_id, version\_id, bible\_version, audit\_id, status (ready / outdated), checklist (JSON), contents (JSON: file list), exported\_at

<b>Script - extra fields for Faceless</b>

- topic\_id, niche\_id, sub\_niche\_id, research\_brief\_id, bible\_version, config\_version, scene\_count, estimated\_duration\_seconds

## 33. Prompt Pipeline - Faceless Implementation (v2)

Every step is a separate prompt with clear input and structured (JSON) output. Never one giant prompt from topic to final script.

1. <b>Config -> Bible Prompt:</b> Input = FacelessConfig answers. Output = Production Bible sections JSON.
2. <b>Topic Generation Prompt:</b> Input = Bible summary + niche + sub-niche + evergreen / trending setting. Output = topic list JSON with angle, hook, and scores per topic.
3. <b>Research Prompt:</b> Input = topic + Bible audience section. Output = Research Brief JSON, every claim with a source field.
4. <b>Outline Prompt:</b> Input = approved Research Brief + Bible structure section + topic angle. Output = outline sections JSON.
5. <b>Scene Plan Prompt:</b> Input = approved outline + Bible visual and structure sections. Output = scene plan JSON: scene list with section, visual type, and retention purpose per scene - no narration yet.
6. <b>Narration Prompt (per scene / batch):</b> Input = scene plan + Bible tone and language sections + research claims for that scene. Output = narration text per scene, word count inside scene limit.
7. <b>Visual Prompt (per scene):</b> Input = scene narration + Bible visual section. Output = visual description + visual prompt / stock search terms + on-screen text per scene. Image prompts automatically get the Bible style suffix.
8. <b>Audit Prompts (per audit area):</b> Input = full scene list + relevant Bible section + research claims. Output = scores + failures with exact scene numbers.
9. <b>Fix Prompt:</b> Input = one failed scene + failure reason + relevant Bible section. Output = corrected scene only. Loop back to Audit for that area only.
10. <b>Package Prompt:</b> Input = audited scenes + Bible packaging section + research sources. Output = titles, description, tags, thumbnail text and concept, chapters outline. Package files are assembled by the system from stored data, not generated as free text.

<b>Pipeline rules</b>

- A step cannot run if the previous step is not approved / completed, except with an explicit override that is recorded.
- Every prompt receives the Bible version stored on the script - prompts never silently use a newer Bible.
- All structured outputs are validated (required fields, scene has visual, narration word limit) before saving. Failed validation = retry that step, do not save a broken scene.

## 34. Rules and Decisions - Faceless

- Faceless is the default and core of this platform. Part 1 and Part 2 flows must be read with this part.
- No configuration = no generation. No Bible approval = no topic generation.
- No research approval = no outline, for factual niches. Override is possible, but it is recorded and shown in Audit and Package.
- No scene without a visual. This is a hard rule, checked in validation and in Audit.
- Narration (VO) text stays clean - no visual instructions, music notes, or stage directions inside narration. Those live in their own scene fields.
- Tone, language, audience, and visual style come from the Bible, not from a fresh user prompt each time. Per-script change = either a sub-niche override or a recorded one-off override for that script.
- Audit before Package. Always.

## 35. Next Steps - Faceless

- [ ] Review and approve Part 3 - this becomes the main build specification over Parts 1 and 2 where they conflict
- [ ] Finalise the Configuration Questions list (Section 22) - exact wording and which questions are required
- [ ] Finalise preset lists: tone presets, visual style presets, hook styles, structure templates
- [ ] Create GitHub issues by Phase (Section 31), not by random feature: Phase 1 issues first

---

# PART 4 - MONOREPO SPEC SUMMARY (Website, Admin Panel, API)

This part summarises the spec files created for the monorepo on 2026-10-27. Full spec files are the detailed source for developers - this part is the index and summary so the plan is visible in Notion.

<b>Spec file location (local, not yet pushed to GitHub)</b>

- Root: <code>ai-script-writer/README.md</code>
- Website: <code>ai-script-writer/apps/web/SPEC.md</code>
- Admin Panel: <code>ai-script-writer/apps/admin/SPEC.md</code>
- API: <code>ai-script-writer/services/api/SPEC.md</code>
- Shared: <code>ai-script-writer/packages/shared/SPEC.md</code>
- Master workflow copy: <code>ai-script-writer/docs/WORKFLOW.md</code>

## 36. Master Workflow Adopted

The user-provided workflow file is now the MASTER pipeline. It supersedes the pipeline order in Parts 1-3 where they conflict. Parts 1-3 remain useful for Personal, Brand, and Faceless detail (fields, scene schema, audit areas, bible sections).

<b>Final Pipeline</b><br />Niche -> Sub-Niche -> Audience and Channel Strategy -> Topic List -> Topic Evaluation and Selection -> Configuration Questions -> Research and Fact Verification -> Production Bible -> Narrative Structure and Outline -> Script Drafting -> Scene Breakdown -> Audit and Quality Control -> Revision and Final Approval -> Production Package -> Performance Feedback Loop

Optional: 16. Visual and Asset Research, 17. Platform and Publishing Optimization

All 12 Workflow Control Rules from the master file apply to every app and the API. Key ones for implementation: stage order is enforced, Bible is the central rule source, claims stay traceable to sources, approvals are required at topic selection / outline / final script, audit runs before package, never invent sources or claims, unresolved issues are tracked explicitly, performance data improves future projects.

## 37. Two-Level Concept (how the pipeline maps to the product)

- <b>Workspace Project</b> (Personal or Brand, faceless channel): created once. Holds the reusable parts - Steps 1-3 strategy (niches, sub-niches, audience and channel strategy), Step 6 configuration defaults, Step 8 Production Bible versions.
- <b>Workflow Run</b> (one video): created many times inside a project. Moves through Steps 4-15 for one selected topic, with its own research, outline, script, scenes, audit, package, and performance record. A Run snapshots the Bible version and configuration version it uses - later project changes do not silently change an existing Run.

## 38. Monorepo Structure

```javascript
ai-script-writer/
  apps/
    web/          User website + authenticated user app - SPEC.md
    admin/        Internal admin panel, separate app and deploy - SPEC.md
  services/
    api/          Backend API + async AI jobs - SPEC.md
  packages/
    shared/       Shared types, enums, workflow step definitions - SPEC.md
    ui/           Shared UI components (later)
    config/       Shared build config (later)
  docs/
    WORKFLOW.md   Master workflow (user-provided)
```

Recommended tooling (to confirm, specs are stack-neutral): pnpm workspaces + Turborepo, TypeScript across web, admin, api, and shared.

## 39. Website Spec Summary - apps/web/[SPEC.md](http://SPEC.md)

<b>Purpose:</b> Public marketing site plus the authenticated SaaS workspace where projects are configured and Runs are produced.

<b>Public routes:</b> Landing, Features (grouped by Phase 1-8), Pricing, Login / Signup / Forgot Password.

<b>App routes:</b> Dashboard, Projects list, Create Project Wizard, Project Home, Project Settings, Project Topic Bank, Runs list, Run Workspace, Run Package page, Run Performance page, Library, Billing, Account Settings.

<b>Create Project Wizard (in master order):</b> Step 1 Niche (multiple allowed) -> Step 2 Sub-Niche per niche -> Step 3 Audience and Channel Strategy -> Step 6 Configuration Questions -> Step 8 Production Bible draft generated, user edits and approves v1. No Run can start until a Bible version is approved.

<b>Run Workspace:</b> Persistent stepper for Steps 4-15 plus optional 16-17. Each step has one screen with defined actions and a gate to the next step: Topic List (generate / add / dedupe warning) -> Topic Evaluation (scoring matrix, explicit Select Topic approval) -> Run Configuration (project defaults, per-run overrides) -> Research and Fact Verification (claims with sources, conflicts, approve) -> Bible Confirm for this Run -> Outline (edit, approve) -> Script Drafting (word count, duration vs target, per-section regenerate) -> Scene Breakdown (scene table, totals bar, Clean VO view) -> Audit (scores, failures by scene) -> Revision and Final Approval (auto-fix failed scenes only, re-audit, flag unresolved, approve) -> Production Package (checklist, ZIP / per-item download, outdated warning) -> Performance Feedback (metrics entry, insights). Optional screens: Visual and Asset Research, Platform and Publishing Optimization.

<b>Shared form components defined in the spec:</b> Tone Builder (primary / secondary tone, intensity, narrator persona, pacing, sentence style, humour, emotion, formality), Language, Audience, and Visual Style builders - reused in project settings, run configuration, and sub-niche overrides, with inherited vs overridden state shown.

<b>Acceptance highlights:</b> A new user can complete signup to a downloadable Production Package without leaving the stepper or doing steps out of order. A scene without a visual cannot be marked complete. Package cannot be generated before audit + final approval (or recorded override).

## 40. Admin Panel Spec Summary - apps/admin/[SPEC.md](http://SPEC.md)

<b>Purpose:</b> Internal operations only. Separate app and deploy, no public signup, MFA recommended for super\_admin, all actions through the API and logged. Roles: super\_admin, admin, support (later, read-only).

<b>Routes / modules:</b> Overview Dashboard, Users, Projects, Runs, Audit Quality Center, Taxonomy and Presets, Prompts and Models, Plans and Credits, Feature Flags, Content Safety Queue, Platform Performance Insights, Logs, Settings.

<b>Overview Dashboard highlights:</b> Users and plan distribution, projects and runs, a pipeline funnel (runs by current step 1-15, drop-off by stage), AI jobs by step with success / failure and credits consumed, average audit score and pass rate, alerts (failed jobs, stuck runs, safety queue, unresolved flags).

<b>Users / Projects / Runs:</b> Search and filter everything. Admin can suspend / reactivate a user, adjust credits only via a ledger entry with a mandatory reason, change plan, retry or cancel a job, and add support notes.

<b>Hard limits (by design, UI must not offer these):</b> Admin cannot skip a stage gate, approve a step on behalf of a user, mark an unverified claim as verified, edit a credit balance directly, or see / set a user password or any provider API key.

<b>Taxonomy and Presets:</b> Draft -> publish -> archive, versioned, for niche / sub-niche presets, tone presets, visual style presets, hook styles, structure templates, CTA types. Used-by count shown; projects keep the snapshot they selected.

<b>Prompts and Models (super\_admin):</b> One prompt template per generation step, named variables validated against the shared package, draft -> test on a sample run (side-by-side with published) -> publish with change note, one-click rollback. Keys are never shown in the UI.

<b>Plans, Credits, Flags, Safety, Logs:</b> Plans and credit packs CRUD (no retroactive change to subscribers without a logged migration), read-only credit ledger, feature flags including modules 16 and 17 with dependent-run warnings, a safety queue (flagged claims, banned content, reports - admin reviews, never rewrites a claim to verified), aggregated anonymised performance insights, and an immutable admin audit log plus a system job-failure log view.

## 41. API Spec Summary - services/api/[SPEC.md](http://SPEC.md)

<b>Purpose:</b> Single backend for web and admin. Owns auth, all workflow data, the stage-gate state machine, async AI jobs, credits, package exports, and admin operations. No app talks to the database directly.

<b>Conventions:</b> REST / JSON under /api/v1, Bearer JWT (separate admin JWT with role), cursor pagination, standard success / error envelope, typed error codes including STAGE\_LOCKED, APPROVAL\_REQUIRED, INSUFFICIENT\_CREDITS, JOB\_ALREADY\_RUNNING. Generation returns 202 with a jobId.

<b>Stage-Gate State Machine (most important part):</b> Run stages in master order, each with status locked / ready / in\_progress / awaiting\_approval / done / failed / needs\_revision. A stage can start only if its dependent previous stage is done. Approval stages require an explicit approve call by the owner / approver - no job and no admin action can approve. Audit must be done before Package. Editing an approved script / scene / outline moves dependent stages to needs\_revision and marks any Package outdated - the API computes the new stage map.

<b>Endpoint groups:</b> Auth and Me (profile, credits, ledger); Projects (CRUD, niches, sub-niches, audience strategy, configuration, Bible generate / versions / approve, plus Brand products, guidelines, campaigns); Runs (create with Bible + config snapshot, open issues tracker); Topics (generate, manual, dedupe, evaluate, score override, select = approval, plus a project Topic Bank); Run Configuration; Research (run, sources, claims, approve); Bible Confirm per Run; Outline (generate, edit, approve); Script (generate, per-section regenerate, versions); Scenes (generate, CRUD, reorder, per-scene regenerate, server-computed totals, complete-scene validation); Audit (run, report versions, auto-fix a failure, re-run, final-approve with override rule); Production Package (checklist, generate, manifest with signed expiring download URLs, outdated flag); Performance (record / import CSV, insights job - Bible changes only as proposed edits the user approves); Optional 16 Assets and 17 Publishing (feature-flagged); Admin API mirroring the Admin spec.

<b>Fact rule in data:</b> A Claim has a status (verified\_fact / assumption / speculation / conflicting) and source links. A claim cannot be saved as verified\_fact with zero sources (422), and Research cannot be approved while a script-bound verified claim is unsourced.

<b>Jobs and Credits:</b> Estimate -> user confirms estimate -> job created with a credit hold -> capture on success, release on failure. Idempotency-Key required on generation endpoints - a duplicate key returns the original job, never a second charge. Every ledger entry references job, run, and action.

<b>Data model:</b> About 35 core tables listed in the spec, including User, WorkspaceProject, Niche, SubNiche, AudienceStrategy, ProjectConfiguration, ProductionBibleVersion, WorkflowRun, Topic, ResearchBrief, Source, Claim, OutlineVersion, ScriptVersion, Scene, AuditReportVersion, ProductionPackage, PerformanceRecord, AssetItem, PublishingOutput, Job, OpenIssue, PromptTemplate, TaxonomyPreset, AdminAuditLog.

## 42. Shared Package Spec Summary - packages/shared/[SPEC.md](http://SPEC.md)

<b>Purpose:</b> One definition of everything the three apps must agree on, so they cannot drift: the ordered PIPELINE\_STEPS list (17 steps with phase, label, approval-gate and optional flags), phases, RunStage and StageStatus enums, stage dependencies, all core DTO types, shared enums (project type, platform, claim status, job status, package status, license status), validation schemas for API resources, and pure helpers (duration estimate, scene-complete check, lock reason). Changing a step name or order means editing only this package plus the master workflow doc.

## 43. Build Order (from the root spec)

1. packages/shared - enums, stage definitions, DTOs
2. services/api - auth, projects, runs + stage gates, jobs, credits
3. apps/web - workflow screens in pipeline order, Steps 1-15
4. apps/admin - monitoring / read first, control (taxonomy, prompts, flags) second
5. Optional modules 16-17 last, behind feature flags

## 44. Open Decisions (across all specs)

- [ ] Confirm stack and tooling: Next.js for web / admin, API framework and database, queue and object storage providers, pnpm + Turborepo
- [ ] Billing model and provider: subscription, credit packs, or both
- [ ] Admin MFA method, IP allowlist yes / no, support role in MVP or later
- [ ] Performance metrics in MVP: manual entry only (recommended) vs CSV import vs platform API integration later
- [ ] Captions in the Package for MVP: captions plan + narration text file (recommended) - timing-accurate captions need audio, which is out of scope
- [ ] Job status in MVP: polling (recommended) with the webhook interface defined now for later

## 45. Status and Next Steps - Monorepo Specs

- [x] Spec v1 created for Website, Admin Panel, API, and Shared, from the master workflow file
- [x] Summary added to Notion (this part)
- [ ] Review and approve the spec files
- [ ] Push the spec files to the GitHub repo in the same monorepo folder structure
- [ ] Create GitHub issues from Build Order (Section 43): shared package issues first, then API, then Web, then Admin

---

## 46. DECISION - Personal Project, FULLY DYNAMIC, No Limitations

<b>User decision, 2026-10-27. This supersedes any caps or recommended counts mentioned in chat for niches, sub-niches, or questions. Those numbers were a proposal only and were NOT adopted.</b>

This is a personal project, so no limitation is needed:

- <b>Niches: unlimited.</b> Admin can add any number of niches in the Admin Panel, at any time.
- <b>Sub-Niches: unlimited per niche.</b> No maximum, and no minimum number of sub-niches required for a niche.
- <b>Configuration Questions: unlimited and fully dynamic.</b> Admin creates questions in the Admin Panel (new route: /questions, Question Builder). No fixed question list in code.
- <b>Topics, presets (tone, visual style, hooks, structures, CTAs): unlimited and dynamic.</b> All are data / CRUD lists, none are hard-coded.
- <b>Plans do not cap</b> projects, runs, niches, sub-niches, topics, or questions.

<b>How fully dynamic is implemented (updated in the local spec files)</b>

- Admin Panel Spec Section 8 rewritten: Dynamic Question Builder. Every question is a record with: unique key, label, scope (global / niche / sub-niche / workflow step), type (single choice, multi choice, short text, long text, number, slider, range, yes-no, date), any number of options, default, required or optional, order and grouping, optional validation, optional conditional visibility (show only if another answer matches), and mapsTo (config field, Production Bible section, prompt variable).
- API Spec new Section 6A: taxonomy and presets served as data, and a GET /config-schema endpoint returns the applicable questions for a project / niche / sub-niche / step. Answers are stored by question key + question version.
- Website Spec Section 6 updated: configuration forms are rendered by a Dynamic Form component from the API schema only - the website has no hard-coded question list.
- Shared Package Spec new Section 1A: only the shapes / types for taxonomy and questions are defined in code, never an enumerated list of niches or questions.
- The only restrictions are data-integrity rules, not usage limits: unique keys / names, a used item is archived instead of hard-deleted, and changes are versioned so existing projects keep the answers and versions they already used.

<b>Result:</b> Adding a new niche, sub-niche, preset, or question in Admin makes it available in the user flow immediately - no code change, no deploy, and no count limit blocking it.

- [x] Local spec files updated: README, apps/admin/[SPEC.md](http://SPEC.md), apps/web/[SPEC.md](http://SPEC.md), services/api/[SPEC.md](http://SPEC.md), packages/shared/[SPEC.md](http://SPEC.md)
- [x] Decision recorded in Notion (this section)
- [ ] Push updated spec files to GitHub (pending, with the rest of the specs)

---

## 47. Niche-wise Questions List and Niche Templates (Reusable)

Added 2026-10-27, on top of Section 46 (Fully Dynamic, No Limitations). Idea: create once per niche, reuse in every project and run of that niche.

### A. Niche-wise Questions List

- Questions live once in a <b>Question Library</b> (Admin). Admin does not re-type the same question for every niche.
- Each niche has its own Questions List page in Admin, showing in user-facing order: Inherited Global Questions, Niche Questions, and Sub-Niche Questions grouped by sub-niche.
- Two reuse modes when adding a library question to a niche:
  - <b>Assign</b> - link the same question. Per-niche override allowed only for order, required / optional, default value, and grouping. Editing the library question creates a new version everywhere it is assigned; projects that already answered keep their answered version.
  - <b>Clone</b> - copy it into an independent niche-specific question and customise wording / options freely. Library edits do not affect a clone. The list clearly marks each item as Assigned or Cloned.
- A question can be assigned to any number of niches and sub-niches (unlimited). Removing it from a niche removes only that assignment, never the library question.
- The list a user actually sees is resolved by the API: Global + Niche + Sub-Niche questions, in Admin-defined order (GET /niches/:id/questions and GET /config-schema).

### B. Niche Templates

A Niche Template is a reusable, versioned bundle for one niche that pre-fills a new project so the same setup is never built twice. Unlimited templates; a niche can have multiple templates (for example different formats), one marked Default. Admin route: /niche-templates.

<b>Template sections (each section is optional and applied independently)</b>

1. Strategy Defaults - audience strategy defaults for this niche
2. Configuration Defaults - language, tone values, visual style, format / length, narration format, CTA defaults
3. Production Bible Template - pre-filled Bible sections used to generate the project Bible draft
4. Questions Set - reference to this niche's questions list (Part A)
5. Research Template - research questions checklist, fact types to always gather, preferred source types, claim types
6. Structure Templates - one or more narrative / outline structures for this niche (hook pattern, section sequence, payoff pattern)
7. Scene Template - typical scene / visual type mix, shot patterns, on-screen text style
8. Audit Add-ons - niche-specific audit checks on top of the global audit (example: date accuracy for History, disclaimer check for Finance)
9. Packaging Defaults - title formulas, thumbnail text style, description structure, tags approach, default package deliverables

<b>Create a template in 3 ways</b>

- From scratch in Admin
- Clone another niche's template and edit it (fastest way to start a new niche)
- Save As Template from an existing project / run setup in the Website - a working project becomes the reusable starting point

<b>Scope and inheritance</b>

- Scope: Global (Admin library, reusable by all projects) or Personal (owner's own templates, from Save As Template). Same shape and same apply flow for both.
- Sub-niche template = niche template + overrides only. Resolution order: Niche Template -> Sub-Niche Overrides -> Project Edits.

<b>Apply flow (Website)</b>

- In the Project Creation Wizard, right after niche selection: if the niche has templates, a picker shows them (Default pre-selected) with a per-section preview. Apply pre-fills strategy, configuration, and Bible draft as a snapshot - everything stays editable. Skip continues with a blank setup.
- Apply never overwrites user-edited content silently: if a section already has edits, it is reported as a conflict and the user chooses per section.
- In a Run, the applied template's Research checklist, Structure Templates, and Audit Add-ons are the defaults at the Research, Outline, and Audit steps.
- Template updates do not silently change projects that applied an older version. Project Home shows a "new template version available" notice with a section diff; re-applying is always an explicit user action.

<b>Implementation pointers (updated in the local spec files)</b>

- Admin Spec Section 8: Question Library, niche questions list (Assign vs Clone), Niche Templates lifecycle
- API Spec Section 6A: GET /niches/:id/questions, template CRUD + clone, POST /projects/:id/apply-template, POST /projects/:id/save-as-template, GET /projects/:id/template-status. New data: NicheQuestionAssignment, NicheTemplate, NicheTemplateVersion
- Website Spec new Section 4A: niche-wise questions in the wizard, Apply Template flow, Save As Template, template update notice
- Shared Spec Section 1A: NicheQuestionAssignment and NicheTemplate types - one shape used by Admin, Web, and API

- [x] Spec files updated locally
- [x] Recorded in Notion (this section)
- [ ] Push to GitHub (pending, with the rest of the specs)

---

## 48. Production Bible EXPANDED - 6 New Sections (Bible is now 14 Sections)

Added 2026-10-27 (user approved). This extends Section 23, where the Bible had 8 sections (23.1 Channel Promise, 23.2 Audience Persona, 23.3 Tone Bible, 23.4 Language Bible, 23.5 Visual Bible, 23.6 Structure Bible, 23.7 Title and Packaging Bible, 23.8 Compliance and Avoid Bible). Those 8 are unchanged. The Bible now counts <b>14 sections</b>, with these 6 added:

<b>23.9 Voice and Narration Bible</b><br />Voice profile as a text instruction for the external voice artist / TTS (age feel, deep / calm / authoritative, etc.), speaking rate (words per minute by format), pause rules, emphasis rules, how to read numbers, dates and quotations, energy curve (intro vs climax vs ending). Tone defines writing style - this section defines delivery. Used by: Script Drafting and VO Instructions in the Production Package.

<b>23.10 Glossary and Pronunciation Bible</b><br />A growing registry per niche: niche terms with locked spelling and a simple definition, people and place names with correct spelling, phonetic pronunciation for difficult words, terms that must be explained on first use for the audience, banned synonyms. Used by: Research, Language Audit, and the narrator. Purpose: the same name is never spelled or pronounced differently across videos.

<b>23.11 Music and Sound Bible</b><br />Music genre / mood per section type, music intensity rule, SFX palette, when to use silence, music-under-narration rule, banned sound types. Used by: Scene Breakdown - every scene has a music / SFX cue, and this section keeps those cues consistent across all videos of the project.

<b>23.12 Series and Continuity Bible</b><br />Intro / outro template text, recurring segment names and formats (example: a named myth-check segment), catchphrases, character / world registry for story niches, continuity log, and rules for callbacks and watch-next references to previous videos. Used by: Outline and Continuity Audit.

<b>23.13 Research and Evidence Standards</b><br />Preferred source hierarchy per niche, minimum source expectation per claim type, how conflicting facts are handled, exact wording patterns for uncertainty (so speculation never sounds like fact, example patterns like "historians believe..." / "according to..."), recency rules, and citation style for the Production Package. Used by: Research and Fact Verification (Step 7) and Fact Audit. Note: the fact rule itself stays in 23.8 Compliance - this section defines the research standards behind it.

<b>23.14 Performance Learnings Log (Living Annex)</b><br />The permanent home for Step 15 performance learnings: hook patterns that worked / failed, retention drop-off patterns, best performing structure and video length per sub-niche, title patterns by CTR, topics to repeat / avoid. <b>Approved learnings only</b> - a learning enters this section as a proposed Bible edit, the user approves it, and approval creates a new Bible version. It is never auto-edited. Used by: future Topic Generation, Topic Evaluation, and Hook writing. This is what closes the Phase 8 feedback loop into the Bible.

<b>Optional annexes (not added as core sections)</b><br />Monetization and Sponsor Annex (mainly Brand: sponsor segment format, disclosure text, product mention rules) and Accessibility Annex (on-screen text readability, caption line length / speed, contrast). Add per project only if the niche needs them.

<b>Implementation (updated in the local spec files)</b>

- API Spec Section 5: the canonical 14-key Bible sections list, with what consumes each new section
- Shared Spec: ProductionBible sections now list all 14 keys - one definition for Web, Admin, API
- Website Spec Section 4: the Project Wizard Bible step is a section-by-section editor for all 14 sections (Learnings Log starts empty, read-only in the wizard); Section 11 now names the Learnings Log as the Step 15 target
- Admin Spec Section 8: a Niche Template's Bible Template can now pre-fill any of the 14 sections (typically including niche glossary terms, research standards, and music/sound defaults)

- [x] Spec files updated locally
- [x] Recorded in Notion (this section)
- [ ] Push to GitHub (pending, with the rest of the specs)

---

## 49. Bible Annexes - Monetization, Accessibility, and Niche-Dependent Annexes

Added 2026-10-27. The 14 core Bible sections (Sections 23.1-23.14, with the expansion in Section 48) are the same for every project. <b>Annexes are extra Bible sections that depend on the niche and the project.</b> An annex is either ON for a project - then it appears in the Bible editor, is used in prompts, and is audited - or it does not exist for that project at all.

### Annex 1 - Monetization and Sponsor Annex (any niche, when the project monetises)

- Sponsor segment format and placement rules (example: after the first payoff, never inside the hook)
- Disclosure text templates: sponsored, advertisement, affiliate - exact wording to be spoken / shown
- Product and affiliate mention rules: how a product may be described, which claims are allowed for a sponsor product
- Advertiser-friendly content boundaries for this channel
- Mid-content break points and CTA hierarchy: sponsor CTA vs channel CTA, which comes first

Used by: Script Drafting (sponsor segments are generated in this format) and Compliance Audit (disclosure present and correct).

### Annex 2 - Accessibility Annex (any niche)

- On-screen text readability: minimum display time by word count, plain-language rule for on-screen text
- Caption rules: maximum characters per caption line, reading-speed rule, caption language
- Contrast guidance: on-screen text must remain readable over the visual (text style / background rule as text guidance)
- Key information rule: essential facts, names, and numbers must be in the narration, never only in small on-screen text

Used by: Scene Breakdown (on-screen text and captions planning) and Visual / Accessibility audit checks.

### Annex 3 - Character Annex (PERSON-BASED niches only)

For life documentary, biography, kings and historical figures, and any person-led story niche - where the video is about people.

- <b>Character Registry:</b> Main Character(s) and Supporting Characters, each with: name, role (main / supporting), era, identity, personality traits, motivations, relationships, and a <b>locked appearance description</b>.
- The locked appearance description is added to <b>every AI image prompt</b> for that character - so the same king / person looks consistent in every scene and every video. This is critical for faceless production.
- <b>Canonical Life Timeline:</b> the approved sequence of life events for main characters - scripts and research must match it.
- <b>Relationship / Family Map:</b> who is related to whom, allies / rivals - used for continuity.
- <b>Portrayal Rules:</b> how the character may / may not be portrayed, sensitive aspects of their life.
- <b>Dialogue Policy:</b> invented dialogue is dramatization. It must be labelled as dramatized and must <b>never</b> be presented as a verified historical quote (Workflow Control Rule 9 - never invent quotations).

Used by: Research, Outline, Script Drafting, Scene Breakdown (character image prompts), Continuity Audit and Fact Audit.

### Separate Annexes for Non-Person Niches (the key point)

Ayurveda, Geography, and other subject niches do <b>not</b> use the Character Annex. They get their <b>own subject annex</b>, for example:

<b>Ayurveda / Wellness - Subject Knowledge and Safety Annex</b>

- Ingredient / Herb Registry: name, other names (local / classical / English), claimed properties vs verified notes, safety warnings
- Remedy format standards: how a remedy / practice is presented in a script
- Health-claim boundaries: no cure / treatment claims, claims must be framed as traditional use unless verified
- Mandatory medical disclaimer text for this niche
- Concept definitions (example: dosha and other core concepts, locked wording)

<b>Geography - Place and Region Annex</b>

- Place Registry: canonical name, local name, pronunciation, country / region hierarchy
- Map standards: what a map scene must show, labels, scale note
- Units rule (km / miles as per audience), terrain and climate terminology (locked wording)
- Sensitive naming rule: neutral naming for disputed places / borders, no political claim in narration

These two are <b>examples shipped as templates, not a fixed list</b>. In Admin (Annex Library, route /annex-templates) an annex template can be created for <b>any niche, with its own fields</b>, fully dynamic and unlimited - the same pattern as Configuration Questions.

### How an Annex gets Activated

- A Niche Template declares which annex templates are active for that niche / sub-niche (example: History -> Kings sub-niche activates Character Annex; Ayurveda niche activates Subject Knowledge and Safety Annex).
- Monetization and Accessibility can also be toggled per project in the Bible editor.
- Applying a Niche Template turns exactly those annexes ON for the project, as a snapshot on the project's Bible version. Annex data (character entries, herb entries, place entries) is then filled in the Bible editor.
- Bible editor shows <b>active annexes only</b> - a Geography project never sees a Character form, and a king documentary never sees a herb registry.

### Implementation (updated in the local spec files)

- API Spec Section 5: Bible annexes model (annexes array on a Bible version: template id + version + data), the 4 built-in / example annex templates with contents and consumers; Section 6A: annex template CRUD endpoints and project Bible annex endpoints; new data: AnnexTemplate, BibleAnnex
- Admin Spec Section 8: Annex Library (/annex-templates), Niche Template declares active annexes
- Website Spec Section 4: Bible editor shows active annexes only, with registry-style editors (characters / herbs / places)
- Shared Spec: BibleAnnex, AnnexTemplate, CharacterEntry types - annex keys are data, not a fixed enum

- [x] Spec files updated locally
- [x] Recorded in Notion (this section)
- [ ] Push to GitHub (pending, with the rest of the specs)

---

## 50. Bible Master Lists - 7 Living Lists

Added 2026-10-27. Production Bible now has <b>three layers</b>: (1) the 14 core sections (Section 48), (2) niche-dependent Annexes (Section 49), and (3) these <b>Master Lists</b> - living registries that live with the Bible and <b>grow video after video</b>.

Important difference: Bible sections are locked inside a Bible version. Master Lists are <b>not</b> locked in a version - they are project-level registries with per-entry history, because a channel's lists must keep growing. When a Workflow Run uses list entries, the Run <b>snapshots the entries it used</b>, so every finished video remains reproducible.

### List 1 - Master Source List

Approved sources and blocked sources for this niche: specific books, archives, websites, journals, channels, documents. Research and Evidence Standards (Bible Section 13) set the rules for judging sources - this list is the concrete result. Each entry: name, type, reference / link, tier (approved / blocked), scope (which sub-niche / topic type), note. Used by: Research (Step 7).

### List 2 - Do-Not-Repeat List (Already Covered)

Everything this channel has already covered: topics, stories, angles, hooks, opening lines, examples. Entry: kind, text, which video used it, date.

- <b>Auto-filled:</b> when a Production Package is completed (Step 14), the system automatically adds that video's topic, hook, opening line, and key stories / examples here.
- Users can also add entries manually (example: a story a competitor channel just published).
- Used by: Topic Selection dedupe (Step 5) and Originality Audit (Step 12). This is what stops a long-running faceless channel from repeating itself.

### List 3 - Master Timeline / Chronology List

The canonical timeline of the niche / era: events with date or date range, era, related characters, related places, source reference, certainty level. Different from a Character's life timeline (one person's life) - this is the whole world's timeline, and every video in the niche must agree with it. Used by: Research and Fact Audit.

### List 4 - Master Location / Setting List

Recurring places - a palace, a battlefield, a temple, a region - each with a <b>locked visual description</b> (and image-prompt suffix), exactly like a character's locked appearance in the Character Annex. The same place must look and be described the same way in every scene and every video. Used by: Scene Breakdown (Step 11) image prompts.

### List 5 - Hook and Opening Library

Concrete approved hooks and opening lines the writer can pick from - not just formulas. Entry: hook type, exact text / example, which structure or sub-niche it suits, performance note (from the Performance Learnings Log), status (approved / testing / archived). The Structure section of the Bible holds abstract formulas; this library holds the real, proven lines. Used by: Narrative Structure and Outline (Step 9).

### List 6 - Phrase Bank

Exact approved wordings that keep the channel's voice consistent at sentence level: transition lines, recurring segment intro lines, catchphrases, CTA lines per platform, closing lines, disclaimer wordings. Entry: category, exact text, platform (for CTAs), usage note. Used by: Script Drafting (Step 10).

### List 7 - Approved Asset Source List

Named sources for music, sound effects, stock footage, and stock images - each with license note and tier (approved / blocked). The Music and Sound section of the Bible defines the sound style; this list names <b>where assets may come from</b>. Used by: Visual and Asset Research (Step 16) license checks, and the Production Package asset list.

### Rules for all 7 lists

- Entries are <b>unlimited</b> (fully dynamic decision, Section 46). List types are the fixed 7 above; entry fields are defined per list.
- A Niche Template may <b>seed starter entries</b> (example: an approved source list or phrase bank for a niche) - applying the template copies them into the project, after which the project's lists are its own.
- An entry already used by a finished Run is archived, never hard-deleted, so old videos stay explainable.
- User manages lists in the Website app: Project Bible screen, <b>Master Lists tab</b> - search, add, edit, archive for all 7 lists. A Run's Overview shows which entries that Run used.

### Implementation (updated in the local spec files)

- API Spec Section 5: Master Lists model - 7 list keys, entry shapes per list, the Do-Not-Repeat auto-population rule on package completion, CRUD + search endpoints (/projects/:id/master-lists/:listKey) and the run snapshot endpoint; new data: BibleMasterListEntry
- Website Spec Section 4: Master Lists tab in the Bible screen, run snapshot display
- Admin Spec Section 8: Niche Templates may seed Master List starter entries; no entry caps
- Shared Spec: BibleMasterListKey and the 7 entry types

- [x] Spec files updated locally
- [x] Recorded in Notion (this section)
- [ ] Push to GitHub (pending, with the rest of the specs)

---

## 51. Full Niche List - Seed Taxonomy for the Platform

Added 2026-10-27. <b>Why this comes first:</b> every niche needs its own Production Bible registry (Character Registry for person niches, Herb Registry for Ayurveda, Place Registry for Geography, and the proper registry for every other niche). So the full niche list is fixed first - the Registry Map is built from this list next.

This is the platform's <b>seed (starting) list</b> in Admin Taxonomy - <b>21 categories, 120 niches</b>, sub-niche examples shown per niche. It is NOT a limit: the system is fully dynamic (Section 46), Admin can add unlimited categories, niches, and sub-niches beyond this list.

<b>Entity Focus tag</b> (shown per category) = the main kind of thing that niche's videos are about. This tag decides the registry in the next step: PERSON = people, PLACE = locations, SUBJECT = knowledge topics, EVENT = incidents, CREATURE = animals, STORY = fictional worlds and tales, ORGANISATION = companies and institutions, PRODUCT = things and machines, CONCEPT = ideas and beliefs, WORK = films, books, matches, songs as works.

## 1. History & Heritage — focus: PERSON / EVENT / PLACE

- <b>Kings & Empires</b> — sub: Indian kings, Mughal, Maratha, Roman emperors, Ottoman, British monarchy, Rise & fall of empires
- <b>Ancient Civilizations</b> — sub: Egypt, Rome, Greece, Indus Valley, Mesopotamia, Maya, Aztec, China
- <b>Wars & Battles</b> — sub: World wars, Famous battles, War strategies, Ancient wars, Indian wars
- <b>Historical Biographies</b> — sub: Kings, Warriors, Explorers, Leaders, Inventors in history
- <b>Historical Mysteries & Events</b> — sub: Lost cities/treasures, Unexplained historical events, Turning points, Disasters in history
- <b>Mythology</b> — sub: Hindu, Greek, Norse, Egyptian, Roman, Japanese, Mesopotamian
- <b>Medieval & Royal Life</b> — sub: Castle life, Royal lifestyle, Knights, Medieval India
- <b>Freedom & Modern History</b> — sub: Indian freedom movement, Independence stories, Modern world events, Revolutions

## 2. Geography & World Places — focus: PLACE

- <b>Countries & Capitals</b> — sub: Country facts, Capitals, Flags & symbols, Country comparisons
- <b>Physical Geography</b> — sub: Rivers, Mountains, Deserts, Oceans & seas, Volcanoes
- <b>Cities & Landmarks</b> — sub: Famous cities, World landmarks, Indian cities & monuments
- <b>Islands & Extreme Places</b> — sub: Remote islands, Coldest/hottest/deepest places, Forbidden places
- <b>Borders, Maps & Geopolitics (sensitive naming)</b> — sub: Border stories, Map changes, Disputed regions (neutral rule)
- <b>Natural Wonders</b> — sub: Waterfalls, Caves, Forests, Natural formations

## 3. Science & Space — focus: SUBJECT / CONCEPT

- <b>Space & Astronomy</b> — sub: Planets, Black holes, Missions (ISRO/NASA), Universe facts, Astronaut stories
- <b>Physics & How Things Work</b> — sub: Everyday physics, Famous experiments, Laws explained
- <b>Biology & Evolution</b> — sub: Evolution stories, Human evolution, Species origins
- <b>Earth, Climate & Weather</b> — sub: Earth systems, Climate change explained, Extreme weather
- <b>Dinosaurs & Prehistoric Life</b> — sub: Dinosaur species, Extinctions, Fossils
- <b>Inventions & Discoveries</b> — sub: Great inventions, Accidental discoveries, Indian scientists
- <b>Human Body Science</b> — sub: Organs explained, Brain & senses, Body facts (science, not medical advice)

## 4. Health, Wellness & Ayurveda — focus: SUBJECT (safety-critical)

- <b>Ayurveda & Traditional Medicine</b> — sub: Dosha concepts, Ayurvedic principles, Classical remedies (traditional use framing)
- <b>Herbal & Home Remedies</b> — sub: Herb profiles, Home remedy guides, Ingredient knowledge
- <b>Yoga & Exercise</b> — sub: Yoga guides, Home workouts, Mobility & posture
- <b>Nutrition & Diet</b> — sub: Food nutrition facts, Diet concepts, Superfoods examined
- <b>Meditation & Mindfulness</b> — sub: Guided concepts, Breathing, Mindfulness practices
- <b>Sleep & Healthy Lifestyle</b> — sub: Sleep science, Daily routines, Habits for health
- <b>Medical Conditions Explained (information only)</b> — sub: Condition explainers, Symptoms awareness, Prevention awareness — never diagnosis/treatment content

## 5. Finance, Business & Economics — focus: SUBJECT / ORGANISATION / PERSON

- <b>Personal Finance</b> — sub: Saving, Budgeting, Loans & credit, Tax basics (India)
- <b>Investing & Markets</b> — sub: Stock market basics, Mutual funds, Crypto explained, Market events
- <b>Business Stories & Case Studies</b> — sub: Startup stories, Business failures, Turnarounds, Indian businesses
- <b>Company & Brand Histories</b> — sub: Global brands, Indian companies, Brand wars
- <b>Economics Explained</b> — sub: Inflation, GDP & markets, Economic events, Money systems
- <b>Scams & Financial Fraud Awareness</b> — sub: Famous scams, Fraud prevention, Ponzi & cyber fraud
- <b>Real Estate & Wealth</b> — sub: Property basics, Wealth stories, Rich lifestyles (see also §21)

## 6. Technology & AI — focus: SUBJECT / PRODUCT / ORGANISATION

- <b>AI Explained & AI News</b> — sub: AI concepts, AI tools, AI events
- <b>Gadgets & Devices</b> — sub: Phones, Computers, Gadget history, Device explainers
- <b>Software & Internet How-To</b> — sub: App tutorials, Internet history, Digital skills
- <b>Cybersecurity & Privacy</b> — sub: Hacking stories, Safety guides, Privacy concepts
- <b>Future Technology</b> — sub: Robotics, Space tech, Future concepts
- <b>Tech Company Stories</b> — sub: Founders, Product launches, Tech rivalries

## 7. Crime, Mystery & Dark — focus: EVENT / PERSON

- <b>True Crime Cases</b> — sub: Solved cases, Case explainers, Indian cases, International cases
- <b>Unsolved Mysteries</b> — sub: Disappearances, Unexplained cases, Cold cases
- <b>Heists, Scams & Fraud Stories</b> — sub: Bank heists, Art theft, Big cons
- <b>Paranormal & Unexplained</b> — sub: Ghost stories (entertainment framing), UFO events, Strange phenomena
- <b>Conspiracies Examined</b> — sub: Famous theories fact-checked, Debunked claims

## 8. Stories & Fiction — focus: STORY / PERSON (fictional characters)

- <b>Moral & Life Stories</b> — sub: Short moral stories, Life lessons, Village/family stories
- <b>Horror Stories</b> — sub: Horror narration, Urban legends, Creepypasta
- <b>Folk Tales & Fairy Tales</b> — sub: Indian folk tales, World fairy tales, Panchatantra/Akbar-Birbal style tales
- <b>Bedtime Stories</b> — sub: Kids bedtime, Calm narration stories
- <b>Inspirational True Stories</b> — sub: Rags-to-riches, Survival stories, Comeback stories
- <b>Fictional Worlds & Lore</b> — sub: SCP, Fictional universes, Game/movie lore backstories

## 9. Religion, Philosophy & Spirituality — focus: CONCEPT / PERSON / PLACE

- <b>World Religions Explained</b> — sub: Hinduism, Islam, Christianity, Buddhism, Jainism, Sikhism concepts
- <b>Saints, Gurus & Spiritual Biographies</b> — sub: Saints, Monks, Spiritual leaders
- <b>Sacred Texts & Epic Stories</b> — sub: Ramayana, Mahabharata, Bible stories, Other epics
- <b>Philosophy & Big Questions</b> — sub: Philosophy concepts, Ethics, Life questions, Stoicism
- <b>Sacred Places & Pilgrimages</b> — sub: Temples, Holy cities, Pilgrimage routes
- <b>Astrology, Numerology & Vastu (belief content, labelled as belief)</b> — sub: Astrology concepts, Numerology, Vastu/Feng Shui

## 10. Education & Learning — focus: SUBJECT

- <b>General Knowledge & Facts</b> — sub: India GK, World GK, Science GK
- <b>School Subjects Help</b> — sub: Maths, Science, History, Geography for students
- <b>Competitive Exam Prep</b> — sub: UPSC, SSC, Banking, State exams, Railways
- <b>Language & Vocabulary Learning</b> — sub: English learning, Word meanings, Grammar
- <b>Study Skills & Memory</b> — sub: Study techniques, Exam strategies, Memory methods
- <b>Current Affairs for Students</b> — sub: Monthly current affairs, Exam-focused explainers

## 11. Psychology & Human Behaviour — focus: CONCEPT

- <b>Psychology Facts & Concepts</b> — sub: Famous concepts, Experiments, Biases
- <b>Human Behaviour & Body Language</b> — sub: Behaviour patterns, Body language reading, Social behaviour
- <b>Mind, Brain & Habits</b> — sub: Brain facts, Habit science, Dreams explained
- <b>Relationships & Social Skills</b> — sub: Communication, Social dynamics (general, non-advice framing where needed)
- <b>Personality Types</b> — sub: Personality concepts, Traits explained

## 12. Animals & Nature — focus: CREATURE / PLACE

- <b>Wildlife & Animal Facts</b> — sub: Big cats, Elephants, Dangerous animals, Animal records
- <b>Pets & Animal Care</b> — sub: Dogs, Cats, Pet care guides, Pet behaviour
- <b>Birds, Insects & Marine Life</b> — sub: Birds, Insects & spiders, Ocean creatures
- <b>Animal Stories & Rescues</b> — sub: Rescue stories, Animal friendships, Loyal animals
- <b>Nature & Environment</b> — sub: Forests, Environment issues, Nature wonders

## 13. Sports — focus: PERSON / EVENT / WORK (matches)

- <b>Cricket</b> — sub: Match stories, Records, Player stories, World Cups, IPL
- <b>Football</b> — sub: Match stories, Player stories, World Cups, Clubs
- <b>Athlete Biographies</b> — sub: Indian athletes, Global legends, Comeback stories
- <b>Historic Matches & Tournaments</b> — sub: Greatest matches, Finals, Rivalries
- <b>Olympics & Multi-Sport</b> — sub: Olympic stories, Records, Indian Olympic history
- <b>Chess, Esports & Other Games</b> — sub: Chess stories, Esports events, Indoor games

## 14. Entertainment & Pop Culture — focus: PERSON / WORK

- <b>Movie & Series Explainers</b> — sub: Movie recaps, Ending explained, Series lore
- <b>Celebrity Biographies</b> — sub: Actors, Directors, Indian cinema figures
- <b>Music History & Artists</b> — sub: Artist stories, Song histories, Indian music legends
- <b>Anime & Animation Lore</b> — sub: Anime stories, Character lore, Series explainers
- <b>Gaming Lore & Esports</b> — sub: Game backstories, Gaming history, Esports stories
- <b>Books & Famous Stories</b> — sub: Book summaries, Author stories, Classic stories

## 15. Food & Recipes — focus: SUBJECT / PLACE

- <b>Recipes (faceless formats)</b> — sub: Indian recipes, Quick recipes, Regional recipes, Baking
- <b>Food History & Origins</b> — sub: Dish origins, Food journeys, Spice history
- <b>Regional Cuisines & Street Food Stories</b> — sub: Indian regional food, World street food
- <b>Kitchen Tips & Food Science</b> — sub: Cooking science, Kitchen hacks, Ingredient facts

## 16. Travel, Culture & Exploration — focus: PLACE

- <b>Destination & Place Guides</b> — sub: India destinations, World destinations, Budget travel guides
- <b>Hidden & Unusual Places</b> — sub: Abandoned places, Secret places, Dark tourism
- <b>Festivals & Cultures</b> — sub: Indian festivals, World festivals, Tribes & traditions
- <b>Expeditions & Adventure Stories</b> — sub: Mountaineering, Ocean voyages, Survival expeditions
- <b>Heritage & Pilgrimage Routes</b> — sub: Heritage walks, Temple routes, Historic trails

## 17. Politics, Law & Society — focus: EVENT / CONCEPT / ORGANISATION

- <b>Geopolitics Explained</b> — sub: Country relations, Conflicts explained (neutral), World organisations
- <b>Politics & Elections Explained</b> — sub: Election systems, Indian politics explainers, Political history
- <b>Law, Rights & Constitution Basics</b> — sub: Citizen rights, Famous cases, Constitution concepts
- <b>Government Schemes & Public Policy</b> — sub: Indian schemes explained, Policy explainers
- <b>Social Issues & Awareness</b> — sub: Health awareness, Safety awareness, Social topics

## 18. Motivation, Career & Self-Growth — focus: PERSON / CONCEPT

- <b>Entrepreneur & Success Biographies</b> — sub: Indian entrepreneurs, Global founders, Struggle stories
- <b>Productivity & Habit Systems</b> — sub: Productivity methods, Morning routines, Focus systems
- <b>Career & Interview Guidance</b> — sub: Career paths, Interview prep, Govt job guidance
- <b>Communication & Life Skills</b> — sub: Speaking skills, Confidence, Life skills
- <b>Money Mindset & Personal Growth</b> — sub: Mindset concepts, Book-based lessons

## 19. Kids & Family — focus: STORY / SUBJECT

- <b>Kids Moral Stories</b> — sub: Value stories, Animal fables, Short story series
- <b>Kids Learning</b> — sub: Animals for kids, Science for kids, GK for kids
- <b>Rhymes & Early Learning</b> — sub: Rhymes, Numbers & letters, Good habits
- <b>Family & Values Stories</b> — sub: Family stories, Festival stories for kids

## 20. Facts, Lists & Curiosity — focus: MIXED (depends on topic)

- <b>Top-10 & Countdown Lists</b> — sub: Rankings across niches, Records lists
- <b>Did-You-Know Facts</b> — sub: Fact series by theme
- <b>Comparisons & Versus</b> — sub: Country vs country, Animal vs animal, Then vs now
- <b>What-If Scenarios</b> — sub: History what-ifs, Science what-ifs, Geography what-ifs
- <b>Records & Extremes</b> — sub: World records, Biggest/smallest/fastest
- <b>Riddles, Quizzes & Brain Teasers</b> — sub: Quiz videos, Puzzles, Riddle series

## 21. Automotive, Luxury & Machines — focus: PRODUCT / ORGANISATION

- <b>Cars & Supercars</b> — sub: Supercar stories, Car histories, EV stories
- <b>Bikes & Motorcycles</b> — sub: Bike stories, Classic bikes
- <b>Trains, Planes & Ships</b> — sub: Aviation stories, Famous trains, Ships & disasters at sea
- <b>Military Machines & Defence Tech</b> — sub: Fighter jets, Warships, Defence systems explained
- <b>Luxury & Expensive Things</b> — sub: Mansions, Yachts, Most expensive things, Luxury brands

---

### Totals and Next Step

- <b>21 categories, 120 niches</b> in seed v1, each niche with sub-niche examples (unlimited sub-niches in Admin)
- Full list also saved locally: docs/NICHE\_[LIST.md](http://LIST.md) in the spec set, referenced from Admin Spec Section 8 as seed taxonomy
- <b>Next step:</b> Registry Map - for every niche in this list, define its proper Bible registry from its Entity Focus (PERSON -> Character Registry, PLACE -> Place Registry, SUBJECT with safety -> Knowledge/Ingredient Registry, CREATURE -> Creature Registry, EVENT -> Case/Event Registry, STORY -> Story-World Registry, ORGANISATION -> Organisation Registry, PRODUCT -> Product Registry, WORK -> Work Registry, CONCEPT -> Concept Registry)
- After the Registry Map, the user's own Production Bible list will be merged

- [x] Niche list created locally and in Admin Spec
- [x] Recorded in Notion (this section)
- [ ] Push to GitHub (pending - user decision: Notion + local for now)

---

## 52. Merged Niche List v2 - User's 550 + Platform List (Final Seed Taxonomy)

Added 2026-10-27. This section <b>supersedes the Section 51 list</b> as the seed taxonomy. It merges the user's own 550-niche list (Niche\_Names\_Only.txt) with the Section 51 categories.

<b>Rules applied in the merge:</b>

- <b>Every legacy ID (001-550) is preserved</b> and placed exactly once - as a niche, or demoted to sub-niche where the entry was actually a topic (example: Mantra, Credit Cards, Ramayana are sub-niches/topics, not niches). Machine-verified: all 550 IDs present, none missing.
- <b>9 semantic duplicates merged</b> (Merge Log at the end): Human Behavior into Psychology, Yoga into Yoga and Wellness, Internet into Internet and Web, DIY into DIY and Making, Home Gardening into Gardening, Traditional Skills into Handicrafts, Future Civilization into Future Civilization and AI Society, Documentary Making into Documentary Storytelling, Maritime into Shipbuilding.
- <b>5 niches added \[NEW\]</b> where the 550 had gaps: Medical Conditions Explained, Astrology/Numerology/Vastu, Competitive Exam Prep, Bedtime Stories, Kids Learning.
- Structure: <b>25 categories</b>, each tagged with Entity Focus - this drives the Registry Map (next step).
- Still seed data only, fully dynamic in Admin - not a limit.

Format: <b>Niche \[legacy ID\]</b> - subs: Name \[ID\], Name \[ID\]. Bracketed (examples) are unnumbered additions from the platform list.

## 1. History & Heritage — focus: PERSON / EVENT / PLACE

- <b>History / Mystery Documentary \[002\]</b>
- <b>Ancient India / Civilization \[003\]</b> — subs: Indus Valley, Vedic age, Maurya/Gupta worlds
- <b>Ancient Civilizations of the World \[544\]</b> — subs: Ancient Egypt \[544\], Mesopotamian Civilizations \[545\], Nomadic Civilizations \[150\], (Maya, Aztec, Rome, Greece)
- <b>Kings, Royalty & Dynasties \[036\]</b> — subs: (Indian kings, Mughal, Maratha, Roman emperors, Ottoman, British monarchy)
- <b>Military History \[035\]</b> — subs: (Famous battles, World wars, War strategy)
- <b>Ancient Technology / Lost Knowledge \[013\]</b>
- <b>Castles, Forts & Palaces \[037\]</b> (PLACE registry)
- <b>Archaeology \[039\]</b>
- <b>Ancient Manuscripts & Books \[040\]</b>
- <b>Pirates & Outlaws \[049\]</b>
- <b>Famous People & Biography Storytelling \[146\]</b> — subs: Biography Storytelling \[147\], (Explorers, Warriors, Leaders)
- <b>Living History & Reenactment \[143\]</b>
- <b>Peoples & Social Histories \[526\]</b> — subs: Indigenous Histories \[526\], Oral History \[527\], Family History \[173\], Childhood History \[175\], Women's History \[177\], Men's History \[178\], Disability History \[179\]

## 2. Geography, Places & Maps — focus: PLACE

- <b>World Geography \[218\]</b> — subs: Geography Learning \[446\], Flags \[447\], Capitals \[448\], (Country facts & comparisons)
- <b>Indian Geography & Places \[219\]</b> — subs: Indian Cities \[220\], Indian Villages \[221\]
- <b>Maps & Geography Mysteries \[038\]</b>
- <b>Cities & Urbanism \[111\]</b>
- <b>Mountains & Polar Worlds \[116\]</b> — subs: Ice & Polar Worlds \[153\], Glaciers \[213\], Snow & Ice \[214\]
- <b>Rivers, Coasts & Waterfalls \[210\]</b> — subs: Waterfalls \[211\], Beaches \[212\]
- <b>Volcanoes, Caves & Extreme Landforms \[152\]</b> — subs: Caves \[241\]
- <b>Islands & Island Nations \[151\]</b>
- <b>Borders, Territories & Microstates \[235\]</b> — subs: Territories \[236\], Microstates \[237\], Unrecognized Countries \[238\], Enclaves & Exclaves \[239\]
- <b>National Parks & Protected Places \[242\]</b>

## 3. Science, Space & Earth — focus: SUBJECT / CONCEPT

- <b>Science & Big Questions \[006\]</b> — subs: Unsolved Science \[367\]
- <b>Space & Universe \[012\]</b> — subs: Astronomy \[344\], Planetary Science \[345\], Moon Science \[346\], Solar Science \[347\]
- <b>Space Exploration & Missions \[032\]</b>
- <b>Satellites & Earth Observation \[159\]</b>
- <b>Physics \[343\]</b> — subs: Thermodynamics \[360\], Magnetism \[358\], Time & Reality \[055\]
- <b>Electricity & Electronics \[161\]</b> — subs: Electricity \[359\]
- <b>Earth Science \[348\]</b> — subs: Geology \[356\], Gemology \[357\], Climate Science \[361\], Oceanography \[362\]
- <b>Weather & Atmosphere \[215\]</b> — subs: Extreme Weather \[215\], Lightning \[216\], Clouds & Atmosphere \[217\]
- <b>Earth & Natural Mysteries \[030\]</b>
- <b>Biology & Life Science \[350\]</b> — subs: Evolution \[354\], Paleontology \[355\]
- <b>Genetics & Evolution \[027\]</b>
- <b>Dinosaurs & Prehistoric World \[029\]</b>
- <b>Chemistry & Materials \[156\]</b> — subs: Chemistry in Everyday Life \[156\], Chemistry \[349\], Materials Science \[157\], Materials Engineering \[442\]
- <b>Microbiology & Biotechnology \[154\]</b> — subs: Biotechnology \[155\], Digital Biology \[336\]
- <b>Scientists, Inventors & Discoverers \[089\]</b> — subs: Inventions & Inventors \[089\], Scientists & Discoverers \[118\]
- <b>Mathematics & Numbers \[119\]</b> — subs: Geometry \[364\], Number Theory \[365\], Infinity \[366\], Statistics & Data \[121\]
- <b>Ocean & Deep Sea (science) \[028\]</b>

## 4. Health, Wellness & Ayurveda — focus: SUBJECT (safety-critical)

- <b>Health & Wellness Education \[015\]</b>
- <b>Ayurveda \[281\]</b> — subs: (Dosha concepts, Classical remedies — traditional-use framing)
- <b>Yoga & Wellness \[077\]</b> — subs: Yoga \[280\] (merged), Pranayama \[279\]
- <b>Medical & Human Body Science \[026\]</b> — subs: Human Anatomy \[352\], Disease Science \[353\]
- <b>Medical Conditions Explained — information only \[NEW\]</b> — subs: (Condition explainers, Symptoms awareness — never diagnosis/treatment)
- <b>Nutrition & Food Science \[505\]</b> — subs: Nutrition Science \[505\]
- <b>Sleep & Exercise Science \[538\]</b> — subs: Sleep Science \[538\], Exercise Science \[539\]
- <b>Public Health & Healthy Communities \[501\]</b> — subs: Rehabilitation \[502\], Assistive Technology \[503\], Maternal & Child Health \[504\]

## 5. Finance, Business & Economics — focus: SUBJECT / ORGANISATION / PERSON

- <b>Personal Finance \[008\]</b> — subs: (Saving, Budgeting, Loans, Tax basics India)
- <b>Banking & Money Systems \[293\]</b> — subs: Credit Cards \[294\], Money History \[295\], Central Banking \[298\], Currency \[312\], Tax History \[314\]
- <b>Markets & Investing \[300\]</b> — subs: Stock Market History \[300\], (Mutual funds, Market events)
- <b>Crypto & Digital Money \[296\]</b> — subs: Blockchain \[297\]
- <b>Economic Crises & Economics Explained \[299\]</b> — subs: Global Economy \[311\], Wealth History \[315\]
- <b>Corporate Empires & Company Stories \[301\]</b> — subs: Entrepreneurship \[302\], Startups \[303\], Unicorn Companies \[304\]
- <b>Brands & Products \[305\]</b> — subs: Products \[306\]
- <b>Marketing & Advertising \[106\]</b> — subs: Consumer Psychology \[105\], Advertising \[307\]
- <b>Retail, E-Commerce & Trade \[107\]</b> — subs: E-Commerce \[308\], Retail \[309\], Global Trade \[310\], Logistics & Supply Chain \[108\]
- <b>Leadership, Management & Workplace \[103\]</b> — subs: Corporate & Workplace \[104\]
- <b>Real Estate & Property \[112\]</b> — subs: Real Estate Economics \[313\], Housing & Tenancy \[506\]
- <b>Insurance, Retirement & Protection \[499\]</b> — subs: Insurance Education \[499\], Retirement Education \[500\]

## 6. Technology, AI & Digital Life — focus: SUBJECT / PRODUCT / ORGANISATION

- <b>AI + Technology Explainers \[001\]</b>
- <b>AI Tools / AI Tutorials \[007\]</b>
- <b>AI Systems & Research \[337\]</b> — subs: AI Research \[337\], Developer AI \[338\], AI Software Agents \[531\], Large Language Model Systems \[532\], No-Code & Low-Code Development \[533\]
- <b>AI Creativity & Media \[019\]</b> — subs: AI Cinematic Short Films \[019\], Generative Art \[339\], AI Music \[340\], AI Voice \[341\], AI Filmmaking \[342\]
- <b>Internet & Web \[129\]</b> — subs: Internet History \[129\], Internet \[318\] (merged)
- <b>Internet & Connectivity Tech \[319\]</b> — subs: Mobile Technology \[319\], 5G / 6G \[320\], Satellite Internet \[321\]
- <b>Computing Infrastructure & Software Systems \[322\]</b> — subs: Cloud Computing \[322\], Databases \[323\], Data Centers & Infrastructure \[160\], Semiconductors \[511\], Quantum Computing \[512\], Open-Source Software \[514\]
- <b>Software & Programming \[061\]</b> — subs: Programming \[324\], Software Engineering \[325\], Computer & PC \[062\]
- <b>Consumer Technology \[063\]</b>
- <b>Cybersecurity, Privacy & Digital Safety \[326\]</b> — subs: Privacy \[327\], Digital Forensics \[328\], Malware \[329\]
- <b>Robotics & Drones \[330\]</b> — subs: Humanoid Robots \[331\], Drones \[332\]
- <b>Neurotech & Human-Computer Interaction \[333\]</b> — subs: Brain-Computer Interfaces \[333\], Human-Computer Interaction \[513\]
- <b>Immersive & Virtual Worlds \[128\]</b> — subs: Virtual Reality / AR \[128\], Virtual Worlds \[334\], Digital Humans \[335\]
- <b>Digital Business & Creator Economy \[534\]</b> — subs: SaaS Businesses \[534\], Creator Economy \[535\], Search Engine Optimization \[536\]

## 7. Crime, Mystery & Investigations — focus: EVENT / PERSON

- <b>True Crime Documentary \[010\]</b>
- <b>Forensics & Investigation \[100\]</b>
- <b>Intelligence & Espionage \[099\]</b>
- <b>Secret Societies \[057\]</b>
- <b>UFO / Extraterrestrial (events & cases) \[033\]</b>
- <b>Internet Mysteries \[130\]</b>
- <b>Scams & Fraud Stories \[496\]</b> — cross-ref: awareness placement also in §21 Safety \[496\] (primary here: story/case form)

## 8. Stories, Fiction & Fantasy Worlds — focus: STORY

- <b>Horror / Mystery Stories \[011\]</b> — subs: Horror Fiction \[375\]
- <b>Mystery & Thriller Fiction \[376\]</b>
- <b>Romance Stories \[377\]</b>
- <b>Comedy Stories \[378\]</b>
- <b>Fantasy Worlds & Worldbuilding \[373\]</b> — subs: Science Fiction \[374\], Worldbuilding \[381\], Fictional Geography \[382\]
- <b>Folklore & Legends \[058\]</b>
- <b>Mythical Creatures \[059\]</b>
- <b>Symbols & Hidden Meanings \[060\]</b>
- <b>Inspirational & Human Stories \[016\]</b> — subs: Motivational Stories \[016\], Humanitarian Stories \[148\]
- <b>Bedtime Stories \[NEW\]</b>

## 9. Religion, Philosophy & Spirituality — focus: CONCEPT / PERSON / PLACE

- <b>Sanatan / Hindu Mythology \[004\]</b>
- <b>Hindu Philosophy & Sacred Texts \[268\]</b> — subs: Vedas \[269\], Upanishads \[270\], Bhagavad Gita \[271\], Puranas \[272\], Shaivism \[273\], Vaishnavism \[274\], Shaktism \[275\], Temple Traditions \[276\], Mantra \[277\], Ramayana \[540\], Mahabharata \[541\], Hindu Festivals & Vrat \[542\], Bhakti Literature & Devotional Poetry \[543\]
- <b>Mythological Animation \[018\]</b>
- <b>World Religions & Civilizations \[076\]</b> — subs: Buddhist Philosophy \[282\], Judaism History \[283\], Christianity History \[284\], Islamic History \[285\], Sikh History \[286\], Jainism \[287\], Zoroastrianism \[288\], Ancient Religions \[289\], Mythology Comparison \[290\], Cosmology & Creation \[291\]
- <b>Spirituality & Meditation \[023\]</b> — subs: Meditation \[278\], Consciousness & Spirituality \[292\]
- <b>Consciousness & Philosophy \[054\]</b> — subs: (Stoicism, Ethics, Big questions)
- <b>Pilgrimage & Sacred Places \[075\]</b> — subs: Pilgrimage Travel \[223\], Sacred Geography \[240\]
- <b>Astrology, Numerology & Vastu — belief content, labelled \[NEW\]</b>

## 10. Education & Learning — focus: SUBJECT

- <b>Education \[069\]</b>
- <b>General Knowledge & Exams Foundation \[443\]</b> — cross-ref §25 for quiz/trivia formats
- <b>Competitive Exam Prep \[NEW\]</b> — subs: (UPSC, SSC, Banking, Railways, State exams)
- <b>Languages & Linguistics \[041\]</b> — subs: Language Learning \[449\], Sanskrit Learning \[450\], Translation \[529\]
- <b>Thinking & Media Skills \[120\]</b> — subs: Logic & Critical Thinking \[120\], Media Literacy \[530\]
- <b>Study Skills & Learning Methods \[453\]</b>
- <b>Education Systems & Student Life \[144\]</b> — subs: History of Education \[144\], School & University Stories \[145\], Student Life \[454\]
- <b>Libraries, Archives & Knowledge Systems \[528\]</b>

## 11. Careers, Jobs & Professional Skills — focus: SUBJECT / CONCEPT

- <b>Career & Jobs \[070\]</b> — subs: Career Guidance \[455\], Freelancing \[456\], Remote Work \[457\], Digital Nomad \[458\], Future Jobs \[459\], AI Careers \[460\], Data Careers \[462\], Coding Education \[463\], Cloud Careers \[464\], Cybersecurity Careers \[465\], Science Careers \[466\], Creative Careers \[467\]
- <b>Communication & Professional Skills \[102\]</b> — subs: Professional Skills \[461\]
- <b>Productivity & Self-Improvement \[071\]</b> — subs: (Habit systems, Focus methods)

## 12. Psychology, Mind & Relationships — focus: CONCEPT

- <b>Psychology / Human Behavior \[009\]</b> — subs: Human Behavior \[171\] (merged)
- <b>Brain, Mind & Cognitive Science \[351\]</b> — subs: Neuroscience \[351\], Cognitive Science \[363\], Memory & Learning \[101\]
- <b>Relationships \[072\]</b> — subs: Human Relationships \[170\]
- <b>Mental Health Education \[537\]</b>
- <b>Life Stages & Generations \[174\]</b> — subs: Aging & Generations \[174\]

## 13. Animals, Nature & Environment — focus: CREATURE / PLACE

- <b>Wildlife & Animals \[066\]</b>
- <b>Nature Documentary \[067\]</b>
- <b>Pets \[068\]</b>
- <b>Marine Life & Ocean Creatures \[198\]</b> — subs: Marine Mammals \[197\], Coral Reefs \[199\]
- <b>Birds \[196\]</b>
- <b>Reptiles & Amphibians \[195\]</b>
- <b>Insects, Arachnids & Small Creatures \[193\]</b> — subs: Arachnids \[194\]
- <b>Plants, Trees & Fungi \[200\]</b> — subs: Botany \[200\], Flowers \[201\], Trees \[202\], Fungi \[203\], Plant Intelligence \[204\]
- <b>Forests, Ecology & Ecosystems \[115\]</b> — subs: Ecosystems \[205\], Deserts \[206\], Rainforests \[207\], Wetlands \[208\], Mangroves \[209\], Biodiversity Conservation \[523\]
- <b>Air Quality & Environment Health \[522\]</b>
- <b>Soil Science & Eco Systems \[521\]</b> — cross-ref §16 for farming systems

## 14. Sports, Games & Play — focus: PERSON / EVENT / WORK

- <b>Sports History \[044\]</b>
- <b>Cricket \[546\]</b>
- <b>Football / Soccer \[547\]</b>
- <b>Racing \[045\]</b>
- <b>Gaming Stories & Lore \[025\]</b> — subs: Game Development \[131\], Retro Gaming \[132\], (Esports stories)
- <b>Board Games, Chess & Tabletop \[133\]</b> — subs: Chess \[134\]
- <b>Martial Arts & Traditional Sports</b> — see §17 \[253\]/\[252\] (primary placement there)

## 15. Film, Entertainment & Media — focus: WORK / PERSON

- <b>Film & Entertainment Analysis \[080\]</b>
- <b>Cinema & Film Craft \[368\]</b> — subs: Acting \[370\], Screenwriting \[371\], Storytelling \[372\], Visual Effects \[127\], Video Editing & Post-Production \[549\]
- <b>Documentary Storytelling & Making \[005\]</b> — subs: Documentary Making \[369\]
- <b>Animation & Cartoon Craft \[379\]</b> — subs: Character Design \[380\]
- <b>Series, Web & Short Formats \[383\]</b> — subs: Short Films \[384\]
- <b>Books & Literature \[078\]</b> — subs: Literature \[451\], Writing \[452\]
- <b>Media History & Journalism \[122\]</b> — subs: Television History \[123\], Radio & Audio \[124\], Podcasting \[125\]
- <b>Music History & Artists \[043\]</b>
- <b>Music Production & Sound Design \[550\]</b>
- <b>Circus, Magic & Live Entertainment \[385\]</b> — subs: Theme Parks \[386\], Roller Coasters \[387\], Escape Rooms \[388\], Magic \[389\], Illusions \[390\], Card Magic \[391\], Stand-Up & Comedy History \[392\]

## 16. Food, Cooking & Farming — focus: SUBJECT / PLACE

- <b>Cooking & Culinary \[091\]</b>
- <b>Food / Cultural Stories \[024\]</b>
- <b>Beverage Culture \[092\]</b>
- <b>Agriculture & Farming Systems \[093\]</b> — subs: Food Systems \[524\], Sustainable Fisheries \[525\]

## 17. Culture, Arts & Traditional Crafts — focus: WORK / SUBJECT / PLACE

- <b>Art & Civilization \[042\]</b>
- <b>Creative Arts & Art Forms \[079\]</b>
- <b>Visual Art, Design & Photography \[548\]</b> — subs: Graphic Design & Visual Communication \[548\], Photography \[126\], Street Art \[259\]
- <b>Handicrafts & Traditional Skills \[095\]</b> — subs: Traditional Skills \[141\] (merged), Traditional Painting \[258\], Sculpture \[260\], Stone Carving \[261\], Wood Carving \[262\], Pottery \[263\], Textile History \[264\], Weaving \[265\], Embroidery \[266\], Basketry \[267\]
- <b>Traditional Performing Arts \[081\]</b> — subs: Theatre & Performing Arts \[081\], Folk Theatre \[249\], Dolls & Puppetry \[250\], Traditional Instruments \[255\], Classical Dance \[257\], Martial Arts History \[253\], Archery Culture \[254\]
- <b>Classical & Traditional Music \[256\]</b>
- <b>World Cultures & Traditions \[149\]</b> — subs: Global Cultures \[149\], Cultural Traditions \[243\], Festivals Around the World \[244\], Festival Origins \[245\], Wedding Culture \[246\], Traditional Clothing \[247\], Folk Traditions \[248\], Traditional Games \[251\], Traditional Sports \[252\], Youth Culture \[176\]
- <b>Rural Life & Village Culture \[094\]</b>
- <b>Museums & Cultural Heritage \[096\]</b>
- <b>Fashion & Clothing Design</b> — primary placement §22 \[082\]

## 18. Home, DIY, Making & Hobbies — focus: SUBJECT / PRODUCT

- <b>DIY & Making \[085\]</b> — subs: DIY \[399\] (merged), Woodworking \[400\], Metalworking \[401\], 3D Printing \[402\], Sewing \[403\], Knitting \[404\], Calligraphy \[405\], Handwriting \[406\], Origami \[407\]
- <b>Restoration \[086\]</b>
- <b>Repair & Maintenance \[137\]</b>
- <b>Home & Lifestyle \[064\]</b> — subs: Interior Design \[393\], Tiny Houses \[395\], Sustainable Living \[396\], Organization \[397\], Minimalism \[398\]
- <b>Gardening & Plants \[065\]</b> — subs: Home Gardening \[394\] (merged)
- <b>Collecting & Antiques \[084\]</b> — subs: Collecting \[135\], Toy Collecting \[409\]
- <b>Toys, Models & Miniatures \[408\]</b> — subs: Model Building \[410\], Miniatures \[411\], DIY Mini Worlds \[412\]
- <b>Hobby Science & Collecting Pursuits \[413\]</b> — subs: Astronomy Hobby \[413\], Amateur Science \[414\], Rockhounding \[415\], Fossil Hunting \[416\], Antique Hunting \[417\]

## 19. Travel, Outdoors, Adventure & Survival — focus: PLACE / EVENT

- <b>Travel / Hidden Places \[020\]</b>
- <b>Personal Travel \[074\]</b>
- <b>Exploration & Adventure \[034\]</b>
- <b>India Travel & Heritage Tourism \[222\]</b> — subs: Temple Tourism \[222\], Himalayan Travel \[224\]
- <b>Travel by Landscape \[225\]</b> — subs: Desert Travel \[225\], Island Travel \[226\]
- <b>Journeys & Travel Modes \[227\]</b> — subs: Train Travel \[227\], Road Trips \[228\]
- <b>Travel Skills & Systems \[232\]</b> — subs: Travel Hacks \[232\], Travel Systems \[233\]
- <b>Adventure & Extreme Sports \[117\]</b>
- <b>Outdoor Life & Adventure Skills \[187\]</b> — subs: Backpacking \[188\], Hiking \[189\], Camping \[190\], Fishing \[191\], Beekeeping \[192\]
- <b>Primitive Technology & Bushcraft \[142\]</b>
- <b>Treasure Hunting \[050\]</b>
- <b>Sailing & Boating \[140\]</b>
- <b>Disasters, Rescue & Survival Stories \[046\]</b> — subs: Rescue Stories \[185\], Survival Psychology \[186\]

## 20. Machines, Transport & Engineering — focus: PRODUCT / ORGANISATION

- <b>Cars & Automotive Stories \[022\]</b> — subs: Automotive Engineering \[418\], Supercars \[419\], Electric Vehicles \[420\], EV Battery Technology \[421\]
- <b>Motorcycles, Bicycles & Two-Wheelers \[139\]</b> — subs: Motorcycles \[139\], Bicycles & Cycling \[138\]
- <b>Railways & Trains \[109\]</b>
- <b>Transportation Systems \[110\]</b>
- <b>Aviation & Airports \[047\]</b> — subs: Aircraft Engineering \[422\], Airports \[234\]
- <b>Shipbuilding & Maritime Engineering \[424\]</b> — subs: Maritime \[048\]
- <b>Rocket & Space Engineering \[423\]</b>
- <b>Megastructures & Engineering \[031\]</b>
- <b>Architecture & Civil Infrastructure \[052\]</b> — subs: Metro Systems \[425\], Roads & Highways \[426\], Bridges \[427\], Tunnels \[428\], Construction \[429\], Skyscrapers \[430\]
- <b>Industry & Manufacturing \[051\]</b> — subs: Industrial Machines \[431\], Heavy Equipment \[432\], Mining \[433\], Gem Mining \[434\]
- <b>Energy & Power Systems \[113\]</b> — subs: Oil & Gas \[435\], Power Plants \[436\], Nuclear Engineering \[437\], Solar Technology \[438\], Wind Energy \[439\], Hydroelectricity \[440\], Fusion Energy \[441\], Batteries & Energy Storage \[158\]
- <b>Engineering Failures & Lessons \[162\]</b>

## 21. Politics, Law, Society & Public Systems — focus: EVENT / CONCEPT / ORGANISATION

- <b>Geopolitics / World History \[014\]</b>
- <b>Government & Public Systems \[097\]</b> — subs: Urban Climate Adaptation \[509\], Infrastructure Maintenance \[510\], Public Budgets \[520\]
- <b>Law & Justice \[098\]</b>
- <b>Society & Sociology \[168\]</b> — subs: Community Stories \[169\], Social Experiments \[172\], Poverty & Inequality \[519\]
- <b>Healthcare Systems & Emergency Services \[180\]</b> — subs: Hospital Stories \[181\], Emergency Services \[182\], Public Safety \[183\], Firefighting \[184\]
- <b>Safety & Security Awareness \[493\]</b> — subs: Personal Security \[493\], Home Security \[494\], Digital Safety \[495\]
- <b>Water, Sanitation & Waste \[507\]</b> — subs: Water \[114\], Waste Management \[508\]
- <b>Work, Rights & Labour \[516\]</b> — subs: Worker Safety \[517\], Cooperatives \[518\]
- <b>Internet & Digital Governance \[515\]</b>
- <b>Philanthropy & Social Good \[317\]</b>

## 22. Luxury, Lifestyle & Living — focus: PRODUCT / PLACE

- <b>Luxury / Rich Lifestyle \[021\]</b>
- <b>Fashion & Clothing \[082\]</b>
- <b>Jewelry & Precious Materials \[083\]</b>
- <b>Hotels, Resorts & Hospitality \[229\]</b> — subs: Hospitality \[230\], Resorts \[231\]
- <b>Shopping & Consumer Guides \[136\]</b> — subs: Consumer Rights \[497\], Product Recalls \[498\]
- <b>Auctions & Luxury Markets \[316\]</b>

## 23. Future & Speculative Civilization — focus: CONCEPT

- <b>Future Civilization & AI Society \[468\]</b> — subs: Future Civilization \[053\] (merged), Human-Robot Society \[469\], Future Cities \[473\], Floating Cities \[474\], Moon Civilization \[475\], Mars Civilization \[476\], Space Civilization \[477\], Asteroid Mining \[478\], Interstellar Civilization \[479\]
- <b>Future Predictions & Scenarios \[166\]</b> — subs: Future Civilization Scenarios \[490\], Speculative Science \[491\], Ultimate Future of Humanity \[492\]
- <b>Transhumanism & Life Futures \[470\]</b> — subs: Brain Enhancement \[471\], Life Extension \[472\], First Contact \[480\], Artificial Consciousness \[481\], Digital Immortality \[482\], Synthetic Life \[483\], Lab-Grown World \[484\], Post-Internet World \[488\], Augmented Humans \[489\]
- <b>Autonomous & Future Living Systems \[485\]</b> — subs: Autonomous Industry \[485\], Autonomous Transportation \[486\], Autonomous Homes \[487\]

## 24. Kids, Family & Parenting — focus: STORY / SUBJECT

- <b>Kids Cartoon Stories \[017\]</b>
- <b>Parenting & Child Development \[073\]</b>
- <b>Kids Learning \[NEW\]</b> — subs: (Animals for kids, Science for kids, GK for kids)

## 25. Facts, Lists, Records & Explainer Formats — focus: MIXED

- <b>General Knowledge \[443\]</b> — subs: Trivia \[444\], Quiz Channels \[445\]
- <b>Records & Extremes \[163\]</b>
- <b>Rankings & Comparisons \[164\]</b>
- <b>Then vs Now \[165\]</b> (format usable across niches)
- <b>What If? / Alternative Reality \[167\]</b> (format usable across niches)
- <b>Puzzles & Intellectual Mysteries \[056\]</b>
- <b>Explainer Formats — How & Why \[087\]</b> — subs: How Things Work \[087\], How It's Made \[088\], Why? Channel \[090\]

---

## Merge Log (duplicates merged, IDs preserved as references)

| Merged ID | Entry | Merged into |
| --- | --- | --- |
| 171 | Human Behavior | 009 Psychology / Human Behavior (§12) |
| 280 | Yoga | 077 Yoga & Wellness (§4) |
| 318 | Internet | 129 Internet & Web (§6) |
| 399 | DIY | 085 DIY & Making (§18) |
| 394 | Home Gardening | 065 Gardening & Plants (§18) |
| 141 | Traditional Skills | 095 Handicrafts & Traditional Skills (§17) |
| 053 | Future Civilization | 468 Future Civilization & AI Society (§23) |
| 369 | Documentary Making | 005 Documentary Storytelling & Making (§15) |
| 048 | Maritime | 424 Shipbuilding & Maritime Engineering (§20) |

## Notes for the Registry Map (next step)

- Category Entity Focus decides the primary registry type per niche<br />(PERSON → Character, PLACE → Place, SUBJECT-safety → Knowledge/<br />Ingredient, CREATURE → Creature, EVENT → Case/Event, STORY →<br />Story-World, ORGANISATION → Organisation, PRODUCT → Product,<br />WORK → Work, CONCEPT → Concept).
- §7 Scams \[496\] is placed once (story/case form); the §21 safety<br />niche covers awareness without it to avoid double placement.
- Angle registries (per Angle\_s\_scope.txt) attach per niche on top of<br />this hierarchy: Niche → Angles \{question, scope, evidence, boundary\}.
- Count check: 550 legacy IDs placed (verified by script), plus<br />\[NEW\] niches: Medical Conditions Explained, Astrology/Numerology/<br />Vastu, Competitive Exam Prep, Bedtime Stories, Kids Learning.

---

## 53. Registry Map - The Proper Bible Registry for Every Niche

Added 2026-10-27. Built on the Merged Niche List v2 (Section 52). This answers the registry question completely: <b>Character Registry, Herb Registry and Place Registry were only 3 of the 10 registry types.</b> Every niche now gets its proper registry set.

<b>How it works:</b> a registry is a typed collection of locked entity entries inside the project Bible. Annexes hold RULES (how to portray, disclose, claim). Registries hold ENTITIES (the locked facts about each person, place, herb, case, creature...). Every niche gets ONE primary registry + secondary registries + a universal set. A niche inherits its category's assignment; niches that differ are listed as Overrides (Part C). The Niche Template declares the set; applying it activates exactly those registries in that project's Bible. Entries unlimited.

Full document also saved locally: docs/REGISTRY\_[MAP.md](http://MAP.md).

## Part A — The 10 Registry Types (defined once, reused by all niches)

### 1. Character Registry — PERSON

Entry: <code>{ name, aliases[], role: main|supporting|recurring, era,<br>identitySummary, traits[], motivations, relationships[], lifeTimelineRef,<br>lockedAppearanceDescription, imagePromptSuffix, portrayalNotes,<br>sensitivityNotes, dialoguePolicyRef }</code><br />Used by: Research, Outline, Script, Scene Breakdown (locked appearance<br />→ every image prompt), Continuity + Fact Audit. Home: Character Annex.

### 2. Place Registry — PLACE

Entry: <code>{ name, canonicalName, localName, pronunciation, hierarchy,<br>placeType: city|region|site|natural|celestial|fictional-ref, eraContext,<br>lockedVisualDescription, imagePromptSuffix, mapNotes, namingSensitivity,<br>keyFacts[] }</code><br />Used by: Research, Scene Breakdown, Map scenes, Fact Audit.<br />Home: Place & Region Annex (or standalone where no annex).

### 3. Knowledge & Ingredient Registry — SUBJECT

Two variants:

- <b>Ingredient/Material</b> (Ayurveda, food, chemistry): <code>{ name,<br>  otherNames[], category, claimedProperties, verifiedNotes,<br>  safetyWarnings, usageStandards, disclaimerRef }</code>
- <b>Topic Knowledge</b> (general subjects): <code>{ topic, lockedDefinition,<br>  keyFacts[], commonMisconceptions[], sourceRefs[], boundaryNotes }</code><br />Used by: Research, Script (accuracy), Glossary generation, Safety Audit.<br />Home: Subject Annex where one exists, else standalone.

### 4. Case / Event Registry — EVENT

Entry: <code>{ name, dateOrRange, placeRefs[], personRefs[], verifiedSummary,<br>eventTimeline[], outcome, disputedPoints[], sensitivityNotes<br>(victims/privacy/legal), sourceRefs[] }</code><br />Used by: Research Brief seeding, Fact + Continuity Audit, Do-Not-Repeat<br />linkage (a covered case is flagged on re-selection).

### 5. Creature Registry — CREATURE

Entry: <code>{ commonName, scientificName, aliases[], habitatPlaceRefs[],<br>lockedAppearanceDescription, imagePromptSuffix, behaviourTraits[],<br>diet, sizeScale, conservationStatus, dangerNotes,<br>commonMisconceptions[] }</code><br />Used by: Research, Scene Breakdown (consistent animal visuals), Fact Audit.

### 6. Story-World Registry — STORY

Entry: <code>{ worldName, premise, worldRules[], characterRefs[],<br>fictionalPlaceRefs[], inWorldTimeline, canonFacts[], toneNotes,<br>spoilerPolicy, originalityNotes }</code><br />For fiction, horror, fantasy, lore, mythology-as-story, kids' worlds.<br />Used by: Outline, Script, Continuity Audit (story must obey world rules).

### 7. Organisation Registry — ORGANISATION

Entry: <code>{ name, orgType: company|institution|team|state|publication,<br>foundedOrPeriod, founderPersonRefs[], productRefs[], keyEventRefs[],<br>lockedFacts[], positioningNotes, rivalries[], sourceRefs[] }</code><br />Used by: Research, Script, Fact Audit. Business, tech, politics, sports teams.

### 8. Product Registry — PRODUCT

Entry: <code>{ name, makerOrgRef, category, launchOrPeriod, lockedSpecs{},<br>variants[], lockedDesignDescription, imagePromptSuffix,<br>commonErrors[] }</code><br />For cars, gadgets, machines, luxury goods, dishes-as-products.<br />Used by: Research, Scene Breakdown (consistent product visuals), Fact Audit.

### 9. Concept Registry — CONCEPT

Entry: <code>{ concept, lockedDefinition (one canonical explanation),<br>simpleExplanation, exampleBank[], commonMisconceptions[],<br>relatedConceptRefs[], terminologyRules, beliefLabel?: boolean }</code><br />Used by: Script (same concept explained identically in every video),<br />Glossary generation, Accuracy Audit. <code>beliefLabel</code> marks belief-based<br />concepts (astrology etc.) so scripts label them as belief, not fact.

### 10. Work Registry — WORK

Entry: <code>{ title, workType: film|series|book|match|song|game|text,<br>creators[], releaseOrDate, parts[] (episodes/chapters/matches),<br>canonSummary, characterRefs[], spoilerPolicy, rightsNote<br>(summarise/review only, no reproduction) }</code><br />Used by: Outline (recaps/explainers), Script, Originality/Rights Audit.

### Angle Registry — per niche (Admin level, from user's system)

Not a Bible registry: Angles live <b>on the niche in Admin</b>, inherited<br />by every project of that niche. Entry (from user's ANGLE\_PLAN):<br /><code>{ slug, angle, question, scope, evidence, boundary }</code> + status/version.<br />A Run selects one Angle + a concrete story question; the scope is<br />snapshotted into the Run config (Q3 in user's Q-set), bounds the<br />Research Brief, and the Audit checks the script stayed inside scope.

### Universal set — EVERY niche also has

Glossary & Pronunciation (Bible §10) · Master Source List ·<br />Do-Not-Repeat List · Phrase Bank · Hook & Opening Library ·<br />Approved Asset Source List · Angle Registry (on the niche).<br />Plus where relevant: Master Timeline (time-based niches) and<br />Location/Setting List (recurring visual sets).

---

## Part B — Category Map (all 25 categories of the merged list)

| # | Category | Primary | Secondary | Notes |
| --- | --- | --- | --- | --- |
| 1 | History & Heritage | Character + Case/Event | Place, Master Timeline | Dialogue policy + dramatization labels (Character Annex rules) |
| 2 | Geography, Places & Maps | Place | Case/Event (border changes), Concept | Neutral naming for disputed places |
| 3 | Science, Space & Earth | Concept + Knowledge | Creature (bio), Place (celestial/earth), Product (inventions) | Accuracy-first; misconception fields matter |
| 4 | Health, Wellness & Ayurveda | Knowledge & Ingredient (safety variant) | Concept | Mandatory disclaimer + no-cure-claims audit gate |
| 5 | Finance, Business & Economics | Organisation + Concept | Character (founders), Case/Event (crises, scams), Product (plans/products as concepts) | Financial Data Verified ties in (user Bible file 02) |
| 6 | Technology, AI & Digital Life | Product + Organisation | Concept, Case/Event (launches, breaches) | Fast-moving: entries carry review dates |
| 7 | Crime, Mystery & Investigations | Case/Event | Character (persons in case), Place (case locations) | Victim privacy + legal sensitivity mandatory |
| 8 | Stories, Fiction & Fantasy | Story-World | Character (fictional), Place (in-world) | Originality audit vs Do-Not-Repeat stories |
| 9 | Religion, Philosophy & Spirituality | Concept + Character (deities, saints) | Place (sacred), Story-World (epics), Work (texts) | Respect/portrayal rules; belief labelling |
| 10 | Education & Learning | Concept + Knowledge | Work (books, syllabus), Case/Event (exam patterns) | Curriculum-version awareness |
| 11 | Careers, Jobs & Skills | Concept | Organisation (industries, employers), Knowledge | Advice-boundary notes (guidance, not guarantees) |
| 12 | Psychology, Mind & Relationships | Concept | Case/Event (famous studies/experiments), Character (illustrative personas, fictional-labelled) | No personal medical/therapy advice |
| 13 | Animals, Nature & Environment | Creature | Place (habitats, parks), Concept (ecology) | Conservation status kept current |
| 14 | Sports, Games & Play | Character (athletes) + Work (matches, games) | Organisation (teams, clubs), Case/Event (historic finals) | Scores/records verified per entry |
| 15 | Film, Entertainment & Media | Work | Character (characters + real persons), Organisation (studios), Story-World (lore) | Rights note: recap/review framing only |
| 16 | Food, Cooking & Farming | Knowledge & Ingredient | Place (regional cuisines), Product (signature dishes = recipe-variant entries) | Recipe entries carry format standard + safety (allergens) |
| 17 | Culture, Arts & Crafts | Work (artworks, performances) + Knowledge (techniques) | Place (tradition regions), Product (craft objects) | Technique entries = Knowledge variant |
| 18 | Home, DIY, Making & Hobbies | Product + Knowledge (techniques/steps) | Creature (hobby animals — primary stays §13), Place (spaces, light) | Safety notes on tools/process entries |
| 19 | Travel, Outdoors, Adventure & Survival | Place | Case/Event (expeditions, disasters), Character (explorers, survivors) | Location safety/current-status notes |
| 20 | Machines, Transport & Engineering | Product | Organisation (manufacturers), Case/Event (failures, disasters), Place (infrastructure) | Specs locked per model/variant |
| 21 | Politics, Law, Society & Public Systems | Organisation + Case/Event | Concept (laws, rights), Character (public figures), Place | Neutrality rules; legal-info-not-advice boundary |
| 22 | Luxury, Lifestyle & Living | Product | Place (hotels, destinations), Organisation (brands) | Price claims dated per entry |
| 23 | Future & Speculative | Concept + Story-World (scenarios) | Product (speculative tech, labelled speculative) | <b>Speculation label mandatory</b> — never presented as fact |
| 24 | Kids, Family & Parenting | Story-World + Character | Concept (values/lessons), Creature (animal characters) | Age-appropriateness gate on all entries |
| 25 | Facts, Lists, Records & Formats | Inherits the topic niche's set | Concept + Case/Event | A list/format Run must declare its source niche and use that niche's registries |

---

## Part C — Per-Niche Overrides (niches that differ from their category)

- <b>Castles, Forts & Palaces \[037\]</b> (§1 History) → Place <i>primary</i><br />(the place is the subject; kings are secondary Character entries)
- <b>Biography niches \[146\], Athlete/Entrepreneur/Celebrity biographies</b><br />→ Character primary in their categories
- <b>Archaeology \[039\]</b> → Place + Case/Event co-primary (sites + digs)
- <b>Ancient Technology / Lost Knowledge \[013\]</b> → Product primary<br />(ancient devices) + Concept
- <b>Sanatan / Hindu Mythology \[004\], Mythological Animation \[018\]</b> →<br />Character (deities) + Story-World co-primary; Concept secondary
- <b>Sacred Texts & Epics \[268 subs: 269–272, 540, 541\]</b> → Work primary
- <b>Astrology / Numerology / Vastu \[NEW §9\]</b> → Concept primary with<br /><code>beliefLabel: true</code> on every entry
- <b>Space & Universe \[012\], Space Exploration \[032\]</b> → Place primary<br />with <code>placeType: celestial</code> + Concept secondary
- <b>Dinosaurs & Prehistoric \[029\]</b> → Creature primary (prehistoric<br />variant: appearance locked to current scientific consensus + review date)
- <b>Inventions \[089 subs\]</b> (§3) → Product primary
- <b>Banking & Money \[293\], Crypto \[296\]</b> (§5) → Concept primary,<br />Organisation secondary (banks, exchanges), Case/Event (crashes, failures)
- <b>True Crime \[010\], UFO \[033\], Secret Societies \[057\]</b> (§7) →<br />Case/Event primary confirmed; Character entries carry privacy flags
- <b>Horror / Mystery Stories \[011\]</b> (§8) → Story-World primary;<br />recurring horror characters in Character Registry (fictional)
- <b>Gaming Stories & Lore \[025\]</b> (§14) → Story-World + Work co-primary
- <b>Chess & Board Games \[133/134\]</b> (§14) → Work primary (famous games),<br />Character secondary (players)
- <b>Cricket \[546\] / Football \[547\]</b> → Work (matches) + Character<br />(players) + Organisation (teams) — all three active
- <b>Movie & Series Explainers \[080\], Books \[078\]</b> (§15) → Work primary<br />confirmed; spoiler policy enforced from Work entry
- <b>Recipes \[091 subs\]</b> (§16) → Knowledge registry, Recipe variant:<br /><code>{ dish, regionPlaceRef, ingredients[] (ingredient refs), stepsStandard,<br>  allergenNotes, originNotes }</code>
- <b>Martial Arts History \[253\]</b> (§17) → Knowledge (techniques) +<br />Character (masters) co-primary
- <b>Cars \[022\], Gadgets \[063\], Supercars/Luxury goods</b> → Product<br />primary confirmed with locked design description (visual consistency)
- <b>Geopolitics \[014\]</b> (§21) → Organisation (states/institutions) +<br />Case/Event + Place (disputed-place neutral naming from Place entry)
- <b>Exam Prep \[NEW §10\]</b> → Concept + Work (syllabus & past papers as<br />works) + Knowledge; entries versioned by exam cycle
- <b>Kids Cartoon Stories \[017\]</b> (§24) → Story-World + Character<br />co-primary; all entries pass the age-appropriateness gate
- <b>What If / Then vs Now \[167/165\]</b> (§25) → use the <i>compared</i><br />niches' registries (e.g. a history What-If uses §1's set) +<br />speculation/comparison label in Concept entries

## Implementation (specs)

- API §5/§6A: <code>RegistryModule</code> per project Bible: <code>{ registryType,<br>  annexHome? , entries[] }</code>; niche template <code>registries[]</code> assignment<br />(primary/secondary); CRUD endpoints mirroring master-lists;<br />Angle Registry endpoints on niches (Admin): angle CRUD + run<br />angle-selection snapshot.
- Admin §8: Registry Type Library (the 10 types, dynamic fields like<br />annex templates) + Angle management per niche; Niche Template gains<br />a Registries section (10th template section).
- Web §4: Bible screen gains a <b>Registries</b> tab (active registries<br />only, entry CRUD + search); Run creation selects Angle + story<br />question (Step 4/5), scope shown in Run Overview.
- Shared: <code>RegistryType</code>, entry DTOs per type, <code>Angle</code> DTO.

---

## 54. Visual Style System v2 - Archetype-First Rebuild

Added 2026-10-27. Rebuild of the user's Visual Style Master Database (which claimed 500 profiles but contained only 34 rows - see the file review).

<b>The fix:</b> the old file repeated near-identical style rows per niche. Its real asset was the \~13 archetypes underneath. Now each archetype is defined <b>fully, once</b> - with all 14 schema fields, including the <b>Texture and Graphics</b> columns the old table had dropped, and a <b>distinct Motion per archetype</b> instead of the copy-pasted one. Every niche then maps to an archetype + small per-niche overrides only - no 500 duplicated rows to maintain, and coverage is complete for all niches in the merged list (Section 52).

A project's Bible Visual section = archetype snapshot + overrides. A scene's image prompt = archetype keywords + locked registry descriptions (character / product / place) + the scene's own visual.

Full document also saved locally: docs/VISUAL\_STYLE\_[SYSTEM.md](http://SYSTEM.md).

## Part A — The 16 Archetypes

<b>A1. Cinematic Historical Documentary</b> <i>(from user rows 2, 3, 14)</i><br />Language: period reconstruction + archival textures + maps. Palette:<br />earth / bronze / parchment / charcoal. Lighting: warm directional key,<br />smoky atmosphere. Camera: 24mm environments, 50mm portraits, aerial<br />maps. Motion: slow push-ins, parallax layers, motivated tracking.<br />Texture: film grain, aged paper, tactile stone/wood/metal. Graphics:<br />minimal era-styled captions, aged-map overlays. Thumbnail: hero<br />subject + era/location cue + bold negative space. Keywords: cinematic<br />historical reconstruction, period-authentic, photoreal, tactile<br />materials, atmospheric depth, documentary realism. Avoid: modern<br />objects, generic fantasy armour, anachronisms, plastic-looking CGI.

<b>A2. Sacred Cinematic Devotional</b> <i>(rows 4, 18, 23)</i><br />Language: temple-scale compositions + symbolic macro details.<br />Palette: saffron / gold / vermilion / deep indigo. Lighting: soft<br />sunrise glow, volumetric rays. Camera: 24mm grandeur, 50mm devotional<br />portrait, macro details. Motion: slow reverent push-ins, gentle<br />parallax, stillness holds. Texture: carved stone, brass, flower, smoke<br />and lamp glow. Graphics: minimal, respectful typography, no clutter<br />over sacred subjects. Thumbnail: deity/sacred object + radiant focal<br />point + uncluttered title area. Keywords: sacred cinematic, respectful<br />devotional atmosphere, temple architecture, warm divine glow,<br />intricate detail, reverent composition. Avoid: disrespectful<br />depictions, random fantasy elements, modern props, excessive neon.

<b>A3. Scientific Cinematic Explainer</b> <i>(rows 6, 12, 26–28, 30, 32)</i><br />Language: photoreal macro + scientific visualisation + clean diagrams.<br />Palette: midnight blue / teal / white. Lighting: neutral studio light<br />with selective glow. Camera: macro, 50mm, wide scientific<br />environments. Motion: slow orbital moves, scale zooms, diagram<br />build-ups. Texture: clean glass/metal/lab surfaces, starfield and<br />deep-sea depth. Graphics: sparse precise labels, data callouts,<br />scale bars. Thumbnail: single scientific subject + scale cue + clean<br />label. Keywords: scientific visualisation, photoreal macro, accurate<br />anatomy/physics, clean composition, cinematic realism. Avoid:<br />scientific inaccuracies, unreadable labels, sensationalised imagery.

<b>A4. Futuristic Tech Editorial</b> <i>(rows 1, 7, 13, 19)</i><br />Language: clean cinematic UI + macro hardware. Palette: deep navy /<br />electric cyan / violet. Lighting: cool rim light, controlled<br />contrast. Camera: 35mm + macro + screen inserts. Motion: precise<br />controlled cuts, smooth slider moves, UI element animation. Texture:<br />brushed metal, glass, circuit detail. Graphics: minimal HUD accents,<br />never fake unreadable UI text as content. Thumbnail: hero<br />device/system + one high-contrast UI/data element. Keywords:<br />futuristic technology editorial, photoreal hardware, cinematic UI,<br />cool rim light, premium commercial realism. Avoid: generic sci-fi<br />clutter, fake UI text, impossible hardware details.

<b>A5. Premium Business Editorial</b> <i>(rows 5, 8, 21)</i><br />Language: luxury b-roll + data overlays + polished portraits.<br />Palette: charcoal / ivory / emerald / gold. Lighting: soft studio key,<br />crisp highlights. Camera: 35mm corporate, 85mm portrait, overhead<br />detail. Motion: controlled cuts, purposeful moves, chart build-ins.<br />Texture: glass towers, leather, paper, polished wood. Graphics:<br />restrained charts, one data cue per frame. Thumbnail: person/object +<br />premium environment + one data cue. Keywords: premium editorial,<br />sophisticated office, polished portrait, cinematic commercial<br />lighting, restrained graphics. Avoid: stock-photo clichés, luxury<br />flexing, cluttered dashboards.

<b>A6. Introspective Cinematic Essay</b> <i>(rows 9, 16)</i><br />Language: human close-ups + metaphorical imagery + minimal graphics.<br />Palette: deep blue / warm skin / charcoal. Lighting: soft window<br />light, gentle falloff. Camera: 50mm/85mm portraits + symbolic wides.<br />Motion: very slow push-ins, long holds, breathing pauses. Texture:<br />natural skin, fabric, rain/glass, everyday objects as symbols.<br />Graphics: near-none; single-line text moments only. Thumbnail:<br />expressive face/object + metaphorical visual. Keywords: introspective<br />cinematic essay, human emotion, symbolic imagery, soft window light,<br />shallow depth of field. Avoid: melodramatic clichés, heavy text<br />overlays, artificial expressions.

<b>A7. Dark Mystery Documentary</b> <i>(rows 10, 11, 33)</i><br />Language: moody reenactment + evidence inserts + atmospheric<br />locations. Palette: black / desaturated blue / muted red. Lighting:<br />low-key, hard practicals, haze. Camera: 35mm handheld, 85mm detail,<br />slow push-ins. Motion: creeping push-ins, still surveillance-style<br />holds, reveal pans. Texture: rain, dust, paper files, tape, chalk.<br />Graphics: evidence-board elements sparingly, redacted-document<br />motifs. Thumbnail: single evidence/subject + shadow + mystery hook.<br />Keywords: dark cinematic documentary, investigative mood, low-key<br />lighting, atmospheric haze, realistic evidence, restrained colour.<br />Avoid: gore for shock value, cartoon horror, excessive red grading,<br />implausible evidence.

<b>A8. Clean Educational Visuals</b> <i>(row 15)</i><br />Language: clear diagrams + object/presenter-style shots + restrained<br />motion graphics. Palette: white / navy / one accent. Lighting: bright<br />soft studio. Camera: 35mm, top-down, diagram inserts. Motion:<br />step-by-step build-ups, highlight pulses, calm cuts. Texture: clean<br />paper/desk, simple props. Graphics: the content itself — labelled<br />diagrams, numbered steps, generous whitespace. Thumbnail: one<br />concept + simple diagram + readable hierarchy. Keywords: clean<br />educational visualisation, accurate diagram, uncluttered composition,<br />soft studio light, clear hierarchy. Avoid: dense text, decorative<br />clutter, misleading diagrams.

<b>A9. High-Impact Engineering Cinema</b> <i>(rows 17</i>, 22, 31)\*<br />Language: hero machines + mechanical macro + kinetic tracking.<br />Palette: graphite / steel / amber. Lighting: hard directional,<br />metallic highlights. Camera: 24mm tracking, 50mm hero, macro.<br />Motion: kinetic tracking shots, speed ramps, mechanical close passes.<br />Texture: machined metal, grease, sparks, rivets, worn paint.<br />Graphics: spec callouts, blueprint lines, measurement overlays.<br />Thumbnail: hero machine + dramatic perspective + scale cue.<br />Keywords: engineering cinematic, industrial realism, mechanical<br />macro, dramatic scale, metallic detail, tracking shot. Avoid:<br />impossible mechanisms, toy-like machinery, unsafe fabrication detail.<br /><i>Row 17 in the old file wrongly assigned this archetype to Kids<br />Cartoon Stories — fixed in Part B (→ A15).</i>

<b>A10. Immersive Adventure Cinema</b> <i>(rows 20, 34)</i><br />Language: expedition footage + sweeping landscapes + tactile details.<br />Palette: forest green / sand / sky blue. Lighting: natural golden<br />hour, weather realism. Camera: 16mm/24mm landscapes, 35mm action,<br />drone. Motion: drone sweeps, walking tracking, weather-driven moves.<br />Texture: rock, rope, canvas, mud, ice — real expedition materials.<br />Graphics: route maps, elevation/distance markers. Thumbnail: hero<br />landscape/person + strong depth + location cue. Keywords: adventure<br />documentary, vast landscape, realistic weather, natural light,<br />expedition realism, cinematic depth. Avoid: over-saturated travel<br />clichés, impossible weather, fake expedition gear.

<b>A11. Cinematic Food Editorial</b> <i>(row 24)</i><br />Language: hero food macro + hands-in-frame process + cultural<br />context. Palette: warm cream / spice tones / dark wood. Lighting:<br />soft warm side light, glossy highlights. Camera: 50mm + macro +<br />overhead. Motion: slow push-ins, pour/steam reveals, overhead<br />process flows. Texture: steam, oil sheen, grain, spice, handmade<br />vessels. Graphics: minimal ingredient labels, recipe step markers.<br />Thumbnail: hero dish macro + ingredient/process detail. Keywords:<br />cinematic food photography, appetising macro, tactile ingredients,<br />warm side light, editorial realism. Avoid: messy framing, fake food<br />textures, excessive filters.

<b>A12. Dynamic Pop-Culture Motion</b> <i>(row 25)</i><br />Language: graphic overlays + kinetic typography + cinematic<br />character shots. Palette: neon cyan / magenta / black. Lighting:<br />neon practicals, punchy contrast. Camera: 24mm action, 50mm<br />character, UI inserts. Motion: fast purposeful cuts, beat-synced<br />moves, kinetic type. Texture: screen glow, gloss, stylised surfaces.<br />Graphics: bold titles, stat cards, versus frames. Thumbnail: hero<br />character + kinetic graphic + strong silhouette. Keywords: dynamic<br />pop-culture cinematic, stylised characters, neon accents, kinetic<br />composition, high energy. Avoid: copying copyrighted characters,<br />unreadable UI, visual overload.

<b>A13. Cinematic Editorial Documentary</b> <i>(row 29) — the generalist</i><br />Language: story-driven b-roll + contextual environments + restrained<br />graphics. Palette: natural neutrals + one thematic accent. Lighting:<br />soft cinematic contrast, motivated practicals. Camera: 35mm<br />storytelling, 50mm details, wide establishing. Motion: slow push-ins,<br />parallax, motivated tracking. Texture: real-world surfaces of the<br />subject's world. Graphics: restrained lower-thirds, chapter cards.<br />Thumbnail: single hero subject + contextual environment + clear<br />hierarchy. Keywords: cinematic editorial documentary, photoreal,<br />story-driven composition, natural light, restrained graphics. Avoid:<br />generic stock imagery, visual clutter, inconsistent lighting,<br />excessive effects. <i>Default archetype when no other fits.</i>

<b>A14. Wild Naturalist Cinema</b> <i>(NEW — nature/wildlife/ocean)</i><br />Language: telephoto wildlife + habitat wides + underwater/field<br />macro. Palette: habitat-true greens / browns / ocean blues. Lighting:<br />natural only — dawn/dusk preference, underwater light falloff.<br />Camera: long telephoto behaviour shots, wide habitat establishing,<br />macro for small life. Motion: patient tracking, slow follows,<br />drone habitat sweeps (never harassing subjects). Texture: fur,<br />feather, scales, bark, coral, water surface. Graphics: species labels,<br />range maps, scale comparisons — sparse. Thumbnail: animal hero +<br />habitat + scale cue. Keywords: wildlife cinematography, natural<br />history documentary, photoreal animal, habitat realism, telephoto,<br />natural light. Avoid: zoo/captive look for wild stories, impossible<br />animal behaviour, anthropomorphic expressions, oversaturation.

<b>A15. Bright Storybook Animation</b> <i>(NEW — kids/family; fixes row 17)</i><br />Language: warm 2D/3D storybook animation + expressive characters +<br />simple readable scenes. Palette: bright primaries + soft pastels,<br />high cheerfulness. Lighting: soft even cartoon light, no harsh<br />shadow. Camera (virtual): simple wide/medium framing, gentle moves<br />young viewers can follow. Motion: bouncy character motion, clear<br />cause-effect, calm pacing. Texture: soft matte, paper/crayon accents<br />optional per series. Graphics: big friendly labels, counting/letter<br />elements for learning content. Thumbnail: happy hero character +<br />one clear object + bold simple title space. Keywords: bright<br />storybook animation, cute expressive characters, soft colours,<br />child-friendly, clean simple composition, warm and safe mood. Avoid:<br />scary imagery, dark grading, complex cluttered scenes, realistic<br />violence, fast flashing cuts.

<b>A16. Luxury Opulence Editorial</b> <i>(NEW — luxury/lifestyle/hospitality)</i><br />Language: slow glamour b-roll + material macro + architectural<br />grandeur. Palette: black / gold / ivory / deep jewel accent.<br />Lighting: dramatic soft key, sparkling highlights, candle/chandelier<br />practicals. Camera: slow dolly 35mm interiors, 85mm detail macro,<br />aerial property reveals. Motion: very slow glides, reveal pans,<br />no fast cuts. Texture: marble, gold leaf, silk, polished glass,<br />water reflections. Graphics: minimal serif titles, price/record<br />callouts sparingly. Thumbnail: one iconic luxury object/place +<br />dramatic light + minimal text space. Keywords: luxury editorial,<br />opulent interiors, cinematic glamour, gold accents, premium material<br />detail, slow elegant camera. Avoid: cheap-looking stock, cluttered<br />frames, loud colours, excessive flex montage.

---

## Part B — Category Mapping (all 25 categories, merged list v2)

| # | Category | Archetype | Category-level override |
| --- | --- | --- | --- |
| 1 | History & Heritage | A1 Historical | Maps get parchment treatment; portraits follow Character Registry |
| 2 | Geography, Places & Maps | A1 Historical (maps) / A10 Adventure (places) | Aerial map sequences are a signature shot |
| 3 | Science, Space & Earth | A3 Scientific | Space: deeper blacks; Earth science: natural palette shift |
| 4 | Health, Wellness & Ayurveda | A8 Educational | Ayurveda niches: A2-lite override — warm natural light, herb macro, no devotional deity framing unless the niche is devotional |
| 5 | Finance, Business & Economics | A5 Business | Data scenes follow Data Visualisation specs (Bible file 06) |
| 6 | Technology, AI & Digital Life | A4 Tech | Tutorials: A8 override for screen clarity |
| 7 | Crime, Mystery & Investigations | A7 Dark Mystery | Sensitivity: no graphic imagery regardless of archetype |
| 8 | Stories, Fiction & Fantasy | A13 Editorial | Horror stories → A7 override; Fantasy worlds → richer saturated palette override |
| 9 | Religion, Philosophy & Spirituality | A2 Sacred | Philosophy niches → A6 Introspective override; academic religion explainers → A8 |
| 10 | Education & Learning | A8 Educational | Exam prep: maximum diagram clarity, zero decoration |
| 11 | Careers, Jobs & Skills | A5 Business | Softer palette override for guidance tone |
| 12 | Psychology, Mind & Relationships | A6 Introspective | Study/experiment explainers → A3 diagram inserts |
| 13 | Animals, Nature & Environment | A14 Naturalist | Ocean life: underwater variant (blue falloff, particulate) |
| 14 | Sports, Games & Play | A12 Pop-Culture | Sports history → A1 override; Chess/board → A13 calm override |
| 15 | Film, Entertainment & Media | A12 Pop-Culture | Documentary craft niches → A13; Music history → A6/A13 by era |
| 16 | Food, Cooking & Farming | A11 Food | Farming stories → A14/A10 natural override |
| 17 | Culture, Arts & Crafts | A13 Editorial | Craft process → A11-style macro (hands + process) override |
| 18 | Home, DIY, Making & Hobbies | A8 Educational | Build/process content: A9-lite (workshop texture, no spectacle) |
| 19 | Travel, Outdoors, Adventure & Survival | A10 Adventure | Survival/disaster stories → A7 tension override (no gore) |
| 20 | Machines, Transport & Engineering | A9 Engineering | Vehicle stories: hero-vehicle consistency from Product Registry |
| 21 | Politics, Law, Society & Public Systems | A13 Editorial | Geopolitics → A1 maps override; explainers → A8 diagrams |
| 22 | Luxury, Lifestyle & Living | A16 Opulence | Shopping/consumer guides → A5 override |
| 23 | Future & Speculative | A4 Tech | Speculative civilisations: A13 world-building override + speculation label in graphics |
| 24 | Kids, Family & Parenting | A15 Storybook | Parenting guidance → A8 override (for parents, not kids) |
| 25 | Facts, Lists, Records & Formats | A12 Pop-Culture | Inherits subject niche's archetype when the list is single-niche; A12 only for mixed/ranking formats |

## Part C — Notable per-niche overrides & corrections to the old file

- <b>Kids Cartoon Stories \[017\] → A15</b> (old file wrongly: Engineering<br />Cinema). Mythological Animation \[018\] → A2 (old file correct).
- <b>Ancient Technology / Lost Knowledge \[013\] → A1</b> (old file: A4<br />Futuristic — anachronistic; ancient tech is shown as period craft).
- <b>Dinosaurs & Prehistoric \[029\] → A14</b> prehistoric variant: no<br />humans, era-true habitats, consensus-based creature design.
- <b>Ocean & Deep Sea \[028\] → A14</b> underwater variant (old file: A3).
- <b>Documentary Storytelling \[005\] → A13.</b> Note: old visual file's<br />ID 5 was "Business Storytelling" — a different niche; the name<br />mismatch is resolved in favour of the niche list (ID 5 =<br />Documentary Storytelling). Business storytelling content maps to<br />A5 via §5 categories.
- <b>True Crime \[010\] / Horror Stories \[011\] / UFO \[033\] → A7</b> ✓ (old<br />file correct); <b>Motivational Stories \[016\] → A6</b> ✓; <b>Personal<br />Finance \[008\] → A5</b> ✓; <b>Luxury \[021\] → A16</b> (old file: A5 —<br />upgraded to dedicated opulence); <b>Cars \[022\] → A9</b> ✓; <b>Food<br />\[024\] → A11</b> ✓; <b>Gaming \[025\] → A12</b> ✓; <b>Travel \[020\] → A10</b> ✓;<br /><b>AI niches \[001/007\] → A4</b> ✓; <b>History \[002/003\] → A1</b> ✓;<br /><b>Sanatan \[004\] → A2</b> ✓.
- <b>Ayurveda \[281\] → A8 + A2-lite override</b> (natural warmth, herb<br />macro — devotional framing only where the content is devotional).
- <b>Space \[012/032\] → A3</b> ✓ with deep-black space override.
- <b>Psychology \[009\] → A6</b> ✓. <b>Health Education \[015\] → A8</b> ✓.
- <b>Media Literacy \[530\] → A8</b> + screen-analysis inserts.
- <b>Cricket/Football \[546/547\] → A12</b> match-energy override; historic<br />matches → A1.

## Part D — Use in the platform (specs)

- Admin: <b>Visual Style Library</b> — the 16 archetypes are Admin preset<br />data (versioned like prompts); Admin can add archetypes and edit<br />overrides; Niche Template's Bible Template references archetypeId +<br />default overrides for its niche (mapping = Part B/C as seed data).
- API: archetypes served with niche/template data; project Bible<br />Visual section stores <code>{ archetypeId, archetypeVersion, overrides }</code>.
- Web: Project wizard Bible step shows the archetype as a visual card<br />(palette chips + keywords + thumbnail rule) with override editing;<br />Scene Breakdown prompt preview shows the assembled prompt:<br />archetype keywords + registry locked descriptions + scene visual.
- Shared: <code>VisualArchetype</code> DTO with the 10 schema fields.

---

## 55. Production Bible File Mapping - The User's 39 Files in the Layered Bible

Added 2026-10-27. The user's Production Bible file list had 39 files in one flat list - rules, guides, registries, templates, checklists, logs and per-video artifacts mixed together, with duplicate pairs. This mapping gives <b>every file one proper home</b> in the layered Bible system (Sections / Annexes / Registries / Master Lists / Templates / Audit & Checklists / Run & Package Artifacts / Platform Docs). <b>Result: 39 files mapped, 0 lost</b> - 2 duplicates merged, 5 files recognised as not-Bible (they live as run artifacts or platform docs), and <b>5 new components adopted</b> from the list into our system (detailed after the table).

Full document also saved locally: docs/BIBLE\_FILE\_[MAPPING.md](http://MAPPING.md).

## The mapping (all 39)

| # | User file | Layer → Destination |
| --- | --- | --- |
| 00 | Project\_Consistency\_Rules | <b>Bible Governance</b> — the Bible's own consistency/versioning rules + §12 Series & Continuity. Becomes the Bible Preface every project Bible carries |
| 01 | Research\_Sources | <b>Master List 1</b> — Master Source List (approved/blocked sources) |
| 02 | Financial\_Data\_Verified | <b>Registry (NEW)</b> — Verified Data Registry, see Adoptions |
| 03 | Accuracy\_Verification\_Checklist | <b>Audit</b> — Accuracy/Fact checklist instrument, Step 12 |
| 04 | Visual\_Style\_Guide | <b>Bible §5 Visual</b> — now the Visual Archetype system (docs/VISUAL\_STYLE\_[SYSTEM.md](http://SYSTEM.md)) |
| 05 | Voiceover\_Guide | <b>Bible §9 Voice & Narration</b> |
| 06 | Data\_Visualization\_Specs | <b>Annex (NEW)</b> — Data Visualization Annex, see Adoptions |
| 07 | YouTube\_Strategy | <b>Project Strategy + Bible §1/§7</b> — channel strategy lives at project level; packaging rules in §7; execution in Step 17 |
| 08 | Legal\_Liability\_Guide | <b>Bible §8 Compliance & Avoid</b> (legal part) |
| 09 | Ethical\_Storytelling\_Guide | <b>Bible §8 Compliance</b> (ethics part) + registry sensitivity rules (crime, devotional, kids) |
| 10 | Scene\_Template | <b>Template</b> — Scene Template in Niche Templates (scene object standard) |
| 11 | Dialogue\_Script | <b>Run Artifact (format)</b> — dialogue-format script output for story niches; a Production Package format option, not Bible |
| 12 | Monetization\_Strategy | <b>Annex</b> — Monetization & Sponsor Annex |
| 13 | Source\_Credibility\_Guide | <b>MERGED → 01 + §13</b> — credibility tiers live in §13 Research & Evidence Standards (source hierarchy) and as the <code>tier</code> on Source List entries. Duplicate resolved |
| 14 | Bias\_Prevention\_Checklist | <b>Audit</b> — Bias & Neutrality checklist, Step 12 (feeds geopolitics/religion neutrality rules in §8) |
| 15 | Project\_Summary | <b>Platform Artifact</b> — auto-generated Project Home summary (dashboard), not Bible content |
| 17 | AI\_GENERATION\_HANDOFF | <b>Package Artifact</b> — the Production Package's handoff brief: instructions + prompts for external AI image/video/voice tools (the platform generates scripts only; this file is how production tools receive the work) |
| 18 | ASSET\_REGISTER | <b>Master List 7 + Run log</b> — Approved Asset Source List (sources) in the Bible; the per-project Asset Register (assets actually used, with licence) is generated per Run in the Package |
| 19 | CAMERA\_ANIMATION\_GUIDE | <b>Standard (ADOPTED)</b> — Camera & Animation Direction standard for scenes, see Adoptions |
| 20 | CHARACTER\_APPEARANCE\_LOCK | <b>Registry</b> — <code>lockedAppearanceDescription</code> field of the Character Registry |
| 21 | CHARACTER\_WORLD\_GUIDE | <b>Registry + Annex rules</b> — Story-World Registry entries + Character Annex portrayal/world rules |
| 22 | DELIVERY\_CHECKLIST | <b>Checklist</b> — Production Package delivery gate checklist, Step 14 |
| 23 | EDITORIAL\_DEPTH\_REVIEW\_TEMPLATE | <b>Audit (ADOPTED)</b> — Editorial Depth Review, a Step 12 audit dimension + Admin template, see Adoptions |
| 24 | GENERATOR\_PROFILE\_TEMPLATE | <b>Template</b> — Project Generation Profile: per-project generation settings (per-step prompt/model profile selection) used at Run creation |
| 25 | LOCATIONS\_ENVIRONMENTS | <b>Registry + Master List</b> — Place Registry entries + Master Location/Setting List |
| 26 | MAIN\_CHARACTERS | <b>Registry</b> — Character Registry, <code>role: main</code> |
| 27 | MASTER\_Phase2\_ProductionBible | <b>The Bible itself</b> — their "Phase 2" master document = our Production Bible (workflow Step 8 output); not a separate file |
| 28 | MUSIC\_SOUND\_GUIDE | <b>Bible §11 Music & Sound</b> |
| 29 | ORIGINALITY\_REVIEW | <b>Audit</b> — Originality Audit dimension, Step 12, powered by the Do-Not-Repeat List |
| 30 | PRODUCTION\_DETAIL\_STANDARD | <b>Standard (ADOPTED)</b> — Production Detail Standard: minimum detail every scene must carry, see Adoptions |
| 31 | PROPS\_COSTUMES | <b>Registry (NEW)</b> — Props & Wardrobe Registry (Registry Type 11), see Adoptions |
| 32 | RELATIONSHIPS\_TIMELINE | <b>Registry</b> — Character Registry <code>relationships[]</code>  • character life timeline + Master Timeline List |
| 33 | REVIEW\_REVISION\_LOG | <b>Run Artifact</b> — per-Run revision log (Step 13); its template lives in Admin audit/workflow templates |
| 34 | STORY\_BEAT\_MAP | <b>Template</b> — beat-map templates inside Structure Templates (Niche Templates) |
| 35 | SUPPORTING\_CHARACTERS | <b>Registry</b> — Character Registry, <code>role: supporting</code> |
| 36 | VIEWER\_GLOSSARY | <b>Bible §10 Glossary</b> — the project's glossary; a viewer-facing extract ships in the Package (description/pinned material) |
| 37 | Visual\_Style\_Quick\_Reference | <b>MERGED → 04</b> — not a separate file: it is the one-card <i>view</i> of the archetype (the Web app's Archetype Card). Duplicate resolved |
| 38 | WORKFLOW\_GUIDE | <b>Platform Doc</b> — the master workflow (docs/[WORKFLOW.md](http://WORKFLOW.md)), governs the platform, not a project Bible |
| 39 | YOUTUBE\_METADATA | <b>Package + Step 17</b> — per-video metadata template (title/description/tags) in the Package; strategy part already in 07 |

<b>Result:</b> 39 flat files → 0 lost. 2 duplicates merged (13→01/§13,<br />37→04), 5 files recognised as not-Bible (11, 15, 27, 33, 38 — they<br />live as run artifacts, platform docs, or the Bible itself), everything<br />else in exactly one layer.

---

## Adoptions — new components this list contributed (defined)

<b>1. Data Visualization Annex</b> (niche-dependent annex; data-heavy<br />niches: finance, science, statistics, geography, business)<br />Chart-type selection rules per data kind, axis honesty rules (no<br />truncated axes that mislead), label and unit standards, number<br />formatting (Indian/international per audience), colour-blind-safe<br />palette note, source line mandatory on every chart. Used by Script<br />(data scenes) + Scene Breakdown + Accuracy Audit.

<b>2. Verified Data Registry</b> (Knowledge-registry variant; finance,<br />economics, statistics, health-data niches)<br />Entry: <code>{ metric, value, unit, period, geography, sourceRef,<br>verifiedOn, reviewBy, notes }</code>. Scripts may only state figures that<br />exist here or in the Run's Research Brief — this is the project's<br />standing, pre-verified numbers bank (per-video facts still go through<br />the Research Brief fact lock).

<b>3. Props & Wardrobe Registry — Registry Type 11</b> (story, history,<br />fiction, devotional niches)<br />Entry: <code>{ name, type: prop|wardrobe, ownerRef (character/place),<br>era, lockedDescription, imagePromptSuffix, continuityNotes }</code>. A<br />king's crown, a detective's notebook, a deity's attributes must look<br />identical in every scene — same locked-description mechanism as<br />characters. Used by Scene Breakdown + Continuity Audit.

<b>4. Camera & Animation Direction Standard</b> (scene-level)<br />Controlled vocabulary added to the Scene object: <code>shotType</code><br />(establishing / wide / medium / close / macro / aerial / screen /<br />diagram), <code>cameraMove</code> (static / slow push-in / pan / tracking /<br />parallax / orbit / handheld), <code>animationNote</code> (what moves, in what<br />order, for AI-video production). Per-archetype defaults come from the<br />Visual Style System; scenes may override. This is text direction —<br />the platform still produces no video.

<b>5. Editorial Depth Review + Production Detail Standard</b> (QC)

- Editorial Depth Review (Step 12 dimension): does the script actually<br /><i>answer</i> its angle question with depth — evidence used, comparisons<br />made, counterpoints handled — or is it surface-level? Scored with a<br />template in Admin (per-niche add-ons allowed).
- Production Detail Standard (scene completeness): every scene must<br />carry narration, visual, shot/camera direction, on-screen text<br />decision, duration estimate, and registry references where an entity<br />appears. The Audit's completeness check enforces it; a scene<br />missing a field cannot pass.

## Spec impact

- API: Registry types gain <code>propsWardrobe</code>; Knowledge registry gains<br />the Verified Data variant; annex library gains <code>dataVisualization</code>;<br />Scene DTO gains shotType/cameraMove/animationNote; Audit gains the<br />Editorial Depth dimension + Production Detail completeness check.
- Admin: annex templates (+ Data Visualization), audit templates<br />seeded from user files 03/14/23/29 (Accuracy, Bias, Editorial<br />Depth, Originality) as the default Step 12 checklist set.
- Web: Scene Editor shows the three direction fields with the<br />controlled vocabularies; Bible Registries tab shows the new types<br />when active.
- Shared: DTO updates as above.
</content>
</page>