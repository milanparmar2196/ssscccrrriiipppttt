# Angle Seed Import Report — ANGLES_MASTER.md (2026-10-27)

Source: user-uploaded `ANGLES_MASTER.md` (552,052 bytes). Output: `docs/seeds/angles_seed.json` (seedVersion angles-v1). Import key: `(targetId, slug)` stable-ID upsert — re-running the import creates no duplicates and never overwrites records an admin has edited since (edits surface as conflicts, per docs/SEED_DATA.md).

## Count validation
- Sections in file: **550** (numbered 001–550, no gaps) — sections mapped: **550** — skipped: **0**.
- Angles in file: **17,069** (20–60 per section) — angles imported: **17,069**.
- Duplicate angle titles within a section: **0**. Slug conflicts after slugification: **0** (no suffixed slugs needed). Duplicate `(targetId, slug)` pairs: **0**.
- Every imported angle is `completeness: "title_only"`: the file contains titles only, so `question`, `scope`, `evidence` and `boundary` are **unset** — not generated, not assumed.

## Section → taxonomy mapping
- **212 sections → niche records**, **338 sections → sub-niche records** (legacy numbers that live at sub-niche level after the v2 taxonomy merge). Mapping is by legacy ID against docs/seeds/taxonomy_seed.json; each seed angle carries `targetKind`, `targetId` (the unique clean-split id), `legacyId` and a `sourceRef` naming its file section.

## Ambiguous legacy IDs — how each was resolved
- **443**: the file's section 443 is titled "General Knowledge", matching taxonomy niche **id 551** (General Knowledge) — angles attach there. The other 443 record, id 443 "General Knowledge & Exams Foundation", receives **no** angles from this file. Resolution is by name match, recorded here for review.
- **The 35 numbers present at both niche and sub-niche level** (clean-split sharings): the file predates the split and its numbering is the flat list, where the number belongs to the niche — sections attach to the **niche-level record**. The sub-niche sharing the number is a distinct record and receives no angles from that section.

## Name differences (117)
The file's section titles vs the taxonomy's current niche/sub-niche names. Cosmetic only (mapping is by ID); the file's title is preserved in each angle's `sourceRef`. Flagged here for review as requested:

| Legacy ID | File title | Taxonomy name |
|---|---|---|
| 5 | Documentary Storytelling | Documentary Storytelling & Making |
| 12 | Space / Universe | Space & Universe |
| 16 | Motivational Stories | Inspirational & Human Stories |
| 19 | AI Cinematic Short Films | AI Creativity & Media |
| 22 | Cars / Automotive Stories | Cars & Automotive Stories |
| 23 | Spirituality / Meditation | Spirituality & Meditation |
| 25 | Gaming Stories / Lore | Gaming Stories & Lore |
| 26 | Medical & Human Science | Medical & Human Body Science |
| 28 | Ocean & Deep Sea | Ocean & Deep Sea (science) |
| 32 | Space Exploration | Space Exploration & Missions |
| 33 | UFO / Extraterrestrial | UFO / Extraterrestrial (events & cases) |
| 36 | Royalty & Dynasties | Kings, Royalty & Dynasties |
| 43 | Music History | Music History & Artists |
| 46 | Disaster & Survival | Disasters, Rescue & Survival Stories |
| 47 | Aviation | Aviation & Airports |
| 51 | Industrial / Manufacturing Stories | Industry & Manufacturing |
| 52 | Architecture | Architecture & Civil Infrastructure |
| 76 | World Religions & Civilization | World Religions & Civilizations |
| 79 | Creative Arts | Creative Arts & Art Forms |
| 81 | Theatre & Performing Arts | Traditional Performing Arts |
| 84 | Collectibles & Antiques | Collecting & Antiques |
| 87 | How Things Work | Explainer Formats — How & Why |
| 89 | Inventions & Inventors | Scientists, Inventors & Discoverers |
| 93 | Agriculture & Farming | Agriculture & Farming Systems |
| 102 | Communication | Communication & Professional Skills |
| 103 | Leadership & Management | Leadership, Management & Workplace |
| 107 | Retail & E-commerce | Retail, E-Commerce & Trade |
| 110 | Transportation | Transportation Systems |
| 112 | Real Estate | Real Estate & Property |
| 113 | Energy & Power | Energy & Power Systems |
| 115 | Forests & Ecology | Forests, Ecology & Ecosystems |
| 116 | Mountains | Mountains & Polar Worlds |
| 119 | Mathematics | Mathematics & Numbers |
| 120 | Logic & Critical Thinking | Thinking & Media Skills |
| 122 | Journalism & Media History | Media History & Journalism |
| 128 | Virtual Reality / AR | Immersive & Virtual Worlds |
| 129 | Internet History | Internet & Web |
| 133 | Board Games & Tabletop | Board Games, Chess & Tabletop |
| 139 | Motorcycles | Motorcycles, Bicycles & Two-Wheelers |
| 140 | Sailing & Yachting | Sailing & Boating |
| 142 | Primitive Technology | Primitive Technology & Bushcraft |
| 143 | Living History | Living History & Reenactment |
| 144 | History of Education | Education Systems & Student Life |
| 146 | Famous People | Famous People & Biography Storytelling |
| 149 | Global Cultures | World Cultures & Traditions |
| 151 | Islands | Islands & Island Nations |
| 152 | Volcanoes | Volcanoes, Caves & Extreme Landforms |
| 154 | Microbiology | Microbiology & Biotechnology |
| 156 | Chemistry in Everyday Life | Chemistry & Materials |
| 162 | Engineering Failures | Engineering Failures & Lessons |
| 166 | Future Predictions | Future Predictions & Scenarios |
| 168 | Sociology | Society & Sociology |
| 174 | Aging & Generations | Life Stages & Generations |
| 180 | Healthcare Systems | Healthcare Systems & Emergency Services |
| 187 | Outdoor Life | Outdoor Life & Adventure Skills |
| 193 | Insects | Insects, Arachnids & Small Creatures |
| 195 | Reptiles | Reptiles & Amphibians |
| 198 | Marine Life | Marine Life & Ocean Creatures |
| 200 | Botany | Plants, Trees & Fungi |
| 210 | Rivers | Rivers, Coasts & Waterfalls |
| 215 | Extreme Weather | Weather & Atmosphere |
| 219 | Indian Geography | Indian Geography & Places |
| 222 | Temple Tourism | India Travel & Heritage Tourism |
| 225 | Desert Travel | Travel by Landscape |
| 227 | Train Travel | Journeys & Travel Modes |
| 229 | Hotel Stories | Hotels, Resorts & Hospitality |
| 232 | Travel Hacks | Travel Skills & Systems |
| 235 | Borders | Borders, Territories & Microstates |
| 242 | National Parks | National Parks & Protected Places |
| 256 | Classical Music | Classical & Traditional Music |
| 268 | Hindu Philosophy | Hindu Philosophy & Sacred Texts |
| 293 | Banking | Banking & Money Systems |
| 296 | Cryptocurrency | Crypto & Digital Money |
| 299 | Economic Crises | Economic Crises & Economics Explained |
| 300 | Stock Market History | Markets & Investing |
| 301 | Corporate Empires | Corporate Empires & Company Stories |
| 305 | Brands | Brands & Products |
| 316 | Auctions | Auctions & Luxury Markets |
| 317 | Philanthropy | Philanthropy & Social Good |
| 319 | Mobile Technology | Internet & Connectivity Tech |
| 322 | Cloud Computing | Computing Infrastructure & Software Systems |
| 326 | Cybersecurity | Cybersecurity, Privacy & Digital Safety |
| 330 | Robotics | Robotics & Drones |
| 333 | Brain-Computer Interfaces | Neurotech & Human-Computer Interaction |
| 337 | AI Research | AI Systems & Research |
| 350 | Biology | Biology & Life Science |
| 351 | Neuroscience | Brain, Mind & Cognitive Science |
| 368 | Cinema | Cinema & Film Craft |
| 373 | Fantasy | Fantasy Worlds & Worldbuilding |
| 376 | Mystery Fiction | Mystery & Thriller Fiction |
| 379 | Animation | Animation & Cartoon Craft |
| 383 | Web Series | Series, Web & Short Formats |
| 385 | Circus History | Circus, Magic & Live Entertainment |
| 408 | Toys | Toys, Models & Miniatures |
| 413 | Astronomy Hobby | Hobby Science & Collecting Pursuits |
| 423 | Rocket Engineering | Rocket & Space Engineering |
| 424 | Shipbuilding | Shipbuilding & Maritime Engineering |
| 453 | Study Skills | Study Skills & Learning Methods |
| 468 | AI Civilization | Future Civilization & AI Society |
| 470 | Transhumanism | Transhumanism & Life Futures |
| 485 | Autonomous Industry | Autonomous & Future Living Systems |
| 493 | Personal Security | Safety & Security Awareness |
| 496 | Scam Awareness | Scams & Fraud Stories |
| 499 | Insurance Education | Insurance, Retirement & Protection |
| 501 | Public Health | Public Health & Healthy Communities |
| 505 | Nutrition Science | Nutrition & Food Science |
| 507 | Water & Sanitation | Water, Sanitation & Waste |
| 515 | Internet Governance | Internet & Digital Governance |
| 516 | Labor Rights | Work, Rights & Labour |
| 521 | Soil Science | Soil Science & Eco Systems |
| 522 | Air Quality | Air Quality & Environment Health |
| 526 | Indigenous Histories | Peoples & Social Histories |
| 528 | Libraries & Archives | Libraries, Archives & Knowledge Systems |
| 534 | SaaS Businesses | Digital Business & Creator Economy |
| 538 | Sleep Science | Sleep & Exercise Science |
| 544 | Ancient Egypt | Ancient Civilizations of the World |
| 548 | Graphic Design & Visual Communication | Visual Art, Design & Photography |

## Unresolved issues
- None blocking. The 17,069 angles are title-only until an admin completes their structured fields (Admin angle editor); runs treat title-only angles via the story-question path (Web §4 / API Step 7 rules).
