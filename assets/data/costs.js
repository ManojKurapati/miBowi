/* ==========================================================================
   MiBoWi — cost model
   All figures are US-market baselines for 2026, in USD, before the regional
   cost index in core.js is applied. They are planning estimates, not quotes.
   Sources & method: see method.html
   ========================================================================== */

window.MIBOWI_COSTS = {

  /* Food quality tiers multiply the food line only. */
  foodTiers: [
    { id: 'budget',   label: 'Budget',        note: 'Store-brand kibble',              mult: 0.72 },
    { id: 'standard', label: 'Standard',      note: 'Mainstream brand, complete diet', mult: 1.00 },
    { id: 'premium',  label: 'Premium',       note: 'Vet-line or high-end brand',      mult: 1.38 },
    { id: 'fresh',    label: 'Fresh / raw',   note: 'Subscription fresh or raw diet',   mult: 2.15 }
  ],

  /* Acquisition routes. */
  routes: [
    { id: 'adopt',   label: 'Shelter or rescue',  note: 'Usually altered & vaccinated' },
    { id: 'rehome',  label: 'Rehomed privately',  note: 'From a previous owner' },
    { id: 'breeder', label: 'Breeder or store',   note: 'Purchased as a young animal' }
  ],

  /* Grooming cadences, in visits per year. */
  groomPlans: [
    { id: 'none',    label: 'None',          visits: 0 },
    { id: 'seasonal',label: 'A few a year',  visits: 4 },
    { id: 'regular', label: 'Every 8 weeks', visits: 6.5 },
    { id: 'monthly', label: 'Every month',   visits: 12 }
  ],

  /* ---------------------------------------------------------------------
     Per-species economics.
       life        expected lifespan in years (planning figure)
       acquire     one-time cost by route (null = route not realistic)
       setup       one-time equipment / habitat
       vetSetup    first-year one-time medical (alter, vaccine series, chip)
       m.*         recurring monthly costs
       vetAnnual   routine annual veterinary care
       dentalAnnual amortised dental work (0 where not applicable)
       insurance   typical monthly premium where a real market exists
       groomVisit  cost of one professional grooming appointment
       boardDay    per-day boarding or in-home sitting
       careDay     per-day walker or daycare
       riskRate    annual probability of a >1k emergency event
       riskCost    typical cost of that event
       endOfLife   euthanasia and aftercare
       oops        the specific bills people do not see coming
     --------------------------------------------------------------------- */

  species: [
    {
      id: 'dog-small', group: 'Dogs', label: 'Dog — small', sub: 'under 11 kg / 25 lb',
      life: 14, lifeRange: [12, 16],
      acquire: { adopt: 250, rehome: 100, breeder: 2000 },
      setup: 280, vetSetup: 620,
      m: { food: 45, substrate: 8, prevent: 34, consum: 22, utilities: 0 },
      vetAnnual: 320, dentalAnnual: 240, insurance: 40,
      groomVisit: 75, boardDay: 55, careDay: 22,
      riskRate: 0.16, riskCost: 1800, endOfLife: 450,
      trainBasic: 220,
      damage: 160, labels: { substrate: 'Waste bags & sundries' },
      flags: { grooming: true, board: true, care: true, insure: true, litter: false, pair: false },
      oops: [
        ['Dental disease', 'Small breeds are dental-disease magnets. A cleaning with extractions runs 800–1,600 and many dogs need one every year or two.'],
        ['Luxating patella', 'Common in toy breeds. Surgical repair is 1,500–4,000 per knee.'],
        ['Boarding at peak season', 'Kennel rates near holidays routinely run 1.5–2× the everyday rate.']
      ]
    },
    {
      id: 'dog-medium', group: 'Dogs', label: 'Dog — medium', sub: '11–27 kg / 25–60 lb',
      life: 12, lifeRange: [10, 14],
      acquire: { adopt: 250, rehome: 100, breeder: 2200 },
      setup: 320, vetSetup: 740,
      m: { food: 75, substrate: 8, prevent: 45, consum: 26, utilities: 0 },
      vetAnnual: 360, dentalAnnual: 200, insurance: 50,
      groomVisit: 85, boardDay: 60, careDay: 25,
      riskRate: 0.18, riskCost: 2400, endOfLife: 550,
      trainBasic: 240,
      damage: 190, labels: { substrate: 'Waste bags & sundries' },
      flags: { grooming: true, board: true, care: true, insure: true, litter: false, pair: false },
      oops: [
        ['Torn cruciate ligament', 'The classic mid-size dog injury. TPLO surgery is 4,000–7,000, and roughly half of dogs go on to tear the other side.'],
        ['Behaviour help', 'A qualified behaviourist for reactivity or separation anxiety is 150–350 per session, and it is rarely one session.'],
        ['Fence and yard-proofing', 'A determined escape artist can turn into a 1,500–4,000 fencing bill.']
      ]
    },
    {
      id: 'dog-large', group: 'Dogs', label: 'Dog — large', sub: '27–41 kg / 60–90 lb',
      life: 10, lifeRange: [9, 12],
      acquire: { adopt: 250, rehome: 100, breeder: 2400 },
      setup: 400, vetSetup: 850,
      m: { food: 110, substrate: 10, prevent: 55, consum: 30, utilities: 0 },
      vetAnnual: 420, dentalAnnual: 210, insurance: 68,
      groomVisit: 95, boardDay: 68, careDay: 28,
      riskRate: 0.22, riskCost: 3200, endOfLife: 700,
      trainBasic: 260,
      damage: 220, labels: { substrate: 'Waste bags & sundries' },
      flags: { grooming: true, board: true, care: true, insure: true, litter: false, pair: false },
      oops: [
        ['Dose-by-weight medication', 'Everything from painkillers to anaesthesia is priced by body weight. A large dog costs roughly double a small one for identical treatment.'],
        ['Hip dysplasia', 'Management runs 800–2,000 a year; total hip replacement is 5,000–8,000 per side.'],
        ['Car and home changes', 'Ramps, seat barriers, bigger crates, replaced sofas — budget for one 300–800 surprise a year.']
      ]
    },
    {
      id: 'dog-giant', group: 'Dogs', label: 'Dog — giant', sub: 'over 41 kg / 90 lb',
      life: 8, lifeRange: [6, 10],
      acquire: { adopt: 300, rehome: 150, breeder: 2800 },
      setup: 480, vetSetup: 1010,
      m: { food: 155, substrate: 10, prevent: 68, consum: 34, utilities: 0 },
      vetAnnual: 500, dentalAnnual: 230, insurance: 92,
      groomVisit: 110, boardDay: 78, careDay: 32,
      riskRate: 0.26, riskCost: 4200, endOfLife: 900,
      trainBasic: 300,
      damage: 260, labels: { substrate: 'Waste bags & sundries' },
      flags: { grooming: true, board: true, care: true, insure: true, litter: false, pair: false },
      oops: [
        ['Bloat (GVD)', 'A true emergency with hours to act. Surgery is 5,000–8,000 and it is common enough in deep-chested giants that many owners pre-emptively pay 1,000–2,000 for a gastropexy.'],
        ['The short clock', 'Giant breeds often reach only 7–9 years. You pay large-dog costs across a compressed lifetime and face loss much sooner.'],
        ['Who can even handle them', 'Many boarding kennels, groomers and sitters cap by weight or add a surcharge.']
      ]
    },
    {
      id: 'cat', group: 'Cats', label: 'Cat', sub: 'indoor, single',
      life: 15, lifeRange: [12, 20],
      acquire: { adopt: 150, rehome: 60, breeder: 1400 },
      setup: 300, vetSetup: 515,
      m: { food: 48, substrate: 30, prevent: 20, consum: 16, utilities: 0 },
      vetAnnual: 260, dentalAnnual: 190, insurance: 30,
      groomVisit: 70, boardDay: 30, careDay: 0,
      riskRate: 0.14, riskCost: 1900, endOfLife: 400,
      trainBasic: 0,
      damage: 130, labels: { substrate: 'Cat litter' },
      flags: { grooming: true, board: true, care: false, insure: true, litter: true, pair: false },
      oops: [
        ['Urinary blockage', 'Mostly male cats, almost always at 2am. Emergency treatment is 1,500–3,000 and it can recur.'],
        ['Kidney disease in old age', 'Very common past twelve. Ongoing management, prescription diet and fluids run 1,200–3,000 a year for the final stretch.'],
        ['Furniture and carpet', 'A cat who dislikes their litter setup, or who never learned scratching posts, can cost more in replaced flooring than in vet bills.']
      ]
    },
    {
      id: 'rabbit', group: 'Small mammals', label: 'Rabbit', sub: 'bonded pair recommended',
      life: 9, lifeRange: [8, 12],
      acquire: { adopt: 90, rehome: 40, breeder: 120 },
      setup: 380, vetSetup: 400,
      m: { food: 55, substrate: 28, prevent: 5, consum: 18, utilities: 0 },
      vetAnnual: 220, dentalAnnual: 120, insurance: 18,
      groomVisit: 45, boardDay: 20, careDay: 0,
      riskRate: 0.20, riskCost: 900, endOfLife: 250,
      trainBasic: 0,
      damage: 110, labels: { substrate: 'Bedding & litter', consum: 'Chews & enrichment' },
      flags: { grooming: true, board: true, care: false, insure: true, litter: true, pair: true },
      oops: [
        ['Exotic vets cost more and are rarer', 'Rabbits are not small dogs. You need a rabbit-savvy vet, they charge a premium, and there may not be one open at night.'],
        ['GI stasis', 'A rabbit that stops eating is an emergency the same day. Treatment is 300–1,500 and most rabbits have at least one episode.'],
        ['Teeth that never stop growing', 'Malocclusion means burring under anaesthetic every few months, at 200–500 a time, for life.']
      ]
    },
    {
      id: 'guinea-pig', group: 'Small mammals', label: 'Guinea pigs', sub: 'pair — they must not live alone',
      life: 6, lifeRange: [5, 8],
      acquire: { adopt: 70, rehome: 30, breeder: 90 },
      setup: 320, vetSetup: 120,
      m: { food: 48, substrate: 30, prevent: 0, consum: 14, utilities: 0 },
      vetAnnual: 180, dentalAnnual: 0, insurance: 0,
      groomVisit: 35, boardDay: 15, careDay: 0,
      riskRate: 0.18, riskCost: 500, endOfLife: 180,
      trainBasic: 0,
      damage: 30, labels: { substrate: 'Bedding & litter', consum: 'Chews & enrichment' },
      flags: { grooming: false, board: true, care: false, insure: false, litter: true, pair: true },
      oops: [
        ['You are buying two', 'Guinea pigs kept singly suffer. Every figure here already assumes a pair, and so should yours.'],
        ['Hay, endlessly', 'Unlimited fresh hay plus daily vitamin-C vegetables is most of the running cost, and it does not scale down.'],
        ['Bladder stones', 'Common and surgical: 400–900 a time.']
      ]
    },
    {
      id: 'hamster', group: 'Small mammals', label: 'Hamster', sub: 'strictly solitary',
      life: 2.5, lifeRange: [2, 3],
      acquire: { adopt: 20, rehome: 10, breeder: 30 },
      setup: 220, vetSetup: 0,
      m: { food: 14, substrate: 22, prevent: 0, consum: 8, utilities: 0 },
      vetAnnual: 80, dentalAnnual: 0, insurance: 0,
      groomVisit: 0, boardDay: 8, careDay: 0,
      riskRate: 0.12, riskCost: 250, endOfLife: 120,
      trainBasic: 0,
      damage: 25, labels: { substrate: 'Deep bedding', consum: 'Chews & enrichment' },
      flags: { grooming: false, board: true, care: false, insure: false, litter: false, pair: false },
      oops: [
        ['The cage sold as a hamster cage is usually too small', 'A properly sized enclosure — 600+ square inches of floor — costs far more than the pet, and deep bedding is a permanent running cost.'],
        ['Two to three years', 'Short lives make hamsters a poor "starter pet" for a child who will grieve, and a real vet bill can exceed what the animal cost twenty times over.'],
        ['Nocturnal by design', 'They are awake when you are not. That is not a cost, but it is the most common reason they end up neglected.']
      ]
    },
    {
      id: 'rat', group: 'Small mammals', label: 'Rats', sub: 'pair — highly social',
      life: 3, lifeRange: [2, 4],
      acquire: { adopt: 40, rehome: 20, breeder: 60 },
      setup: 280, vetSetup: 90,
      m: { food: 20, substrate: 26, prevent: 0, consum: 10, utilities: 0 },
      vetAnnual: 160, dentalAnnual: 0, insurance: 0,
      groomVisit: 0, boardDay: 12, careDay: 0,
      riskRate: 0.30, riskCost: 350, endOfLife: 150,
      trainBasic: 0,
      damage: 35, labels: { substrate: 'Bedding & litter', consum: 'Chews & enrichment' },
      flags: { grooming: false, board: true, care: false, insure: false, litter: true, pair: true },
      oops: [
        ['Respiratory disease is near-universal', 'Most rats need antibiotics at some point, often repeatedly. Budget 100–300 a course.'],
        ['Mammary tumours', 'Very common in females. Removal is 250–600 and they frequently recur.'],
        ['Grief on a two-year cycle', 'Rats are wonderful and they die fast. People underestimate how hard that repeats.']
      ]
    },
    {
      id: 'ferret', group: 'Small mammals', label: 'Ferret', sub: 'pair recommended',
      life: 7, lifeRange: [5, 9],
      acquire: { adopt: 180, rehome: 80, breeder: 350 },
      setup: 400, vetSetup: 300,
      m: { food: 45, substrate: 22, prevent: 15, consum: 18, utilities: 0 },
      vetAnnual: 320, dentalAnnual: 0, insurance: 25,
      groomVisit: 0, boardDay: 22, careDay: 0,
      riskRate: 0.30, riskCost: 1500, endOfLife: 300,
      trainBasic: 0,
      damage: 95, labels: { substrate: 'Bedding & litter', consum: 'Toys & enrichment' },
      flags: { grooming: false, board: true, care: false, insure: true, litter: true, pair: true },
      oops: [
        ['Adrenal disease and insulinoma', 'Not rare complications — close to expected events in middle age. Surgery or implants run 800–2,500.'],
        ['Illegal in some places', 'Ferrets are banned or restricted in several cities and countries. Check before, not after.'],
        ['They will find the gap', 'Ferret-proofing a home properly is a real project, and swallowed rubber means 1,500+ obstruction surgery.']
      ]
    },
    {
      id: 'budgie', group: 'Birds', label: 'Budgies', sub: 'pair — social flock birds',
      life: 8, lifeRange: [6, 12],
      acquire: { adopt: 60, rehome: 30, breeder: 90 },
      setup: 280, vetSetup: 90,
      m: { food: 22, substrate: 12, prevent: 0, consum: 14, utilities: 0 },
      vetAnnual: 160, dentalAnnual: 0, insurance: 0,
      groomVisit: 0, boardDay: 12, careDay: 0,
      riskRate: 0.12, riskCost: 350, endOfLife: 150,
      trainBasic: 0,
      damage: 45, labels: { substrate: 'Cage liner & grit', consum: 'Toys & foraging' },
      flags: { grooming: false, board: true, care: false, insure: false, litter: false, pair: true },
      oops: [
        ['Avian vets are a specialty', 'A general practice often will not see birds at all, and an avian workup starts around 150–250.'],
        ['Air quality kills', 'Non-stick cookware fumes, scented candles and aerosols can kill a bird in minutes. Owning one changes how you run your kitchen.'],
        ['Noise', 'A pair of budgies chatters most of the day. Thin apartment walls make this someone else’s problem too.']
      ]
    },
    {
      id: 'cockatiel', group: 'Birds', label: 'Cockatiel', sub: 'single or pair',
      life: 18, lifeRange: [15, 25],
      acquire: { adopt: 140, rehome: 60, breeder: 220 },
      setup: 340, vetSetup: 120,
      m: { food: 26, substrate: 14, prevent: 0, consum: 18, utilities: 0 },
      vetAnnual: 200, dentalAnnual: 0, insurance: 0,
      groomVisit: 0, boardDay: 15, careDay: 0,
      riskRate: 0.12, riskCost: 500, endOfLife: 180,
      trainBasic: 0,
      damage: 60, labels: { substrate: 'Cage liner & grit', consum: 'Toys & foraging' },
      flags: { grooming: false, board: true, care: false, insure: false, litter: false, pair: false },
      oops: [
        ['Two decades, not two years', 'A cockatiel bought for a ten-year-old is still alive when that child finishes graduate school.'],
        ['The contact call', 'A bonded cockatiel screams for you when you leave the room. It is loud, it is normal, and it does not stop.'],
        ['Chronic egg-laying', 'Hens can lay compulsively, which drains calcium and leads to egg binding — a 400–900 emergency.']
      ]
    },
    {
      id: 'parrot', group: 'Birds', label: 'Parrot — medium/large', sub: 'grey, amazon, cockatoo, macaw',
      life: 45, lifeRange: [30, 70],
      acquire: { adopt: 600, rehome: 400, breeder: 2500 },
      setup: 900, vetSetup: 250,
      m: { food: 65, substrate: 20, prevent: 0, consum: 55, utilities: 0 },
      vetAnnual: 350, dentalAnnual: 0, insurance: 0,
      groomVisit: 45, boardDay: 35, careDay: 0,
      riskRate: 0.10, riskCost: 900, endOfLife: 300,
      trainBasic: 0,
      damage: 150, labels: { substrate: 'Cage liner & grit', consum: 'Foraging toys & chews' },
      flags: { grooming: false, board: true, care: false, insure: false, litter: false, pair: false },
      oops: [
        ['It will probably outlive you', 'A grey or a macaw needs to be written into your will with a named, willing person. Rescues are full of parrots whose owners died first.'],
        ['Toys are consumables', 'Destroying things is the point of a parrot. Replacing foraging toys properly is 40–80 a month, forever.'],
        ['Volume you cannot negotiate with', 'A cockatoo at dawn is measured in the same range as a chainsaw. Shared walls make this unworkable.']
      ]
    },
    {
      id: 'bearded-dragon', group: 'Reptiles', label: 'Bearded dragon', sub: 'solitary',
      life: 10, lifeRange: [8, 14],
      acquire: { adopt: 80, rehome: 40, breeder: 200 },
      setup: 650, vetSetup: 120,
      m: { food: 45, substrate: 10, prevent: 0, consum: 18, utilities: 8 },
      vetAnnual: 180, dentalAnnual: 0, insurance: 0,
      groomVisit: 0, boardDay: 12, careDay: 0,
      riskRate: 0.15, riskCost: 450, endOfLife: 120,
      trainBasic: 0,
      damage: 20, labels: { substrate: 'Substrate & decor', consum: 'Supplements & bulbs', utilities: 'Heating, UVB & electricity' },
      flags: { grooming: false, board: true, care: false, insure: false, litter: false, pair: false },
      oops: [
        ['The enclosure is the expensive part', 'A correct 4x2x2 setup with UVB, basking heat and a thermostat is 500–900 before the animal. Cheap kits sold at pet stores are the leading cause of metabolic bone disease.'],
        ['Live insects, every week', 'You will be keeping and gut-loading roaches or crickets in your home indefinitely.'],
        ['UVB bulbs expire invisibly', 'They keep making light long after they stop making usable UVB. Replacing on schedule is 40–70 twice a year and skipping it cripples the animal.']
      ]
    },
    {
      id: 'leopard-gecko', group: 'Reptiles', label: 'Leopard gecko', sub: 'solitary',
      life: 15, lifeRange: [12, 20],
      acquire: { adopt: 60, rehome: 30, breeder: 150 },
      setup: 400, vetSetup: 90,
      m: { food: 25, substrate: 8, prevent: 0, consum: 10, utilities: 4 },
      vetAnnual: 150, dentalAnnual: 0, insurance: 0,
      groomVisit: 0, boardDay: 10, careDay: 0,
      riskRate: 0.10, riskCost: 350, endOfLife: 120,
      trainBasic: 0,
      damage: 20, labels: { substrate: 'Substrate & decor', consum: 'Supplements & bulbs', utilities: 'Heating & electricity' },
      flags: { grooming: false, board: true, care: false, insure: false, litter: false, pair: false },
      oops: [
        ['Fifteen to twenty years', 'One of the longest-lived "easy" pets. This is a commitment on the order of a cat.'],
        ['Impaction', 'The wrong substrate leads to gut blockage: 300–800 and sometimes fatal.'],
        ['Still live food', 'Low maintenance does not mean no maintenance — insects have to be bought, kept alive and dusted.']
      ]
    },
    {
      id: 'corn-snake', group: 'Reptiles', label: 'Corn snake', sub: 'solitary',
      life: 18, lifeRange: [15, 23],
      acquire: { adopt: 70, rehome: 40, breeder: 160 },
      setup: 380, vetSetup: 90,
      m: { food: 18, substrate: 10, prevent: 0, consum: 6, utilities: 3 },
      vetAnnual: 140, dentalAnnual: 0, insurance: 0,
      groomVisit: 0, boardDay: 8, careDay: 0,
      riskRate: 0.08, riskCost: 350, endOfLife: 120,
      trainBasic: 0,
      damage: 20, labels: { substrate: 'Substrate & decor', consum: 'Equipment upkeep', utilities: 'Heating & electricity' },
      flags: { grooming: false, board: true, care: false, insure: false, litter: false, pair: false },
      oops: [
        ['Frozen rodents live in your freezer', 'Not everyone in the household will be fine with this. Settle it before the snake arrives.'],
        ['Escape', 'Corn snakes are famous for it. A latching, sealed enclosure is not optional.'],
        ['Nearly two decades', 'Cheap to run, but a very long commitment for an animal often bought on impulse.']
      ]
    },
    {
      id: 'aquarium', group: 'Aquatic', label: 'Freshwater aquarium', sub: '110–150 L / 30–40 gal community',
      life: 8, lifeRange: [5, 15],
      acquire: { adopt: 120, rehome: 80, breeder: 160 },
      setup: 550, vetSetup: 0,
      m: { food: 10, substrate: 0, prevent: 0, consum: 30, utilities: 11 },
      vetAnnual: 60, dentalAnnual: 0, insurance: 0,
      groomVisit: 0, boardDay: 5, careDay: 0,
      riskRate: 0.10, riskCost: 200, endOfLife: 0,
      trainBasic: 0,
      damage: 25, labels: { consum: 'Water treatment & filter media', utilities: 'Heater, light & pump' },
      flags: { grooming: false, board: false, care: false, insure: false, litter: false, pair: false },
      oops: [
        ['The tank is the pet', 'You are maintaining a small ecosystem. Individual fish come and go; the filter, the water chemistry and the weekly water change are the actual commitment.'],
        ['Cycling takes weeks', 'Stocking a brand-new tank on day one is the single most common beginner mistake and it kills the fish you just bought.'],
        ['Leaks and floors', 'A 150-litre tank is around 150 kg on one spot of your floor, and a failed seal is a flooring claim, not a fish problem.']
      ]
    },
    {
      id: 'chinchilla', group: 'Small mammals', label: 'Chinchillas', sub: 'pair — social, very long-lived',
      life: 15, lifeRange: [12, 20],
      acquire: { adopt: 150, rehome: 60, breeder: 220 },
      setup: 520, vetSetup: 90,
      m: { food: 32, substrate: 26, prevent: 0, consum: 20, utilities: 12 },
      vetAnnual: 190, dentalAnnual: 100, insurance: 0,
      groomVisit: 0, boardDay: 15, careDay: 0,
      riskRate: 0.15, riskCost: 500, endOfLife: 180,
      trainBasic: 0,
      damage: 45, labels: { substrate: 'Bedding & dust bath', consum: 'Chew wood & enrichment' },
      flags: { grooming: false, board: true, care: false, insure: false, litter: true, pair: true },
      oops: [
        ['Heat is lethal', 'Above roughly 25\u00b0C a chinchilla can overheat and die. In a warm climate that means air conditioning running for the animal, which is a utility bill, not a one-off.'],
        ['Fifteen to twenty years', 'Longer than most dogs. People buy them as a novelty small pet and are still caring for one two decades later.'],
        ['Teeth again', 'Continuously growing molars mean unlimited hay, endless chew wood, and 200\u2013500 dental procedures if it goes wrong.']
      ]
    },
    {
      id: 'gerbils', group: 'Small mammals', label: 'Gerbils', sub: 'pair — must not live alone',
      life: 3.5, lifeRange: [3, 4],
      acquire: { adopt: 30, rehome: 15, breeder: 40 },
      setup: 240, vetSetup: 0,
      m: { food: 12, substrate: 24, prevent: 0, consum: 8, utilities: 0 },
      vetAnnual: 70, dentalAnnual: 0, insurance: 0,
      groomVisit: 0, boardDay: 8, careDay: 0,
      riskRate: 0.10, riskCost: 200, endOfLife: 100,
      trainBasic: 0,
      damage: 25, labels: { substrate: 'Deep bedding', consum: 'Chews & enrichment' },
      flags: { grooming: false, board: true, care: false, insure: false, litter: false, pair: true },
      oops: [
        ['They need to dig, deeply', 'A proper gerbilarium holds 25\u201330 cm of bedding. Replacing that much substrate is most of the running cost.'],
        ['Declanning', 'Bonded gerbils can turn on each other permanently, usually with no warning. You may end up funding two separate setups.'],
        ['Banned in some places', 'Gerbils are illegal in California and a few other jurisdictions as an invasive-species risk.']
      ]
    },
  ],

  /* Universal extras the calculator can switch on. */
  extras: {
    petRentMonthly: 35,
    petDepositOnce: 350,
    damageAnnual: { dog: 160, cat: 110, other: 60 },
    sitterVisitDay: 28
  }
};
