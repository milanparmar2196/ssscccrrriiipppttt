# Taxonomy ID Mapping — Clean Split (2026-10-27)

Produced under the user's clean-split decision. Every niche and sub-niche in `docs/seeds/taxonomy_seed.json` now carries a unique, stable `id`; the original number from the user's 550 list is preserved on each record as `legacyId` metadata. Records not listed here are unchanged (`id` = their unique legacy number).

**Status: APPROVED — taxonomy seed sign-off CLOSED by the user on 2026-10-27.**

## Rules applied
- Legacy 443 named two distinct niches: the first-listed retains **443**; the second receives **551** — verified unused across all niche, sub-niche, NEW and reserved records before allocation ( legacy numbers in use: 1–550; max 550).
- The 35 sub-niches sharing their parent niche's number were reviewed one by one: **none is a reference to its parent** (every sub-niche name differs from its parent's and denotes distinct content), so each is a distinct sub-niche and received a fresh ID; `legacyId` and the parent link are preserved. No content was merged based on the ID alone.
- Niches/sub-niches with no legacy number received fresh IDs.
- **Lookup rule:** a lookup by `legacyId` returns ALL matching records and flags the ambiguity; it never silently picks one. Callers must use the unique `id` (recorded in docs/SEED_DATA.md).
- Validation after allocation: **637 records, 637 unique ids, all 550 legacy numbers still present as `legacyId`**, parent links intact.
- Ambiguity flags: none among the 35 (all clearly distinct). One seed inconsistency noted for the record: two niches with no legacy number (Martial Arts & Traditional Sports; Fashion & Clothing Design) were not flagged `isNew` in the seed although they come from the v1 list, not the user's 550 — they are treated identically to the other no-legacy niches below.

## 1. The 443 split (1 change)

| Legacy ID | New unique ID | Name | Parent / Category | Reason |
|---|---|---|---|---|
| 443 | 551 | General Knowledge | facts_lists_records | Second distinct niche sharing legacy 443 — first-listed niche retains 443; this niche receives the first fresh ID (551 verified unused across all niche, sub-niche, NEW and reserved records) |

## 2. Niches with no legacy number (7)

| Legacy ID | New unique ID | Name | Parent / Category | Reason |
|---|---|---|---|---|
| — | 552 | Medical Conditions Explained — information only | health_wellness_ayurveda | Niche has no legacy number (from the v1 list / added in the merge, not in the user's 550); fresh ID |
| — | 553 | Bedtime Stories | stories_fiction_fantasy | Niche has no legacy number (from the v1 list / added in the merge, not in the user's 550); fresh ID |
| — | 554 | Astrology, Numerology & Vastu — belief content, labelled | religion_philosophy_spirituality | Niche has no legacy number (from the v1 list / added in the merge, not in the user's 550); fresh ID |
| — | 555 | Competitive Exam Prep | education_learning | Niche has no legacy number (from the v1 list / added in the merge, not in the user's 550); fresh ID |
| — | 556 | Martial Arts & Traditional Sports | sports_games_play | Niche has no legacy number (from the v1 list / added in the merge, not in the user's 550); fresh ID |
| — | 557 | Fashion & Clothing Design | culture_arts_crafts | Niche has no legacy number (from the v1 list / added in the merge, not in the user's 550); fresh ID |
| — | 558 | Kids Learning | kids_family_parenting | Niche has no legacy number (from the v1 list / added in the merge, not in the user's 550); fresh ID |

## 3. Sub-niches that shared their parent's number (35)

| Legacy ID | New unique ID | Name | Parent / Category | Reason |
|---|---|---|---|---|
| 544 | 559 | Ancient Egypt | Ancient Civilizations of the World | Distinct sub-niche sharing its parent niche's legacy number (names reviewed: not a reference to the parent — a separate sub-niche); fresh ID, legacyId preserved, parent link kept |
| 526 | 560 | Indigenous Histories | Peoples & Social Histories | Distinct sub-niche sharing its parent niche's legacy number (names reviewed: not a reference to the parent — a separate sub-niche); fresh ID, legacyId preserved, parent link kept |
| 215 | 561 | Extreme Weather | Weather & Atmosphere | Distinct sub-niche sharing its parent niche's legacy number (names reviewed: not a reference to the parent — a separate sub-niche); fresh ID, legacyId preserved, parent link kept |
| 156 | 562 | Chemistry in Everyday Life | Chemistry & Materials | Distinct sub-niche sharing its parent niche's legacy number (names reviewed: not a reference to the parent — a separate sub-niche); fresh ID, legacyId preserved, parent link kept |
| 89 | 563 | Inventions & Inventors | Scientists, Inventors & Discoverers | Distinct sub-niche sharing its parent niche's legacy number (names reviewed: not a reference to the parent — a separate sub-niche); fresh ID, legacyId preserved, parent link kept |
| 505 | 564 | Nutrition Science | Nutrition & Food Science | Distinct sub-niche sharing its parent niche's legacy number (names reviewed: not a reference to the parent — a separate sub-niche); fresh ID, legacyId preserved, parent link kept |
| 538 | 565 | Sleep Science | Sleep & Exercise Science | Distinct sub-niche sharing its parent niche's legacy number (names reviewed: not a reference to the parent — a separate sub-niche); fresh ID, legacyId preserved, parent link kept |
| 300 | 566 | Stock Market History | Markets & Investing | Distinct sub-niche sharing its parent niche's legacy number (names reviewed: not a reference to the parent — a separate sub-niche); fresh ID, legacyId preserved, parent link kept |
| 499 | 567 | Insurance Education | Insurance, Retirement & Protection | Distinct sub-niche sharing its parent niche's legacy number (names reviewed: not a reference to the parent — a separate sub-niche); fresh ID, legacyId preserved, parent link kept |
| 337 | 568 | AI Research | AI Systems & Research | Distinct sub-niche sharing its parent niche's legacy number (names reviewed: not a reference to the parent — a separate sub-niche); fresh ID, legacyId preserved, parent link kept |
| 19 | 569 | AI Cinematic Short Films | AI Creativity & Media | Distinct sub-niche sharing its parent niche's legacy number (names reviewed: not a reference to the parent — a separate sub-niche); fresh ID, legacyId preserved, parent link kept |
| 129 | 570 | Internet History | Internet & Web | Distinct sub-niche sharing its parent niche's legacy number (names reviewed: not a reference to the parent — a separate sub-niche); fresh ID, legacyId preserved, parent link kept |
| 319 | 571 | Mobile Technology | Internet & Connectivity Tech | Distinct sub-niche sharing its parent niche's legacy number (names reviewed: not a reference to the parent — a separate sub-niche); fresh ID, legacyId preserved, parent link kept |
| 322 | 572 | Cloud Computing | Computing Infrastructure & Software Systems | Distinct sub-niche sharing its parent niche's legacy number (names reviewed: not a reference to the parent — a separate sub-niche); fresh ID, legacyId preserved, parent link kept |
| 333 | 573 | Brain-Computer Interfaces | Neurotech & Human-Computer Interaction | Distinct sub-niche sharing its parent niche's legacy number (names reviewed: not a reference to the parent — a separate sub-niche); fresh ID, legacyId preserved, parent link kept |
| 128 | 574 | Virtual Reality / AR | Immersive & Virtual Worlds | Distinct sub-niche sharing its parent niche's legacy number (names reviewed: not a reference to the parent — a separate sub-niche); fresh ID, legacyId preserved, parent link kept |
| 534 | 575 | SaaS Businesses | Digital Business & Creator Economy | Distinct sub-niche sharing its parent niche's legacy number (names reviewed: not a reference to the parent — a separate sub-niche); fresh ID, legacyId preserved, parent link kept |
| 16 | 576 | Motivational Stories | Inspirational & Human Stories | Distinct sub-niche sharing its parent niche's legacy number (names reviewed: not a reference to the parent — a separate sub-niche); fresh ID, legacyId preserved, parent link kept |
| 120 | 577 | Logic & Critical Thinking | Thinking & Media Skills | Distinct sub-niche sharing its parent niche's legacy number (names reviewed: not a reference to the parent — a separate sub-niche); fresh ID, legacyId preserved, parent link kept |
| 144 | 578 | History of Education | Education Systems & Student Life | Distinct sub-niche sharing its parent niche's legacy number (names reviewed: not a reference to the parent — a separate sub-niche); fresh ID, legacyId preserved, parent link kept |
| 351 | 579 | Neuroscience | Brain, Mind & Cognitive Science | Distinct sub-niche sharing its parent niche's legacy number (names reviewed: not a reference to the parent — a separate sub-niche); fresh ID, legacyId preserved, parent link kept |
| 174 | 580 | Aging & Generations | Life Stages & Generations | Distinct sub-niche sharing its parent niche's legacy number (names reviewed: not a reference to the parent — a separate sub-niche); fresh ID, legacyId preserved, parent link kept |
| 200 | 581 | Botany | Plants, Trees & Fungi | Distinct sub-niche sharing its parent niche's legacy number (names reviewed: not a reference to the parent — a separate sub-niche); fresh ID, legacyId preserved, parent link kept |
| 548 | 582 | Graphic Design & Visual Communication | Visual Art, Design & Photography | Distinct sub-niche sharing its parent niche's legacy number (names reviewed: not a reference to the parent — a separate sub-niche); fresh ID, legacyId preserved, parent link kept |
| 81 | 583 | Theatre & Performing Arts | Traditional Performing Arts | Distinct sub-niche sharing its parent niche's legacy number (names reviewed: not a reference to the parent — a separate sub-niche); fresh ID, legacyId preserved, parent link kept |
| 149 | 584 | Global Cultures | World Cultures & Traditions | Distinct sub-niche sharing its parent niche's legacy number (names reviewed: not a reference to the parent — a separate sub-niche); fresh ID, legacyId preserved, parent link kept |
| 413 | 585 | Astronomy Hobby | Hobby Science & Collecting Pursuits | Distinct sub-niche sharing its parent niche's legacy number (names reviewed: not a reference to the parent — a separate sub-niche); fresh ID, legacyId preserved, parent link kept |
| 222 | 586 | Temple Tourism | India Travel & Heritage Tourism | Distinct sub-niche sharing its parent niche's legacy number (names reviewed: not a reference to the parent — a separate sub-niche); fresh ID, legacyId preserved, parent link kept |
| 225 | 587 | Desert Travel | Travel by Landscape | Distinct sub-niche sharing its parent niche's legacy number (names reviewed: not a reference to the parent — a separate sub-niche); fresh ID, legacyId preserved, parent link kept |
| 227 | 588 | Train Travel | Journeys & Travel Modes | Distinct sub-niche sharing its parent niche's legacy number (names reviewed: not a reference to the parent — a separate sub-niche); fresh ID, legacyId preserved, parent link kept |
| 232 | 589 | Travel Hacks | Travel Skills & Systems | Distinct sub-niche sharing its parent niche's legacy number (names reviewed: not a reference to the parent — a separate sub-niche); fresh ID, legacyId preserved, parent link kept |
| 139 | 590 | Motorcycles | Motorcycles, Bicycles & Two-Wheelers | Distinct sub-niche sharing its parent niche's legacy number (names reviewed: not a reference to the parent — a separate sub-niche); fresh ID, legacyId preserved, parent link kept |
| 493 | 591 | Personal Security | Safety & Security Awareness | Distinct sub-niche sharing its parent niche's legacy number (names reviewed: not a reference to the parent — a separate sub-niche); fresh ID, legacyId preserved, parent link kept |
| 485 | 592 | Autonomous Industry | Autonomous & Future Living Systems | Distinct sub-niche sharing its parent niche's legacy number (names reviewed: not a reference to the parent — a separate sub-niche); fresh ID, legacyId preserved, parent link kept |
| 87 | 593 | How Things Work | Explainer Formats — How & Why | Distinct sub-niche sharing its parent niche's legacy number (names reviewed: not a reference to the parent — a separate sub-niche); fresh ID, legacyId preserved, parent link kept |

## 4. Sub-niches with no legacy number (44)

| Legacy ID | New unique ID | Name | Parent / Category | Reason |
|---|---|---|---|---|
| — | 594 | Indus Valley | Ancient India / Civilization | Sub-niche had no legacy number in the source; fresh ID |
| — | 595 | Vedic age | Ancient India / Civilization | Sub-niche had no legacy number in the source; fresh ID |
| — | 596 | Maurya/Gupta worlds | Ancient India / Civilization | Sub-niche had no legacy number in the source; fresh ID |
| — | 597 | Maya | Ancient Civilizations of the World | Sub-niche had no legacy number in the source; fresh ID |
| — | 598 | Aztec | Ancient Civilizations of the World | Sub-niche had no legacy number in the source; fresh ID |
| — | 599 | Rome | Ancient Civilizations of the World | Sub-niche had no legacy number in the source; fresh ID |
| — | 600 | Greece | Ancient Civilizations of the World | Sub-niche had no legacy number in the source; fresh ID |
| — | 601 | Indian kings | Kings, Royalty & Dynasties | Sub-niche had no legacy number in the source; fresh ID |
| — | 602 | Mughal | Kings, Royalty & Dynasties | Sub-niche had no legacy number in the source; fresh ID |
| — | 603 | Maratha | Kings, Royalty & Dynasties | Sub-niche had no legacy number in the source; fresh ID |
| — | 604 | Roman emperors | Kings, Royalty & Dynasties | Sub-niche had no legacy number in the source; fresh ID |
| — | 605 | Ottoman | Kings, Royalty & Dynasties | Sub-niche had no legacy number in the source; fresh ID |
| — | 606 | British monarchy | Kings, Royalty & Dynasties | Sub-niche had no legacy number in the source; fresh ID |
| — | 607 | Famous battles | Military History | Sub-niche had no legacy number in the source; fresh ID |
| — | 608 | World wars | Military History | Sub-niche had no legacy number in the source; fresh ID |
| — | 609 | War strategy | Military History | Sub-niche had no legacy number in the source; fresh ID |
| — | 610 | Explorers | Famous People & Biography Storytelling | Sub-niche had no legacy number in the source; fresh ID |
| — | 611 | Warriors | Famous People & Biography Storytelling | Sub-niche had no legacy number in the source; fresh ID |
| — | 612 | Leaders | Famous People & Biography Storytelling | Sub-niche had no legacy number in the source; fresh ID |
| — | 613 | Country facts & comparisons | World Geography | Sub-niche had no legacy number in the source; fresh ID |
| — | 614 | Dosha concepts | Ayurveda | Sub-niche had no legacy number in the source; fresh ID |
| — | 615 | Classical remedies — traditional-use framing | Ayurveda | Sub-niche had no legacy number in the source; fresh ID |
| — | 616 | Condition explainers | Medical Conditions Explained — information only | Sub-niche had no legacy number in the source; fresh ID |
| — | 617 | Symptoms awareness — never diagnosis/treatment | Medical Conditions Explained — information only | Sub-niche had no legacy number in the source; fresh ID |
| — | 618 | Saving | Personal Finance | Sub-niche had no legacy number in the source; fresh ID |
| — | 619 | Budgeting | Personal Finance | Sub-niche had no legacy number in the source; fresh ID |
| — | 620 | Loans | Personal Finance | Sub-niche had no legacy number in the source; fresh ID |
| — | 621 | Tax basics India | Personal Finance | Sub-niche had no legacy number in the source; fresh ID |
| — | 622 | Mutual funds | Markets & Investing | Sub-niche had no legacy number in the source; fresh ID |
| — | 623 | Market events | Markets & Investing | Sub-niche had no legacy number in the source; fresh ID |
| — | 624 | Stoicism | Consciousness & Philosophy | Sub-niche had no legacy number in the source; fresh ID |
| — | 625 | Ethics | Consciousness & Philosophy | Sub-niche had no legacy number in the source; fresh ID |
| — | 626 | Big questions | Consciousness & Philosophy | Sub-niche had no legacy number in the source; fresh ID |
| — | 627 | UPSC | Competitive Exam Prep | Sub-niche had no legacy number in the source; fresh ID |
| — | 628 | SSC | Competitive Exam Prep | Sub-niche had no legacy number in the source; fresh ID |
| — | 629 | Banking | Competitive Exam Prep | Sub-niche had no legacy number in the source; fresh ID |
| — | 630 | Railways | Competitive Exam Prep | Sub-niche had no legacy number in the source; fresh ID |
| — | 631 | State exams | Competitive Exam Prep | Sub-niche had no legacy number in the source; fresh ID |
| — | 632 | Habit systems | Productivity & Self-Improvement | Sub-niche had no legacy number in the source; fresh ID |
| — | 633 | Focus methods | Productivity & Self-Improvement | Sub-niche had no legacy number in the source; fresh ID |
| — | 634 | Esports stories | Gaming Stories & Lore | Sub-niche had no legacy number in the source; fresh ID |
| — | 635 | Animals for kids | Kids Learning | Sub-niche had no legacy number in the source; fresh ID |
| — | 636 | Science for kids | Kids Learning | Sub-niche had no legacy number in the source; fresh ID |
| — | 637 | GK for kids | Kids Learning | Sub-niche had no legacy number in the source; fresh ID |
