# Merged Niche List v2 — Final Seed Taxonomy (2026-10-27)

Merge of: user's `Niche_Names_Only.txt` (550 numbered niches) + Section 51
list (21 categories / 120 niches). This file supersedes NICHE_LIST.md v1.

Rules applied:
- **Every legacy ID (001–550) is preserved** and appears **once as a
  primary placement** — as a niche, or demoted to sub-niche where the
  entry was actually a topic/subject at niche level. (IDs may
  additionally be *mentioned* in the Merge Log, cross-references and
  sub-niche lists; primary placement is what is unique. Known
  source-data exceptions — legacy ID 443 naming two different niches
  and 35 IDs shared by a niche and its own sub-niche in the user's
  original file — are recorded in docs/seeds/VALIDATION_REPORT.md
  and await the user's taxonomy decision; they are not silently
  "fixed" here.)
- Semantic duplicates are merged: the surviving entry keeps its ID, the
  merged ID is recorded in the Merge Log at the end (still searchable).
- Niches our list had that the 550 lacked are marked `[NEW]` (no legacy
  ID; they get fresh IDs in Admin).
- Each category carries an **Entity Focus** tag — input to the Registry
  Map (next step). Sub-niche examples in (brackets) are unnumbered
  additions from the Section 51 list.
- Still seed data, fully dynamic in Admin — not a cap.

Format per line: **Niche [legacy ID]** — subs: Name [ID], Name [ID] …


**Category keys (A6, 2026-10-27):** every category has a **stable `categoryKey`**.
Display names above are canonical and may be edited in Admin; the key never
changes, and every mapping (Registry Map, Visual Style System, question
packs, source library tags) references the **key**, never the name string.

| # | Category (canonical name) | categoryKey |
|---|---|---|
| 1 | History & Heritage | `history_heritage` |
| 2 | Geography, Places & Maps | `geography_places_maps` |
| 3 | Science, Space & Earth | `science_space_earth` |
| 4 | Health, Wellness & Ayurveda | `health_wellness_ayurveda` |
| 5 | Finance, Business & Economics | `finance_business_economics` |
| 6 | Technology, AI & Digital Life | `technology_ai_digital` |
| 7 | Crime, Mystery & Investigations | `crime_mystery_investigations` |
| 8 | Stories, Fiction & Fantasy Worlds | `stories_fiction_fantasy` |
| 9 | Religion, Philosophy & Spirituality | `religion_philosophy_spirituality` |
| 10 | Education & Learning | `education_learning` |
| 11 | Careers, Jobs & Professional Skills | `careers_jobs_skills` |
| 12 | Psychology, Mind & Relationships | `psychology_mind_relationships` |
| 13 | Animals, Nature & Environment | `animals_nature_environment` |
| 14 | Sports, Games & Play | `sports_games_play` |
| 15 | Film, Entertainment & Media | `film_entertainment_media` |
| 16 | Food, Cooking & Farming | `food_cooking_farming` |
| 17 | Culture, Arts & Traditional Crafts | `culture_arts_crafts` |
| 18 | Home, DIY, Making & Hobbies | `home_diy_hobbies` |
| 19 | Travel, Outdoors, Adventure & Survival | `travel_outdoors_adventure` |
| 20 | Machines, Transport & Engineering | `machines_transport_engineering` |
| 21 | Politics, Law, Society & Public Systems | `politics_law_society` |
| 22 | Luxury, Lifestyle & Living | `luxury_lifestyle_living` |
| 23 | Future & Speculative Civilization | `future_speculative` |
| 24 | Kids, Family & Parenting | `kids_family_parenting` |
| 25 | Facts, Lists, Records & Explainer Formats | `facts_lists_records` |

---

## 1. History & Heritage — focus: PERSON / EVENT / PLACE
- **History / Mystery Documentary [002]**
- **Ancient India / Civilization [003]** — subs: Indus Valley, Vedic age, Maurya/Gupta worlds
- **Ancient Civilizations of the World [544]** — subs: Ancient Egypt [544], Mesopotamian Civilizations [545], Nomadic Civilizations [150], (Maya, Aztec, Rome, Greece)
- **Kings, Royalty & Dynasties [036]** — subs: (Indian kings, Mughal, Maratha, Roman emperors, Ottoman, British monarchy)
- **Military History [035]** — subs: (Famous battles, World wars, War strategy)
- **Ancient Technology / Lost Knowledge [013]**
- **Castles, Forts & Palaces [037]** (PLACE registry)
- **Archaeology [039]**
- **Ancient Manuscripts & Books [040]**
- **Pirates & Outlaws [049]**
- **Famous People & Biography Storytelling [146]** — subs: Biography Storytelling [147], (Explorers, Warriors, Leaders)
- **Living History & Reenactment [143]**
- **Peoples & Social Histories [526]** — subs: Indigenous Histories [526], Oral History [527], Family History [173], Childhood History [175], Women's History [177], Men's History [178], Disability History [179]

## 2. Geography, Places & Maps — focus: PLACE
- **World Geography [218]** — subs: Geography Learning [446], Flags [447], Capitals [448], (Country facts & comparisons)
- **Indian Geography & Places [219]** — subs: Indian Cities [220], Indian Villages [221]
- **Maps & Geography Mysteries [038]**
- **Cities & Urbanism [111]**
- **Mountains & Polar Worlds [116]** — subs: Ice & Polar Worlds [153], Glaciers [213], Snow & Ice [214]
- **Rivers, Coasts & Waterfalls [210]** — subs: Waterfalls [211], Beaches [212]
- **Volcanoes, Caves & Extreme Landforms [152]** — subs: Caves [241]
- **Islands & Island Nations [151]**
- **Borders, Territories & Microstates [235]** — subs: Territories [236], Microstates [237], Unrecognized Countries [238], Enclaves & Exclaves [239]
- **National Parks & Protected Places [242]**

## 3. Science, Space & Earth — focus: SUBJECT / CONCEPT
- **Science & Big Questions [006]** — subs: Unsolved Science [367]
- **Space & Universe [012]** — subs: Astronomy [344], Planetary Science [345], Moon Science [346], Solar Science [347]
- **Space Exploration & Missions [032]**
- **Satellites & Earth Observation [159]**
- **Physics [343]** — subs: Thermodynamics [360], Magnetism [358], Time & Reality [055]
- **Electricity & Electronics [161]** — subs: Electricity [359]
- **Earth Science [348]** — subs: Geology [356], Gemology [357], Climate Science [361], Oceanography [362]
- **Weather & Atmosphere [215]** — subs: Extreme Weather [215], Lightning [216], Clouds & Atmosphere [217]
- **Earth & Natural Mysteries [030]**
- **Biology & Life Science [350]** — subs: Evolution [354], Paleontology [355]
- **Genetics & Evolution [027]**
- **Dinosaurs & Prehistoric World [029]**
- **Chemistry & Materials [156]** — subs: Chemistry in Everyday Life [156], Chemistry [349], Materials Science [157], Materials Engineering [442]
- **Microbiology & Biotechnology [154]** — subs: Biotechnology [155], Digital Biology [336]
- **Scientists, Inventors & Discoverers [089]** — subs: Inventions & Inventors [089], Scientists & Discoverers [118]
- **Mathematics & Numbers [119]** — subs: Geometry [364], Number Theory [365], Infinity [366], Statistics & Data [121]
- **Ocean & Deep Sea (science) [028]**

## 4. Health, Wellness & Ayurveda — focus: SUBJECT (safety-critical)
- **Health & Wellness Education [015]**
- **Ayurveda [281]** — subs: (Dosha concepts, Classical remedies — traditional-use framing)
- **Yoga & Wellness [077]** — subs: Yoga [280] (merged), Pranayama [279]
- **Medical & Human Body Science [026]** — subs: Human Anatomy [352], Disease Science [353]
- **Medical Conditions Explained — information only [NEW]** — subs: (Condition explainers, Symptoms awareness — never diagnosis/treatment)
- **Nutrition & Food Science [505]** — subs: Nutrition Science [505]
- **Sleep & Exercise Science [538]** — subs: Sleep Science [538], Exercise Science [539]
- **Public Health & Healthy Communities [501]** — subs: Rehabilitation [502], Assistive Technology [503], Maternal & Child Health [504]

## 5. Finance, Business & Economics — focus: SUBJECT / ORGANISATION / PERSON
- **Personal Finance [008]** — subs: (Saving, Budgeting, Loans, Tax basics India)
- **Banking & Money Systems [293]** — subs: Credit Cards [294], Money History [295], Central Banking [298], Currency [312], Tax History [314]
- **Markets & Investing [300]** — subs: Stock Market History [300], (Mutual funds, Market events)
- **Crypto & Digital Money [296]** — subs: Blockchain [297]
- **Economic Crises & Economics Explained [299]** — subs: Global Economy [311], Wealth History [315]
- **Corporate Empires & Company Stories [301]** — subs: Entrepreneurship [302], Startups [303], Unicorn Companies [304]
- **Brands & Products [305]** — subs: Products [306]
- **Marketing & Advertising [106]** — subs: Consumer Psychology [105], Advertising [307]
- **Retail, E-Commerce & Trade [107]** — subs: E-Commerce [308], Retail [309], Global Trade [310], Logistics & Supply Chain [108]
- **Leadership, Management & Workplace [103]** — subs: Corporate & Workplace [104]
- **Real Estate & Property [112]** — subs: Real Estate Economics [313], Housing & Tenancy [506]
- **Insurance, Retirement & Protection [499]** — subs: Insurance Education [499], Retirement Education [500]


## 6. Technology, AI & Digital Life — focus: SUBJECT / PRODUCT / ORGANISATION
- **AI + Technology Explainers [001]**
- **AI Tools / AI Tutorials [007]**
- **AI Systems & Research [337]** — subs: AI Research [337], Developer AI [338], AI Software Agents [531], Large Language Model Systems [532], No-Code & Low-Code Development [533]
- **AI Creativity & Media [019]** — subs: AI Cinematic Short Films [019], Generative Art [339], AI Music [340], AI Voice [341], AI Filmmaking [342]
- **Internet & Web [129]** — subs: Internet History [129], Internet [318] (merged)
- **Internet & Connectivity Tech [319]** — subs: Mobile Technology [319], 5G / 6G [320], Satellite Internet [321]
- **Computing Infrastructure & Software Systems [322]** — subs: Cloud Computing [322], Databases [323], Data Centers & Infrastructure [160], Semiconductors [511], Quantum Computing [512], Open-Source Software [514]
- **Software & Programming [061]** — subs: Programming [324], Software Engineering [325], Computer & PC [062]
- **Consumer Technology [063]**
- **Cybersecurity, Privacy & Digital Safety [326]** — subs: Privacy [327], Digital Forensics [328], Malware [329]
- **Robotics & Drones [330]** — subs: Humanoid Robots [331], Drones [332]
- **Neurotech & Human-Computer Interaction [333]** — subs: Brain-Computer Interfaces [333], Human-Computer Interaction [513]
- **Immersive & Virtual Worlds [128]** — subs: Virtual Reality / AR [128], Virtual Worlds [334], Digital Humans [335]
- **Digital Business & Creator Economy [534]** — subs: SaaS Businesses [534], Creator Economy [535], Search Engine Optimization [536]

## 7. Crime, Mystery & Investigations — focus: EVENT / PERSON
- **True Crime Documentary [010]**
- **Forensics & Investigation [100]**
- **Intelligence & Espionage [099]**
- **Secret Societies [057]**
- **UFO / Extraterrestrial (events & cases) [033]**
- **Internet Mysteries [130]**
- **Scams & Fraud Stories [496]** — primary (and only) placement of ID 496; the §21 Safety niche covers the awareness angle as its own niche WITHOUT reusing this ID (corrected note — an earlier draft wrongly implied a second [496] placement)

## 8. Stories, Fiction & Fantasy Worlds — focus: STORY
- **Horror / Mystery Stories [011]** — subs: Horror Fiction [375]
- **Mystery & Thriller Fiction [376]**
- **Romance Stories [377]**
- **Comedy Stories [378]**
- **Fantasy Worlds & Worldbuilding [373]** — subs: Science Fiction [374], Worldbuilding [381], Fictional Geography [382]
- **Folklore & Legends [058]**
- **Mythical Creatures [059]**
- **Symbols & Hidden Meanings [060]**
- **Inspirational & Human Stories [016]** — subs: Motivational Stories [016], Humanitarian Stories [148]
- **Bedtime Stories [NEW]**

## 9. Religion, Philosophy & Spirituality — focus: CONCEPT / PERSON / PLACE
- **Sanatan / Hindu Mythology [004]**
- **Hindu Philosophy & Sacred Texts [268]** — subs: Vedas [269], Upanishads [270], Bhagavad Gita [271], Puranas [272], Shaivism [273], Vaishnavism [274], Shaktism [275], Temple Traditions [276], Mantra [277], Ramayana [540], Mahabharata [541], Hindu Festivals & Vrat [542], Bhakti Literature & Devotional Poetry [543]
- **Mythological Animation [018]**
- **World Religions & Civilizations [076]** — subs: Buddhist Philosophy [282], Judaism History [283], Christianity History [284], Islamic History [285], Sikh History [286], Jainism [287], Zoroastrianism [288], Ancient Religions [289], Mythology Comparison [290], Cosmology & Creation [291]
- **Spirituality & Meditation [023]** — subs: Meditation [278], Consciousness & Spirituality [292]
- **Consciousness & Philosophy [054]** — subs: (Stoicism, Ethics, Big questions)
- **Pilgrimage & Sacred Places [075]** — subs: Pilgrimage Travel [223], Sacred Geography [240]
- **Astrology, Numerology & Vastu — belief content, labelled [NEW]**

## 10. Education & Learning — focus: SUBJECT
- **Education [069]**
- **General Knowledge & Exams Foundation [443]** — cross-ref §25 for quiz/trivia formats
- **Competitive Exam Prep [NEW]** — subs: (UPSC, SSC, Banking, Railways, State exams)
- **Languages & Linguistics [041]** — subs: Language Learning [449], Sanskrit Learning [450], Translation [529]
- **Thinking & Media Skills [120]** — subs: Logic & Critical Thinking [120], Media Literacy [530]
- **Study Skills & Learning Methods [453]**
- **Education Systems & Student Life [144]** — subs: History of Education [144], School & University Stories [145], Student Life [454]
- **Libraries, Archives & Knowledge Systems [528]**

## 11. Careers, Jobs & Professional Skills — focus: SUBJECT / CONCEPT
- **Career & Jobs [070]** — subs: Career Guidance [455], Freelancing [456], Remote Work [457], Digital Nomad [458], Future Jobs [459], AI Careers [460], Data Careers [462], Coding Education [463], Cloud Careers [464], Cybersecurity Careers [465], Science Careers [466], Creative Careers [467]
- **Communication & Professional Skills [102]** — subs: Professional Skills [461]
- **Productivity & Self-Improvement [071]** — subs: (Habit systems, Focus methods)

## 12. Psychology, Mind & Relationships — focus: CONCEPT
- **Psychology / Human Behavior [009]** — subs: Human Behavior [171] (merged)
- **Brain, Mind & Cognitive Science [351]** — subs: Neuroscience [351], Cognitive Science [363], Memory & Learning [101]
- **Relationships [072]** — subs: Human Relationships [170]
- **Mental Health Education [537]**
- **Life Stages & Generations [174]** — subs: Aging & Generations [174]

## 13. Animals, Nature & Environment — focus: CREATURE / PLACE
- **Wildlife & Animals [066]**
- **Nature Documentary [067]**
- **Pets [068]**
- **Marine Life & Ocean Creatures [198]** — subs: Marine Mammals [197], Coral Reefs [199]
- **Birds [196]**
- **Reptiles & Amphibians [195]**
- **Insects, Arachnids & Small Creatures [193]** — subs: Arachnids [194]
- **Plants, Trees & Fungi [200]** — subs: Botany [200], Flowers [201], Trees [202], Fungi [203], Plant Intelligence [204]
- **Forests, Ecology & Ecosystems [115]** — subs: Ecosystems [205], Deserts [206], Rainforests [207], Wetlands [208], Mangroves [209], Biodiversity Conservation [523]
- **Air Quality & Environment Health [522]**
- **Soil Science & Eco Systems [521]** — cross-ref §16 for farming systems

## 14. Sports, Games & Play — focus: PERSON / EVENT / WORK
- **Sports History [044]**
- **Cricket [546]**
- **Football / Soccer [547]**
- **Racing [045]**
- **Gaming Stories & Lore [025]** — subs: Game Development [131], Retro Gaming [132], (Esports stories)
- **Board Games, Chess & Tabletop [133]** — subs: Chess [134]
- **Martial Arts & Traditional Sports** — see §17 [253]/[252] (primary placement there)


## 15. Film, Entertainment & Media — focus: WORK / PERSON
- **Film & Entertainment Analysis [080]**
- **Cinema & Film Craft [368]** — subs: Acting [370], Screenwriting [371], Storytelling [372], Visual Effects [127], Video Editing & Post-Production [549]
- **Documentary Storytelling & Making [005]** — subs: Documentary Making [369]
- **Animation & Cartoon Craft [379]** — subs: Character Design [380]
- **Series, Web & Short Formats [383]** — subs: Short Films [384]
- **Books & Literature [078]** — subs: Literature [451], Writing [452]
- **Media History & Journalism [122]** — subs: Television History [123], Radio & Audio [124], Podcasting [125]
- **Music History & Artists [043]**
- **Music Production & Sound Design [550]**
- **Circus, Magic & Live Entertainment [385]** — subs: Theme Parks [386], Roller Coasters [387], Escape Rooms [388], Magic [389], Illusions [390], Card Magic [391], Stand-Up & Comedy History [392]

## 16. Food, Cooking & Farming — focus: SUBJECT / PLACE
- **Cooking & Culinary [091]**
- **Food / Cultural Stories [024]**
- **Beverage Culture [092]**
- **Agriculture & Farming Systems [093]** — subs: Food Systems [524], Sustainable Fisheries [525]

## 17. Culture, Arts & Traditional Crafts — focus: WORK / SUBJECT / PLACE
- **Art & Civilization [042]**
- **Creative Arts & Art Forms [079]**
- **Visual Art, Design & Photography [548]** — subs: Graphic Design & Visual Communication [548], Photography [126], Street Art [259]
- **Handicrafts & Traditional Skills [095]** — subs: Traditional Skills [141] (merged), Traditional Painting [258], Sculpture [260], Stone Carving [261], Wood Carving [262], Pottery [263], Textile History [264], Weaving [265], Embroidery [266], Basketry [267]
- **Traditional Performing Arts [081]** — subs: Theatre & Performing Arts [081], Folk Theatre [249], Dolls & Puppetry [250], Traditional Instruments [255], Classical Dance [257], Martial Arts History [253], Archery Culture [254]
- **Classical & Traditional Music [256]**
- **World Cultures & Traditions [149]** — subs: Global Cultures [149], Cultural Traditions [243], Festivals Around the World [244], Festival Origins [245], Wedding Culture [246], Traditional Clothing [247], Folk Traditions [248], Traditional Games [251], Traditional Sports [252], Youth Culture [176]
- **Rural Life & Village Culture [094]**
- **Museums & Cultural Heritage [096]**
- **Fashion & Clothing Design** — primary placement §22 [082]

## 18. Home, DIY, Making & Hobbies — focus: SUBJECT / PRODUCT
- **DIY & Making [085]** — subs: DIY [399] (merged), Woodworking [400], Metalworking [401], 3D Printing [402], Sewing [403], Knitting [404], Calligraphy [405], Handwriting [406], Origami [407]
- **Restoration [086]**
- **Repair & Maintenance [137]**
- **Home & Lifestyle [064]** — subs: Interior Design [393], Tiny Houses [395], Sustainable Living [396], Organization [397], Minimalism [398]
- **Gardening & Plants [065]** — subs: Home Gardening [394] (merged)
- **Collecting & Antiques [084]** — subs: Collecting [135], Toy Collecting [409]
- **Toys, Models & Miniatures [408]** — subs: Model Building [410], Miniatures [411], DIY Mini Worlds [412]
- **Hobby Science & Collecting Pursuits [413]** — subs: Astronomy Hobby [413], Amateur Science [414], Rockhounding [415], Fossil Hunting [416], Antique Hunting [417]

## 19. Travel, Outdoors, Adventure & Survival — focus: PLACE / EVENT
- **Travel / Hidden Places [020]**
- **Personal Travel [074]**
- **Exploration & Adventure [034]**
- **India Travel & Heritage Tourism [222]** — subs: Temple Tourism [222], Himalayan Travel [224]
- **Travel by Landscape [225]** — subs: Desert Travel [225], Island Travel [226]
- **Journeys & Travel Modes [227]** — subs: Train Travel [227], Road Trips [228]
- **Travel Skills & Systems [232]** — subs: Travel Hacks [232], Travel Systems [233]
- **Adventure & Extreme Sports [117]**
- **Outdoor Life & Adventure Skills [187]** — subs: Backpacking [188], Hiking [189], Camping [190], Fishing [191], Beekeeping [192]
- **Primitive Technology & Bushcraft [142]**
- **Treasure Hunting [050]**
- **Sailing & Boating [140]**
- **Disasters, Rescue & Survival Stories [046]** — subs: Rescue Stories [185], Survival Psychology [186]

## 20. Machines, Transport & Engineering — focus: PRODUCT / ORGANISATION
- **Cars & Automotive Stories [022]** — subs: Automotive Engineering [418], Supercars [419], Electric Vehicles [420], EV Battery Technology [421]
- **Motorcycles, Bicycles & Two-Wheelers [139]** — subs: Motorcycles [139], Bicycles & Cycling [138]
- **Railways & Trains [109]**
- **Transportation Systems [110]**
- **Aviation & Airports [047]** — subs: Aircraft Engineering [422], Airports [234]
- **Shipbuilding & Maritime Engineering [424]** — subs: Maritime [048]
- **Rocket & Space Engineering [423]**
- **Megastructures & Engineering [031]**
- **Architecture & Civil Infrastructure [052]** — subs: Metro Systems [425], Roads & Highways [426], Bridges [427], Tunnels [428], Construction [429], Skyscrapers [430]
- **Industry & Manufacturing [051]** — subs: Industrial Machines [431], Heavy Equipment [432], Mining [433], Gem Mining [434]
- **Energy & Power Systems [113]** — subs: Oil & Gas [435], Power Plants [436], Nuclear Engineering [437], Solar Technology [438], Wind Energy [439], Hydroelectricity [440], Fusion Energy [441], Batteries & Energy Storage [158]
- **Engineering Failures & Lessons [162]**


## 21. Politics, Law, Society & Public Systems — focus: EVENT / CONCEPT / ORGANISATION
- **Geopolitics / World History [014]**
- **Government & Public Systems [097]** — subs: Urban Climate Adaptation [509], Infrastructure Maintenance [510], Public Budgets [520]
- **Law & Justice [098]**
- **Society & Sociology [168]** — subs: Community Stories [169], Social Experiments [172], Poverty & Inequality [519]
- **Healthcare Systems & Emergency Services [180]** — subs: Hospital Stories [181], Emergency Services [182], Public Safety [183], Firefighting [184]
- **Safety & Security Awareness [493]** — subs: Personal Security [493], Home Security [494], Digital Safety [495]
- **Water, Sanitation & Waste [507]** — subs: Water [114], Waste Management [508]
- **Work, Rights & Labour [516]** — subs: Worker Safety [517], Cooperatives [518]
- **Internet & Digital Governance [515]**
- **Philanthropy & Social Good [317]**

## 22. Luxury, Lifestyle & Living — focus: PRODUCT / PLACE
- **Luxury / Rich Lifestyle [021]**
- **Fashion & Clothing [082]**
- **Jewelry & Precious Materials [083]**
- **Hotels, Resorts & Hospitality [229]** — subs: Hospitality [230], Resorts [231]
- **Shopping & Consumer Guides [136]** — subs: Consumer Rights [497], Product Recalls [498]
- **Auctions & Luxury Markets [316]**

## 23. Future & Speculative Civilization — focus: CONCEPT
- **Future Civilization & AI Society [468]** — subs: Future Civilization [053] (merged), Human-Robot Society [469], Future Cities [473], Floating Cities [474], Moon Civilization [475], Mars Civilization [476], Space Civilization [477], Asteroid Mining [478], Interstellar Civilization [479]
- **Future Predictions & Scenarios [166]** — subs: Future Civilization Scenarios [490], Speculative Science [491], Ultimate Future of Humanity [492]
- **Transhumanism & Life Futures [470]** — subs: Brain Enhancement [471], Life Extension [472], First Contact [480], Artificial Consciousness [481], Digital Immortality [482], Synthetic Life [483], Lab-Grown World [484], Post-Internet World [488], Augmented Humans [489]
- **Autonomous & Future Living Systems [485]** — subs: Autonomous Industry [485], Autonomous Transportation [486], Autonomous Homes [487]

## 24. Kids, Family & Parenting — focus: STORY / SUBJECT
- **Kids Cartoon Stories [017]**
- **Parenting & Child Development [073]**
- **Kids Learning [NEW]** — subs: (Animals for kids, Science for kids, GK for kids)

## 25. Facts, Lists, Records & Explainer Formats — focus: MIXED
- **General Knowledge [443]** — subs: Trivia [444], Quiz Channels [445]
- **Records & Extremes [163]**
- **Rankings & Comparisons [164]**
- **Then vs Now [165]** (format usable across niches)
- **What If? / Alternative Reality [167]** (format usable across niches)
- **Puzzles & Intellectual Mysteries [056]**
- **Explainer Formats — How & Why [087]** — subs: How Things Work [087], How It's Made [088], Why? Channel [090]

---

## Merge Log (duplicates merged, IDs preserved as references)
| Merged ID | Entry | Merged into |
|---|---|---|
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
- Category Entity Focus decides the primary registry type per niche
  (PERSON → Character, PLACE → Place, SUBJECT-safety → Knowledge/
  Ingredient, CREATURE → Creature, EVENT → Case/Event, STORY →
  Story-World, ORGANISATION → Organisation, PRODUCT → Product,
  WORK → Work, CONCEPT → Concept).
- §7 Scams [496] is placed once (story/case form); the §21 safety
  niche covers awareness without it to avoid double placement.
- Angle registries (per Angle_s_scope.txt) attach per niche on top of
  this hierarchy: Niche → Angles {question, scope, evidence, boundary}.
- Count check: 550 legacy IDs placed (verified by script), plus
  [NEW] niches: Medical Conditions Explained, Astrology/Numerology/
  Vastu, Competitive Exam Prep, Bedtime Stories, Kids Learning.
