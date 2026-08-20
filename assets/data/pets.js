/* ==========================================================================
   MiBoWi — species & breed profile set
   Used by the suitability matcher. Every candidate is scored on the same
   21 axes so a corn snake and a Bernese can be compared honestly.

   TRAIT STRING — 21 whitespace-separated numbers, in this exact order:

    1  size        1 toy · 2 small · 3 medium · 4 large · 5 giant
    2  energy      1 sedentary … 5 relentless
    3  dailyMin    realistic minutes of hands-on time this animal needs, daily
    4  grooming    1 none … 5 daily brushing plus a professional
    5  shedding    1 none … 5 constant
    6  allergen    1 low-allergen … 5 hard to live with for allergy sufferers
    7  trainable   1 ignores you … 5 learns almost anything
    8  independent 1 needs company … 5 content by itself
    9  maxAlone    hours it can reasonably be left, on a normal weekday
   10  vocal       1 silent … 5 loud and often
   11  kids        1 unsuitable with young children … 5 excellent
   12  otherPets   1 best kept alone … 5 easy with other animals
   13  novice      1 experienced keepers only … 5 genuinely beginner-safe
   14  space       1 fine in a studio … 5 needs real land
   15  affection   1 look-don’t-touch … 5 wants to be on you
   16  heat        1 suffers in heat … 5 thrives in it
   17  cold        1 suffers in cold … 5 thrives in it
   18  costTier    1 cheap to run … 5 expensive
   19  health      1 robust … 5 heavy predictable vet burden
   20  lifeLo      typical lifespan, low end (years)
   21  lifeHi      typical lifespan, high end (years)
   ========================================================================== */

(function () {
  var KEYS = ['size','energy','dailyMin','grooming','shedding','allergen','trainable',
              'independent','maxAlone','vocal','kids','otherPets','novice','space',
              'affection','heat','cold','costTier','health','lifeLo','lifeHi'];

  var LIST = [];

  /* P(id, name, group, costId, traitString, traits[], watch, summary) */
  function P(id, name, group, costId, s, traits, watch, summary) {
    var nums = String(s).trim().split(/\s+/).map(Number);
    if (nums.length !== KEYS.length) {
      throw new Error('MiBoWi pets.js: "' + id + '" has ' + nums.length + ' traits, expected ' + KEYS.length);
    }
    var o = { id: id, name: name, group: group, costId: costId,
              traits: traits, watch: watch, summary: summary };
    for (var i = 0; i < KEYS.length; i++) o[KEYS[i]] = nums[i];
    LIST.push(o);
  }

  /* ------------------------------------------------------------------ DOGS */

  P('lab', 'Labrador Retriever', 'Dog', 'dog-large',
    '4 4 75 2 5 4 5 2 5 3 5 5 4 4 5 3 4 4 3 10 13',
    ['Family-proof', 'Endlessly trainable', 'Water-mad'],
    'Will eat things that require surgery to remove, and stays a puppy in the head until about three.',
    'The default family dog for a reason: forgiving of mistakes, biddable, and happy in a busy household. The catch is exercise — an under-walked Labrador becomes a destructive, overweight one.');

  P('golden', 'Golden Retriever', 'Dog', 'dog-large',
    '4 4 70 3 5 4 5 2 5 2 5 5 4 4 5 2 4 4 4 10 12',
    ['Gentle', 'Soft-mouthed', 'People-first'],
    'High lifetime cancer rates — well over half in some lines. Insurance is not optional here.',
    'Softer and slightly needier than a Labrador, with the same trainability and a heavier coat. Superb with children; genuinely unhappy left alone all day.');

  P('gsd', 'German Shepherd', 'Dog', 'dog-large',
    '4 5 90 3 5 4 5 2 5 3 4 3 2 4 5 3 4 4 4 9 13',
    ['Serious worker', 'Deeply loyal', 'Needs a job'],
    'Hip and elbow dysplasia are common; buy only from health-tested lines or adopt with eyes open.',
    'One of the most capable dogs alive and one of the easiest to get wrong. Without structured work and early socialisation, that intelligence turns into reactivity you will be paying a behaviourist to unpick.');

  P('frenchie', 'French Bulldog', 'Dog', 'dog-small',
    '2 2 25 2 3 4 3 2 4 2 4 4 4 1 5 1 2 5 5 9 12',
    ['Apartment-sized', 'Comic', 'Low exercise need'],
    'Brachycephalic. Many need airway surgery, most cannot fly, and none cope with heat.',
    'Enormously charming and structurally compromised. If you live somewhere hot, this is close to a dealbreaker. Budget for spinal and airway problems as likely, not possible.');

  P('poodle-std', 'Poodle — Standard', 'Dog', 'dog-large',
    '4 4 70 5 1 1 5 2 5 3 4 4 3 3 5 3 3 4 2 11 14',
    ['Low-shedding', 'Very clever', 'Athletic'],
    'The coat is a standing appointment: clipping every six to eight weeks, forever, or it mats to the skin.',
    'Among the smartest dogs you can own, without the shedding. People choose Poodles for the coat and then discover the brain — this dog needs mental work or it invents its own.');

  P('poodle-mini', 'Poodle — Miniature or Toy', 'Dog', 'dog-small',
    '2 3 45 5 1 1 5 2 5 3 3 4 3 1 5 3 2 3 3 12 16',
    ['Low-shedding', 'Small but sharp', 'Long-lived'],
    'Same grooming bill as a big Poodle, plus toy-breed knees and teeth.',
    'The best answer for someone who wants a clever dog, limited space and minimal shedding. Prone to being under-trained because they are small enough to just pick up.');

  P('bulldog', 'Bulldog', 'Dog', 'dog-medium',
    '3 1 20 2 3 4 2 3 5 1 5 4 3 1 5 1 2 5 5 8 10',
    ['Very low energy', 'Placid', 'Apartment-friendly'],
    'The most medically expensive popular breed. Airway, skin, joints, and usually a caesarean to exist at all.',
    'A wonderful temperament attached to a body that struggles. Choose this dog knowing that vet spend, not walks, is the commitment.');

  P('beagle', 'Beagle', 'Dog', 'dog-medium',
    '3 4 70 2 4 4 2 2 4 5 5 5 3 2 4 4 3 3 3 12 15',
    ['Sociable', 'Sturdy', 'Nose-driven'],
    'Bays loudly, and once on a scent your recall does not exist. Notorious escape artists.',
    'Cheerful, robust, brilliant with children and other dogs. Not a dog for anyone who needs quiet neighbours or off-lead freedom.');

  P('dachshund', 'Dachshund', 'Dog', 'dog-small',
    '2 3 45 2 3 4 3 3 5 4 3 3 3 1 5 3 2 3 4 12 16',
    ['Big dog, short legs', 'Bold', 'Compact'],
    'Roughly one in four develops disc disease. No stairs, no sofa jumping, and a real chance of 4,000+ spinal surgery.',
    'Enormous personality in a small frame, with a genuine structural weakness. Manageable with discipline about jumping — expensive when it goes wrong.');

  P('rottweiler', 'Rottweiler', 'Dog', 'dog-large',
    '5 3 60 2 4 4 5 3 5 2 3 2 2 4 4 3 4 4 4 8 10',
    ['Calm authority', 'Devoted', 'Powerful'],
    'Strength plus insurance and housing restrictions in many places. Check your lease and your policy first.',
    'A steady, thoughtful guardian in competent hands. Requires an owner who trains consistently and can physically manage 50 kg of committed dog.');

  P('gsp', 'German Shorthaired Pointer', 'Dog', 'dog-large',
    '4 5 110 1 3 4 4 1 4 3 4 4 2 4 5 4 3 3 2 10 14',
    ['Tireless', 'Athletic partner', 'Easy coat'],
    'Two hours of real exercise a day is the floor, not the target. Under-exercised GSPs dismantle houses.',
    'The right dog for a runner or a hiker and the wrong dog for almost everyone else. Affectionate, biddable, and physically relentless.');

  P('border-collie', 'Border Collie', 'Dog', 'dog-medium',
    '3 5 120 3 4 4 5 1 4 3 3 3 1 4 4 3 5 3 2 12 15',
    ['Brilliant', 'Obsessive', 'Sport dog'],
    'Will herd your children, your bicycle and your vacuum cleaner if given nothing better to do.',
    'The most trainable dog on earth and the least suited to a quiet domestic life. Needs a sport, a job or a farm. Boredom here becomes neurosis, not just mischief.');

  P('aussie', 'Australian Shepherd', 'Dog', 'dog-medium',
    '3 5 100 4 5 4 5 1 4 3 4 3 2 4 5 3 4 3 3 12 15',
    ['Velcro dog', 'Very trainable', 'Heavy coat'],
    'Sheds constantly and bonds so tightly that separation anxiety is a common outcome.',
    'A Border Collie with more affection and more coat. Excellent for an active owner who is home a lot; a poor fit for long office days.');

  P('cavalier', 'Cavalier King Charles Spaniel', 'Dog', 'dog-small',
    '2 2 35 3 3 4 4 1 3 2 5 5 4 1 5 2 3 4 5 9 13',
    ['Lap dog', 'Universally friendly', 'Small'],
    'Near-universal mitral valve disease and a high rate of syringomyelia. Expect cardiac medication in later life.',
    'Possibly the sweetest temperament of any small breed, undermined by serious inherited health problems. Buy only from heart-and-MRI-screened lines, and insure early.');

  P('shih-tzu', 'Shih Tzu', 'Dog', 'dog-small',
    '2 2 30 5 1 2 3 2 4 3 4 4 4 1 5 1 2 4 4 10 16',
    ['Low-shedding', 'Indoor dog', 'Affectionate'],
    'Face and coat need daily attention, and flat faces mean real heat intolerance.',
    'A companion dog with no other ambitions — content in a flat, happy on a lap. The coat is the cost: clip it short or commit to daily grooming.');

  P('yorkie', 'Yorkshire Terrier', 'Dog', 'dog-small',
    '1 3 35 5 1 2 3 2 4 4 2 3 3 1 5 2 1 3 3 12 15',
    ['Tiny', 'Low-shedding', 'Bold'],
    'Fragile bones, collapsing tracheas, and a bark that carries. Not a young-child dog.',
    'A terrier that happens to weigh three kilos — opinionated, alert, and easily spoiled into a difficult dog if treated as an accessory.');

  P('chihuahua', 'Chihuahua', 'Dog', 'dog-small',
    '1 2 30 1 2 3 3 3 5 4 2 3 3 1 5 4 1 2 3 14 18',
    ['Long-lived', 'Minimal grooming', 'Portable'],
    'Genuinely fragile and often under-socialised into fearful aggression. Poor with toddlers.',
    'Cheap to feed, easy to house, and the most commonly mishandled dog there is. Train and socialise it like a real dog and it becomes one.');

  P('pomeranian', 'Pomeranian', 'Dog', 'dog-small',
    '1 3 30 4 4 4 4 2 4 5 2 3 3 1 5 2 4 3 3 12 16',
    ['Showy coat', 'Alert', 'Cold-hardy'],
    'A serious barker, and small enough that tracheal collapse and luxating patellas are routine.',
    'Bright, busy and vocal. Works in an apartment only if you actively train the barking down early.');

  P('boxer', 'Boxer', 'Dog', 'dog-large',
    '4 5 85 1 3 4 4 2 4 3 5 3 3 4 5 2 2 4 4 10 12',
    ['Clownish', 'Great with kids', 'Easy coat'],
    'High cancer rates and a flat-ish face that limits heat tolerance. Stays adolescent for years.',
    'Boisterous, funny and deeply attached to its family. Needs firm early training because 30 kg of enthusiasm knocks people over.');

  P('husky', 'Siberian Husky', 'Dog', 'dog-large',
    '4 5 110 3 5 5 2 3 5 5 4 3 1 4 4 1 5 3 3 12 15',
    ['Stunning', 'Endurance athlete', 'Cold-loving'],
    'No reliable recall, escapes anything, howls, and blows coat twice a year in drifts.',
    'The most surrendered breed in many shelters, because people buy the photograph. Superb for a cold-climate endurance athlete; miserable in a warm flat.');

  P('great-dane', 'Great Dane', 'Dog', 'dog-giant',
    '5 3 55 1 3 4 4 2 5 2 4 4 2 5 5 2 2 5 5 7 10',
    ['Gentle giant', 'Surprisingly calm indoors', 'Short coat'],
    'Bloat risk, and a lifespan often under eight years. Everything costs double by weight.',
    'Far lazier indoors than people expect, but the scale is unavoidable — the car, the bed, the medication doses and the grief all arrive early.');

  P('bernese', 'Bernese Mountain Dog', 'Dog', 'dog-giant',
    '5 3 55 4 5 5 4 2 5 2 5 4 3 5 5 1 5 5 5 7 9',
    ['Beautiful', 'Family-oriented', 'Built for cold'],
    'One of the shortest-lived breeds, with very high cancer rates. Cannot cope with heat.',
    'A magnificent, gentle, heavy-shedding dog you will likely lose at seven or eight. Go in knowing that.');

  P('corgi', 'Pembroke Welsh Corgi', 'Dog', 'dog-medium',
    '3 4 60 3 5 4 5 2 5 4 4 4 3 2 5 3 4 3 4 12 14',
    ['Big personality', 'Clever', 'Sturdy'],
    'Sheds more than any dog that size has a right to, and backs are vulnerable. Herding nips need training out.',
    'A working herder in a compact body: smart, vocal, and much more driven than the internet suggests. Weight control is a lifelong job.');

  P('mini-schnauzer', 'Miniature Schnauzer', 'Dog', 'dog-small',
    '2 3 45 5 1 1 4 2 5 4 4 3 4 1 5 3 3 3 3 12 15',
    ['Low-shedding', 'Alert', 'Robust'],
    'Barks at everything, and is prone to pancreatitis — no table scraps, ever.',
    'One of the better low-shedding small dogs: hardy, trainable and genuinely fun. Accept the beard grooming and the doorbell commentary.');

  P('cocker', 'Cocker Spaniel', 'Dog', 'dog-medium',
    '3 3 55 5 4 4 4 2 4 3 4 4 3 2 5 3 3 4 4 10 14',
    ['Soft', 'Merry', 'Middle-sized'],
    'Ears are a chronic infection site, and the coat mats fast. Budget for regular grooming and ear care.',
    'Affectionate and biddable with a genuinely heavy maintenance load. Ideal for someone who enjoys grooming as part of the relationship.');

  P('havanese', 'Havanese', 'Dog', 'dog-small',
    '2 3 40 5 1 1 4 1 4 3 5 5 4 1 5 3 3 3 2 14 16',
    ['Low-shedding', 'Excellent with children', 'Adaptable'],
    'Wants to be with you constantly — separation anxiety is the most common problem.',
    'Arguably the best small companion dog for a family flat: sturdy enough for children, small enough for a city, and low-shedding. The coat needs professional help.');

  P('bichon', 'Bichon Frise', 'Dog', 'dog-small',
    '2 3 40 5 1 1 4 1 4 3 5 4 4 1 5 3 3 3 3 14 16',
    ['Low-shedding', 'Cheerful', 'Small'],
    'The white coat needs constant professional upkeep, and tear staining is permanent maintenance.',
    'A genuinely happy little dog and one of the more allergy-tolerable breeds. The grooming bill is not optional.');

  P('maltese', 'Maltese', 'Dog', 'dog-small',
    '1 2 30 5 1 1 3 1 4 4 3 4 3 1 5 3 2 3 3 12 15',
    ['Low-shedding', 'Tiny', 'Devoted'],
    'Very fragile, clingy, and the floor-length coat is a full-time job unless kept clipped.',
    'A lap dog in the purest sense. Best suited to a quiet adult household that is home most of the day.');

  P('jrt', 'Jack Russell Terrier', 'Dog', 'dog-small',
    '2 5 90 2 3 4 4 2 5 4 3 2 1 2 4 4 3 3 2 13 16',
    ['Small but intense', 'Very healthy', 'Long-lived'],
    'A working terrier in a pet body. High prey drive makes small pets and off-lead walking a problem.',
    'The most energetic small dog you can pick. Delightful for an active owner who trains; a nightmare treated as a lap dog.');

  P('whippet', 'Whippet', 'Dog', 'dog-medium',
    '3 3 50 1 2 3 4 2 5 1 4 4 4 2 5 3 1 3 2 12 15',
    ['Quiet indoors', 'Clean', 'Sprint-then-sleep'],
    'Thin-skinned and cold-sensitive; needs coats in winter and a securely fenced sprint space.',
    'Perhaps the best-kept secret in dogs: near-silent, almost odourless, low-shedding, and content to sleep all day after one hard run.');

  P('greyhound', 'Greyhound — retired racer', 'Dog', 'dog-large',
    '4 2 40 1 2 3 3 3 6 1 4 3 4 3 4 3 1 3 3 10 14',
    ['Couch specialist', 'Adult when adopted', 'Quiet'],
    'High prey drive means most cannot live with cats or small dogs, and they cannot be let off lead.',
    'A large dog with the exercise needs of a small one. Adopting an adult skips the puppy years entirely — one of the most under-rated choices for a calm household.');

  P('basset', 'Basset Hound', 'Dog', 'dog-medium',
    '3 2 40 3 4 4 2 3 5 5 5 4 3 3 5 3 3 4 4 10 12',
    ['Placid', 'Sociable', 'Low energy'],
    'Loud, stubborn, prone to ear and back problems, and drools.',
    'A gentle, easygoing housemate with a hound’s nose and a hound’s deafness to instruction. Great with children, hard to train.');

  P('shiba', 'Shiba Inu', 'Dog', 'dog-medium',
    '3 4 60 3 5 4 2 4 6 2 2 2 1 2 3 3 5 4 3 13 16',
    ['Cat-like', 'Clean', 'Independent'],
    'Bolts through open doors, dislikes handling, and is often dog-aggressive. Recall is unreliable for life.',
    'Beautiful, fastidious and emotionally self-sufficient. A poor first dog and a poor family dog, but ideal for an experienced owner who wants a roommate rather than a follower.');

  P('doberman', 'Doberman Pinscher', 'Dog', 'dog-large',
    '4 5 85 1 3 4 5 2 4 2 3 3 2 4 5 3 2 4 4 10 12',
    ['Elegant', 'Highly trainable', 'Low grooming'],
    'Dilated cardiomyopathy is common and often sudden. Screen the lines; insure regardless.',
    'Athletic, sensitive and enormously capable — far softer with family than the reputation suggests. Needs an experienced, active handler and a heart-tested pedigree.');

  P('saint-bernard', 'Saint Bernard', 'Dog', 'dog-giant',
    '5 2 45 4 5 5 3 3 5 2 5 4 2 5 5 1 5 5 5 8 10',
    ['Enormous', 'Patient', 'Cold-hardy'],
    'Drool, shedding, bloat risk and a short life. Heat is genuinely dangerous.',
    'A calm, tolerant giant that takes up an entire room and an entire budget. Only sensible with space, a cool climate and a large contingency fund.');

  P('pug', 'Pug', 'Dog', 'dog-small',
    '2 2 25 2 5 4 3 2 4 2 5 5 4 1 5 1 2 4 5 12 15',
    ['Comic', 'Very affectionate', 'Low exercise'],
    'Severely brachycephalic. Breathing, eyes and spine are all compromised by design.',
    'Delightful company and one of the clearest cases where charm and welfare pull in opposite directions. If you want one, look hard at retired or rescue pugs and at the newer longer-muzzled lines.');

  P('iggy', 'Italian Greyhound', 'Dog', 'dog-small',
    '2 3 40 1 1 2 3 1 4 3 2 4 3 1 5 3 1 3 4 13 15',
    ['Almost no shedding', 'Tiny and quiet', 'Very affectionate'],
    'Legs break easily — a jump off a sofa can mean surgery. Hates cold and rain, and housetraining is famously slow.',
    'A miniature sighthound: silent, clean, and glued to you. Wonderful in a warm flat with adults, risky around rough play.');

  P('mixed-medium', 'Mixed-breed shelter dog', 'Dog', 'dog-medium',
    '3 3 60 2 3 4 4 3 5 3 4 4 4 3 5 3 3 2 2 11 15',
    ['Known temperament', 'Usually healthier', 'Cheapest route'],
    'You are matching an individual, not a breed — insist on meeting the dog several times and ask about its history.',
    'Statistically the healthiest and cheapest dog you can get, and with an adult rescue you can see the temperament you are actually signing up for rather than guessing from a pedigree.');

  /* ------------------------------------------------------------------ CATS */

  P('dsh', 'Domestic Shorthair — shelter cat', 'Cat', 'cat',
    '2 3 20 1 3 4 3 4 10 2 4 4 5 1 4 3 3 1 2 13 18',
    ['Healthiest option', 'Cheapest', 'Personality visible upfront'],
    'You are choosing an individual, not a type. Spend an hour with the actual cat before deciding.',
    'The single most sensible cat for most households. Hybrid vigour means fewer inherited problems, adoption is cheap, and an adult shelter cat’s temperament is already formed and observable.');

  P('dlh', 'Domestic Longhair', 'Cat', 'cat',
    '2 3 20 4 4 4 3 4 10 2 4 4 4 1 4 2 4 2 3 13 18',
    ['Beautiful coat', 'Robust genetics', 'Adoptable'],
    'Mats behind the legs and under the belly if you skip brushing. Hairballs are a permanent feature.',
    'All the resilience of a moggy with a coat that needs several brushings a week. Fine for anyone who genuinely enjoys grooming time.');

  P('maine-coon', 'Maine Coon', 'Cat', 'cat',
    '4 3 30 4 5 5 4 3 8 2 5 5 4 3 5 2 5 4 3 10 14',
    ['Dog-like', 'Huge', 'Very sociable'],
    'Screen for HCM and hip dysplasia. A cat this large eats, sheds and costs like a small dog.',
    'Enormous, gentle and unusually interactive — many learn to fetch and walk on a harness. Best in a home with space and a tolerance for fur on everything.');

  P('ragdoll', 'Ragdoll', 'Cat', 'cat',
    '4 2 20 4 4 5 4 2 7 2 5 5 4 2 5 2 4 3 3 12 16',
    ['Placid', 'Loves being held', 'Great with children'],
    'Strictly indoors — they have almost no self-preservation instinct. HCM screening is essential.',
    'The classic lap cat: floppy, tolerant and endlessly patient with handling. Needs company; not a cat to leave alone for long days.');

  P('siamese', 'Siamese', 'Cat', 'cat',
    '3 4 35 1 3 4 4 1 6 5 4 4 3 2 5 4 3 2 3 12 18',
    ['Extremely talkative', 'Bonded to people', 'Low grooming'],
    'The voice is loud, frequent and non-negotiable. Alone all day, a Siamese becomes destructive.',
    'Intelligent, demanding, and more like a small dog than a cat. Wonderful for someone who wants constant interaction; unbearable for someone who wanted a quiet flatmate.');

  P('british-shorthair', 'British Shorthair', 'Cat', 'cat',
    '3 2 20 2 4 4 3 4 9 1 5 5 5 2 3 3 4 3 3 12 17',
    ['Undemanding', 'Quiet', 'Independent'],
    'Prefers to sit near you rather than on you, and gains weight easily. Screen for HCM and PKD.',
    'A calm, self-contained cat that copes well with a working household. Affectionate on its own terms — good for people who want company without constant demands.');

  P('persian', 'Persian', 'Cat', 'cat',
    '3 1 15 5 4 5 2 3 8 1 4 4 2 2 4 1 3 4 5 10 15',
    ['Very calm', 'Ornamental', 'Indoor-only'],
    'Flat-faced: tear ducts, breathing and dental crowding are lifelong management, plus daily brushing.',
    'The most sedentary popular cat and the highest-maintenance coat in the species. A real commitment of daily time, not just money.');

  P('bengal', 'Bengal', 'Cat', 'cat',
    '3 5 45 1 3 3 4 2 6 4 3 3 1 3 4 4 3 4 3 12 16',
    ['Athletic', 'Striking', 'Very playful'],
    'Climbs everything, opens things, and often needs a catio or leash walks. Restricted in some jurisdictions.',
    'A high-drive cat that behaves more like a small wildcat. Superb for an owner who will build vertical space and play hard daily; destructive in an under-stimulated flat.');

  P('russian-blue', 'Russian Blue', 'Cat', 'cat',
    '3 3 25 1 2 2 4 4 9 1 3 3 4 1 4 3 4 2 2 15 20',
    ['Lower-allergen', 'Quiet', 'Very healthy'],
    'Reserved with strangers and slow to warm up. Dislikes chaotic, unpredictable households.',
    'One of the healthiest and longest-lived breeds, producing relatively less Fel d 1 than most. Devoted to its own people and indifferent to everyone else.');

  P('sphynx', 'Sphynx', 'Cat', 'cat',
    '3 4 30 4 1 2 4 2 6 3 4 4 2 2 5 1 1 5 4 9 15',
    ['No shedding', 'Extremely affectionate', 'Striking'],
    'Hairless does not mean hypoallergenic — the allergen is in saliva and skin. Needs weekly bathing and stays cold.',
    'A radiator-seeking, people-obsessed cat that demands warmth, weekly baths and a high vet budget. The skin is high-maintenance in ways people do not anticipate.');

  P('abyssinian', 'Abyssinian', 'Cat', 'cat',
    '3 5 40 1 2 3 4 2 7 3 3 4 3 2 5 4 3 3 3 12 15',
    ['Restless', 'Curious', 'Minimal grooming'],
    'Never sits still and will be on top of every cupboard. Needs a companion or serious enrichment.',
    'A perpetual-motion cat: inquisitive, busy and involved in everything you do. Not a lap cat and not a quiet one.');

  P('norwegian-forest', 'Norwegian Forest Cat', 'Cat', 'cat',
    '4 3 25 4 5 5 3 3 9 1 5 4 4 3 4 2 5 3 3 12 16',
    ['Cold-hardy', 'Big and calm', 'Independent'],
    'A dense double coat that blows out seasonally, and enough size to need a properly large litter box and cat tree.',
    'A hardy, even-tempered giant that is more independent than a Maine Coon. Ideal for a cool climate and a house with vertical space.');

  P('burmese', 'Burmese', 'Cat', 'cat',
    '3 4 30 1 2 3 4 1 6 3 5 5 4 1 5 4 3 3 3 15 18',
    ['Very people-oriented', 'Easy coat', 'Good with everyone'],
    'Genuinely cannot be left alone for long days — get two, or get a different breed.',
    'Affectionate, sociable and easy to live with, provided the household is populated. One of the better breeds for families with children and other pets.');

  P('oriental', 'Oriental Shorthair', 'Cat', 'cat',
    '3 5 40 1 2 3 4 1 5 5 4 4 2 2 5 4 2 3 3 12 16',
    ['Extremely vocal', 'Slim and athletic', 'Devoted'],
    'Louder than a Siamese and just as dependent. Shared walls will notice.',
    'A Siamese in a hundred colours: intense, chatty and permanently involved in your business. Only for someone who actively wants that.');

  P('devon-rex', 'Devon Rex', 'Cat', 'cat',
    '2 4 30 2 1 2 4 1 6 3 5 5 3 1 5 3 1 4 3 10 15',
    ['Barely sheds', 'Small', 'Comic'],
    'The fine coat offers no insulation — they seek heat constantly — and skin needs occasional cleaning.',
    'An impish, shoulder-riding little cat that sheds almost nothing. Among the more tolerable breeds for mild allergy sufferers, though no cat is truly safe there.');

  P('birman', 'Birman', 'Cat', 'cat',
    '3 2 20 3 3 4 3 3 8 2 5 5 4 2 5 3 3 3 3 12 16',
    ['Gentle', 'Silky low-mat coat', 'Balanced'],
    'Wants company but is undemanding about it — the risk is under-stimulation rather than distress.',
    'A middle path between the Ragdoll and the Siamese: affectionate and calm without being either needy or noisy. A quietly excellent family cat.');

  P('scottish-fold', 'Scottish Fold', 'Cat', 'cat',
    '3 2 20 2 3 4 3 3 8 2 5 5 3 2 5 3 3 4 5 11 14',
    ['Placid', 'Distinctive', 'Affectionate'],
    'The folded ear comes from osteochondrodysplasia — a cartilage defect causing painful arthritis in every fold-eared cat. Several veterinary bodies oppose breeding them.',
    'Charming and gentle, and the one breed here where we would actively encourage you to choose something else. If the look is the draw, a British Shorthair gives you the temperament without the disease.');

  /* --------------------------------------------------------- SMALL MAMMALS */

  P('rabbit', 'Rabbits — bonded pair', 'Small mammal', 'rabbit',
    '2 3 180 3 4 4 3 3 12 1 2 2 2 3 3 1 4 3 4 8 12',
    ['Litter-trainable', 'Quiet', 'Long-lived for their size'],
    'Prey animals that mostly dislike being picked up — the opposite of what children expect. Not a hutch pet.',
    'Properly kept, rabbits are free-range house animals needing hours out daily, a bonded partner and an exotics vet. Kept the way they are usually sold, they are miserable. The gap between those two is the whole decision.');

  P('guinea-pig', 'Guinea pigs — pair', 'Small mammal', 'guinea-pig',
    '1 2 60 2 3 5 2 3 12 3 4 2 3 2 4 2 3 2 3 5 8',
    ['Genuinely enjoy handling', 'Vocal in a good way', 'Daytime-active'],
    'Must be kept in pairs, need unlimited hay and daily vitamin C, and a proper cage is much bigger than pet shops sell.',
    'The best small mammal for a child who wants to actually hold their pet: awake in the daytime, tolerant of gentle handling, and expressive. Just double every figure — a lone guinea pig is a welfare problem.');

  P('hamster', 'Syrian hamster', 'Small mammal', 'hamster',
    '1 2 30 1 2 3 2 5 24 1 2 1 3 1 2 2 2 1 2 2 3',
    ['Solitary by nature', 'Needs no companion', 'Cheap to buy'],
    'Nocturnal, short-lived, and must live alone. Bites when woken. Two to three years, then grief.',
    'Widely recommended as a first pet and rarely a good one: awake when the child is asleep, requiring a 600-plus-square-inch enclosure most people never buy, and gone in under three years.');

  P('rat', 'Fancy rats — pair', 'Small mammal', 'rat',
    '1 3 60 1 2 4 4 3 12 1 4 2 3 1 5 2 3 1 4 2 4',
    ['Remarkably intelligent', 'Genuinely bond with people', 'Learn tricks'],
    'Two to three years, with a very high rate of tumours and respiratory disease at the end. Must be kept in pairs.',
    'The most affectionate and trainable small mammal by a distance — closer to a tiny dog than to a hamster. The price is that they are short-lived and reliably get sick before they go.');

  P('ferret', 'Ferrets — pair', 'Small mammal', 'ferret',
    '2 5 180 2 3 4 3 2 8 2 2 2 1 2 5 1 3 3 4 5 9',
    ['Endlessly playful', 'Very interactive', 'Litter-trainable'],
    'Musky regardless of bathing, illegal in some cities, and near-guaranteed adrenal or pancreatic disease in middle age.',
    'Enormous fun and a genuine handful: four hours out of the cage daily, a home ferret-proofed like a toddler’s, and a heavy predictable vet bill from about four years old.');

  P('chinchilla', 'Chinchillas — pair', 'Small mammal', 'chinchilla',
    '1 3 60 3 3 4 2 3 14 1 2 1 2 2 3 1 5 3 3 12 20',
    ['Extraordinarily soft', 'Very clean', 'Long-lived'],
    'Cannot survive heat — above about 25°C they overheat. In a warm climate that means air conditioning for the animal.',
    'A fifteen-to-twenty-year commitment to a crepuscular, delicate, dust-bathing animal that mostly does not want to be cuddled. Fascinating to keep, wrong for anyone expecting a soft toy.');

  P('gerbils', 'Gerbils — pair', 'Small mammal', 'gerbils',
    '1 3 30 1 2 3 2 4 20 1 3 1 4 1 3 3 2 1 2 3 4',
    ['Fascinating to watch', 'Almost odourless', 'Daytime-active'],
    'Need 25–30 cm of bedding to burrow properly, and bonded pairs can turn on each other permanently.',
    'Probably the best small rodent for observation: they burrow, tunnel and are awake during the day, with far less smell than a hamster. Handling is possible but they are quick and rarely still.');

  /* ----------------------------------------------------------------- BIRDS */

  P('budgie', 'Budgies — pair', 'Bird', 'budgie',
    '1 3 60 1 2 4 3 3 10 3 3 2 3 2 4 3 2 1 3 6 12',
    ['Cheap to keep', 'Sociable in pairs', 'Can learn to talk'],
    'Chatter most of the day, and feather dust is a real problem for asthmatic households.',
    'The most accessible parrot: small, affordable, and genuinely engaging if kept in pairs and given daily out-of-cage flight. Cheap to buy and easy to under-house.');

  P('cockatiel', 'Cockatiel', 'Bird', 'cockatiel',
    '1 3 90 1 3 5 4 2 8 4 3 2 3 2 5 3 2 2 3 15 25',
    ['Affectionate', 'Whistles tunes', 'Bonds hard'],
    'Fifteen to twenty-five years, a piercing contact call when you leave the room, and heavy feather dust.',
    'A gentle, cuddly parrot that will sit on your shoulder for hours — and will scream for you when you walk out. Two decades is the real commitment, and the dust makes it a poor match for respiratory issues.');

  P('parrot', 'Parrot — grey, amazon or macaw', 'Bird', 'parrot',
    '2 5 240 2 3 5 5 1 4 5 1 1 1 3 5 3 2 5 3 30 70',
    ['Extraordinarily intelligent', 'Genuine conversation', 'Lifelong bond'],
    'Thirty to seventy years, volume comparable to power tools, and the emotional needs of a permanent toddler.',
    'The most demanding companion animal in common ownership. A grey needs hours of interaction, constant foraging enrichment, and a named person in your will. Rescues are full of them because people took the bond seriously and the lifespan not at all.');

  /* -------------------------------------------------------------- REPTILES */

  P('bearded-dragon', 'Bearded dragon', 'Reptile', 'bearded-dragon',
    '2 2 30 1 1 1 2 4 24 1 4 1 3 2 3 5 1 3 3 8 14',
    ['Tolerates handling well', 'Silent', 'No allergens'],
    'Needs a large, correctly heated, UVB-lit enclosure and a permanent supply of live insects in your home.',
    'The friendliest reptile for a beginner and the one most often crippled by a cheap setup. Get the enclosure and lighting right and it is genuinely low-effort, hypoallergenic, and around for a decade.');

  P('leopard-gecko', 'Leopard gecko', 'Reptile', 'leopard-gecko',
    '1 1 15 1 1 1 2 5 36 1 4 1 4 1 2 4 1 2 2 12 20',
    ['Very low daily effort', 'Silent', 'Small footprint'],
    'Still needs live insects, and lives twelve to twenty years — far longer than most buyers expect.',
    'About as undemanding as a living animal gets: fifteen minutes a day, no noise, no allergens, no walking. The trade is that it wants very little to do with you, and it is a two-decade commitment.');

  P('corn-snake', 'Corn snake', 'Reptile', 'corn-snake',
    '1 1 15 1 1 1 2 5 72 1 3 1 4 1 2 4 2 2 2 15 23',
    ['Cheapest to run', 'Handles calmly', 'Away-from-home friendly'],
    'Frozen rodents live in your freezer, and everyone in the household has to be fine with that.',
    'The most practical reptile in the hobby: eats once a week, tolerates handling, and can be left over a weekend without a sitter. The barriers are social rather than technical.');

  /* --------------------------------------------------------------- AQUATIC */

  P('aquarium', 'Freshwater aquarium', 'Aquatic', 'aquarium',
    '1 1 20 3 1 1 1 4 48 1 4 3 2 2 1 3 3 3 2 5 15',
    ['No allergens', 'Silent', 'Genuinely calming'],
    'You are keeping water, not fish. Skipping the weekly change and the initial cycling is what kills them.',
    'The right answer for a household that wants life in the room without touch, noise or allergens. The commitment is a standing weekly maintenance ritual rather than daily attention — different, not smaller.');

  window.MIBOWI_PETS = LIST;
})();
