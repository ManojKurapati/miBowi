/* ==========================================================================
   MiBoWi — Readiness assessment
   "Should I get a pet at all?"

   Six weighted dimensions, twenty-one questions. Some answers do not merely
   lose points, they cap the total — because no amount of enthusiasm fixes a
   lease that forbids animals or a partner who said no.
   ========================================================================== */

(function () {
  'use strict';

  var M = window.MiBoWi;

  var DIMS = [
    { id: 'time',    name: 'Time & attention', w: 0.24 },
    { id: 'money',   name: 'Financial room',   w: 0.22 },
    { id: 'home',    name: 'Home & permission',w: 0.18 },
    { id: 'life',    name: 'Life stability',   w: 0.15 },
    { id: 'support', name: 'Support & skill',  w: 0.11 },
    { id: 'motive',  name: 'Motivation',       w: 0.10 }
  ];

  /* o(value, label, sub, points, extra) */
  function o(v, l, sub, p, extra) {
    var x = extra || {};
    return { v: v, l: l, sub: sub, p: p, flag: x.flag, cap: x.cap, fix: x.fix };
  }

  var STEPS = [
    {
      id: 'week', title: 'Your week',
      blurb: 'Start with time, because it is the constraint people are least honest about. Answer for a normal week, not your best one.',
      qs: [
        { id: 'away', dim: 'time', w: 1.3,
          q: 'On an ordinary weekday, how long is your home empty?',
          opts: [
            o('lt4',  'Under 4 hours', 'Someone is nearly always in', 1),
            o('4to6', '4 to 6 hours',  'Short day, or hybrid working', 0.85),
            o('7to9', '7 to 9 hours',  'A standard office day', 0.5,
              { fix: 'Seven-plus hours alone rules out puppies, most parrots and several breeds outright. Either budget for a midday walker or daycare, or choose an animal genuinely built for solitude.' }),
            o('10',   '10+ hours, or shifts', 'Long days, or unpredictable ones', 0.15,
              { flag: { level: 'bad', title: 'Nobody is home', text: 'At ten hours a day, a dog is not a realistic option without paid daily care. Cats, reptiles and fish cope; social mammals and birds do not.' },
                fix: 'Price a dog walker or daycare at your local rate before going further — it is often the largest line in the whole budget.' })
          ] },
        { id: 'active', dim: 'time', w: 1.2,
          q: 'How much active time could you truly give each day?',
          sub: 'Walking, playing, training, cleaning the enclosure. On a Tuesday in February, not on a Saturday in June.',
          opts: [
            o('lt15', 'Under 15 minutes', '', 0.2,
              { fix: 'This points firmly at a reptile, a fish tank or an independent adult cat — not at any dog.' }),
            o('15to30', '15 to 30 minutes', '', 0.5),
            o('30to60', '30 to 60 minutes', '', 0.8),
            o('gt60', 'An hour or more', '', 1)
          ] },
        { id: 'rhythm', dim: 'time', w: 0.8,
          q: 'Is your daily rhythm reliable?',
          sub: 'Most animals are fed, walked and medicated on a clock.',
          opts: [
            o('yes', 'Yes, fairly regular', '', 1),
            o('mostly', 'Mostly', '', 0.7),
            o('no', 'No, it varies a lot', '', 0.35,
              { fix: 'Irregular hours are workable with an automatic feeder and a flexible species. They are hard on dogs, who anticipate routine and stress when it breaks.' })
          ] },
        { id: 'hold', dim: 'time', w: 1,
          q: 'Will this schedule hold for the next few years?',
          opts: [
            o('yes', 'It should', '', 1),
            o('unsure', 'Hard to say', '', 0.5),
            o('no', 'No, it is about to change', '', 0.2,
              { fix: 'Wait until the new pattern is real. Acquiring an animal a month before your life reshapes is how animals end up in shelters.' })
          ] }
      ]
    },
    {
      id: 'home', title: 'Where you live',
      blurb: 'Housing is the single most common reason animals are given up. It is worth being blunt about it now.',
      qs: [
        { id: 'tenure', dim: 'home', w: 1.6,
          q: 'Do you rent or own?',
          opts: [
            o('own', 'I own my home', '', 1),
            o('rent-ok', 'I rent, pets are allowed', 'In writing', 0.92),
            o('rent-ask', 'I rent, I have not asked yet', '', 0.4,
              { flag: { level: 'warn', title: 'Ask your landlord first', text: 'Get it in writing before you fall in love with an animal. A verbal yes from a letting agent is not a lease clause.' },
                fix: 'Email your landlord today. One paragraph. Everything else in this plan depends on the answer.' }),
            o('rent-no', 'I rent, pets are not allowed', '', 0,
              { cap: 42,
                flag: { level: 'bad', title: 'Your lease says no', text: 'This is a hard stop, not a hurdle. Housing loss is one of the leading causes of surrender, and a hidden pet means an eviction risk that the animal ultimately pays for.' },
                fix: 'Either negotiate a written pet clause — often possible with a deposit — or wait until your next move and make pet permission a condition of it.' }),
            o('family', 'I live with family or housemates', '', 0.6,
              { fix: 'Get a specific agreement about who does what, and what happens if someone moves out. Vague goodwill collapses at 6am on a wet Tuesday.' })
          ] },
        { id: 'space', dim: 'home', w: 0.9,
          q: 'What kind of space is it?',
          opts: [
            o('studio', 'Studio or one-bed, no outdoor space', '', 0.5),
            o('flat', 'Flat with a balcony', '', 0.62),
            o('house-noyard', 'House, no garden', '', 0.75),
            o('house-yard', 'House with a garden', '', 1),
            o('rural', 'Rural, with land', '', 1)
          ] },
        { id: 'household', dim: 'home', w: 1.4,
          q: 'Is everyone you live with actually on board?',
          opts: [
            o('alone', 'I live alone', '', 1),
            o('yes', 'Yes, enthusiastically', '', 1),
            o('neutral', 'They are fine with it', '', 0.8),
            o('one-no', 'One person is not keen', '', 0.2,
              { cap: 58,
                flag: { level: 'bad', title: 'Somebody in the house said no', text: 'A reluctant housemate becomes a resentful one the first time the animal ruins something. The care almost always lands on the enthusiastic person, permanently.' },
                fix: 'Resolve this properly before anything else. A trial — fostering for a fortnight — settles the argument far better than persuasion does.' })
          ] },
        { id: 'move', dim: 'home', w: 1,
          q: 'Any chance you move in the next two years?',
          opts: [
            o('no', 'No', '', 1),
            o('local', 'Possibly, but locally', '', 0.75),
            o('likely', 'Likely, possibly to another country', '', 0.25,
              { flag: { level: 'warn', title: 'A move is coming', text: 'International relocation with an animal means quarantine rules, flight-approved crates and, for flat-faced breeds, airlines that will refuse to carry them at all. Budget 1,500 to 5,000 and several months of paperwork.' },
                fix: 'Check the import rules of your likely destination now — some countries require a rabies titre test six months before travel.' })
          ] }
      ]
    },
    {
      id: 'money', title: 'The money',
      blurb: 'Not the purchase price. The fifteen years after it, and the one bad night in the middle.',
      qs: [
        { id: 'slack', dim: 'money', w: 1.3, currency: true,
          q: 'After rent, bills and food, what is genuinely spare each month?',
          opts: [
            o('lt50', 'Under {50}', '', 0.1,
              { flag: { level: 'bad', title: 'No monthly room', text: 'Ongoing costs are relentless and non-negotiable. An animal you cannot feed and medicate comfortably is a source of stress for both of you.' },
                fix: 'A pair of gerbils or a small planted aquarium is genuinely affordable at this level. A dog is not.' }),
            o('50to120',  '{50} to {120}',  '', 0.45),
            o('120to250', '{120} to {250}', '', 0.75),
            o('250to500', '{250} to {500}', '', 0.95),
            o('gt500',    'More than {500}', '', 1)
          ] },
        { id: 'emergency', dim: 'money', w: 1.6, currency: true,
          q: 'A vet hands you a {3000} bill tomorrow night. What happens?',
          opts: [
            o('savings', 'I pay it from savings', 'Uncomfortable, not a crisis', 1),
            o('tight', 'I could, but it would hurt', '', 0.7),
            o('credit', 'Credit card or a payment plan', '', 0.35,
              { flag: { level: 'warn', title: 'Emergencies are not rare', text: 'Roughly one in three pets needs unplanned veterinary treatment each year, and the emergency clinic charges two to three times the daytime rate.' },
                fix: 'Open a separate account and start it at {40} a month from today. After a year you have a cushion; after three you have a real one.' }),
            o('cant', 'I could not pay it', '', 0,
              { flag: { level: 'bad', title: 'This is the decision that hurts most', text: 'Owners without a buffer end up choosing treatment by price, and sometimes choosing euthanasia for something treatable. It is the most avoidable form of grief in pet ownership.' },
                fix: 'Insurance or a dedicated savings pot is not optional at this level — it is the entire difference between a bad week and an unbearable one.' })
          ] },
        { id: 'insure', dim: 'money', w: 1,
          q: 'Would you insure, or fund a dedicated savings pot?',
          opts: [
            o('yes', 'Yes, from day one', '', 1),
            o('maybe', 'Probably', '', 0.6),
            o('no', 'No', '', 0.25,
              { fix: 'If you skip insurance, the discipline has to come from somewhere — automate a standing transfer the same day the animal arrives.' })
          ] },
        { id: 'income', dim: 'money', w: 0.9,
          q: 'How steady is your income over the next three years?',
          opts: [
            o('stable', 'Very steady', '', 1),
            o('mostly', 'Mostly steady', '', 0.75),
            o('uncertain', 'Uncertain', '', 0.35,
              { fix: 'Favour a shorter-lived, lower-cost species until the picture settles. A three-year commitment you can honour beats a fifteen-year one you cannot.' })
          ] }
      ]
    },
    {
      id: 'life', title: 'Your next decade',
      blurb: 'A kitten adopted today is still with you in 2041. Answer for that horizon, not for this year.',
      qs: [
        { id: 'travel', dim: 'life', w: 1.1,
          q: 'How many nights a year are you away from home?',
          opts: [
            o('lt7', 'Under a week', '', 1),
            o('7to21', 'One to three weeks', '', 0.85),
            o('21to45', 'Three to six weeks', '', 0.55,
              { fix: 'At this level, boarding is a real annual line item — often 800 to 2,000 for a dog. Put it in the budget now rather than discovering it in July.' }),
            o('gt45', 'More than six weeks, or frequent trips', '', 0.25,
              { flag: { level: 'warn', title: 'You travel a lot', text: 'Every trip needs a plan, and a boarding kennel over the holidays is charged at peak rates. Cats and reptiles absorb this far better than dogs and parrots.' },
                fix: 'A house-sitting arrangement or a reciprocal deal with another owner costs far less than kennels and is kinder to the animal.' })
          ] },
        { id: 'horizon', dim: 'life', w: 1.6,
          q: 'How far ahead can you honestly commit?',
          opts: [
            o('lt3', 'Under three years', '', 0.15,
              { cap: 62,
                flag: { level: 'bad', title: 'Shorter than most pets live', text: 'Almost nothing on our list lives under three years except hamsters and some rodents. Committing to less than a lifespan means planning, from the outset, to rehome.' },
                fix: 'Foster instead. Rescues are desperate for short-term foster homes, you get the animal, and the ending is planned rather than a failure.' }),
            o('3to7', 'Three to seven years', '', 0.45,
              { fix: 'This suits rats, guinea pigs, gerbils or an older rescue animal — a genuinely good option that most people never consider.' }),
            o('8to15', 'Eight to fifteen years', '', 0.85),
            o('gt15', 'Fifteen years or more', '', 1)
          ] },
        { id: 'changes', dim: 'life', w: 1,
          q: 'Any large changes on the table?',
          sub: 'A baby, a degree, a new country, a job with much longer hours.',
          opts: [
            o('none', 'Nothing planned', '', 1),
            o('one', 'One, and I have thought about how a pet fits', '', 0.7),
            o('several', 'Several, or I am not sure', '', 0.3,
              { flag: { level: 'warn', title: 'Life is in motion', text: 'New babies and new countries are the two changes that most often end in surrender. Neither has to — but both need a plan made before the animal arrives, not after.' },
                fix: 'Write down, in one sentence each, what happens to the animal in each scenario. If any sentence is difficult to finish, wait.' })
          ] }
      ]
    },
    {
      id: 'support', title: 'Backup and experience',
      blurb: 'What happens on the day you cannot be there.',
      qs: [
        { id: 'backup', dim: 'support', w: 1.4,
          q: 'You are in hospital for a week. Who takes the animal?',
          opts: [
            o('named', 'A specific person who has already agreed', '', 1),
            o('paid', 'I would pay a boarding kennel or sitter', '', 0.7),
            o('probably', 'Someone would, probably', '', 0.5,
              { fix: 'Turn "probably" into a name and a yes. Ask them this week — it takes one message and removes the single most fragile point in your plan.' }),
            o('nobody', 'I genuinely do not know', '', 0.15,
              { flag: { level: 'bad', title: 'No safety net', text: 'Everyone gets ill, and animals cannot wait. Without a named backup, a hospital stay becomes an emergency surrender.' },
                fix: 'Line up two people and give each a key and the vet’s number before you bring an animal home.' })
          ] },
        { id: 'experience', dim: 'support', w: 0.9,
          q: 'Have you been the person responsible for an animal?',
          opts: [
            o('primary', 'Yes, as the main carer', '', 1),
            o('family', 'We had pets growing up — my parents did the work', '', 0.55,
              { fix: 'Being around a pet and running one are different jobs. Volunteering at a shelter for a month is the cheapest, fastest way to close that gap.' }),
            o('none', 'No, this would be my first', '', 0.35,
              { fix: 'Start with a forgiving species and an adult animal rather than a baby one. Adult rescues arrive with a known temperament and, often, some training already done.' })
          ] },
        { id: 'allergy', dim: 'support', w: 1.1,
          q: 'Anyone in the household with animal allergies or asthma?',
          opts: [
            o('no', 'No', '', 1),
            o('mild', 'Mild, and manageable', '', 0.6,
              { flag: { level: 'warn', title: 'Test before you commit', text: 'Allergen exposure at a friend’s house for two hours is not the same as living in it. Note that "hypoallergenic" breeds are a marketing term — the allergen is in saliva and skin, not just hair.' },
                fix: 'Spend a full day, twice, in a home with the species you are considering before deciding anything.' }),
            o('severe', 'Yes, significant', '', 0.15,
              { flag: { level: 'bad', title: 'Significant allergy in the home', text: 'Rehoming after a severe reaction is common and avoidable. Reptiles, fish and, at a stretch, some low-shedding breeds are the honest options here.' },
                fix: 'See an allergist first and get tested for the specific species. It is a cheap test and it settles the question properly.' })
          ] }
      ]
    },
    {
      id: 'motive', title: 'Why now',
      blurb: 'Nothing in this section disqualifies you. It is here because knowing your own reason changes which animal is right, and how prepared you need to be.',
      qs: [
        { id: 'why', dim: 'motive', w: 1.1,
          q: 'What is actually driving this?',
          opts: [
            o('considered', 'I have wanted one for years and finally have the conditions', '', 1),
            o('kids', 'The children have been asking', '', 0.5,
              { flag: { level: 'warn', title: 'The adult is the owner', text: 'Children reliably lose interest within months. Every study and every shelter agrees on this. Assume the daily care becomes yours and choose an animal you personally want.' },
                fix: 'Pick the pet you would happily care for alone. If the answer is none, the honest move is a shelter volunteering day instead.' }),
            o('lonely', 'I am lonely, or going through something hard', '', 0.5,
              { flag: { level: 'warn', title: 'A good reason that needs care', text: 'Animals genuinely help — this is well evidenced. The risk is choosing a demanding one at a low-capacity moment, which adds pressure precisely when you have least of it.' },
                fix: 'Lean toward an adult, settled, low-demand animal. An older cat from a shelter gives you the companionship without the training project.' }),
            o('grief', 'We lost a pet recently', '', 0.5,
              { flag: { level: 'warn', title: 'Give it a beat', text: 'A new animal will not be the one you lost, and comparison is hard on both of you. Many rescues suggest waiting a few months — not as a rule, but because the new animal deserves to be chosen for itself.' } }),
            o('impulse', 'I saw one and fell for it', '', 0.2,
              { flag: { level: 'warn', title: 'The most expensive way to choose', text: 'Impulse acquisition correlates strongly with surrender, and it is how people end up with a husky in a hot flat. The animal is not the problem — the two-day decision is.' },
                fix: 'Wait two weeks. If it still feels right, work through the cost and matching tools before contacting anyone.' })
          ] },
        { id: 'research', dim: 'motive', w: 1,
          q: 'How far have you looked into the animal you have in mind?',
          opts: [
            o('deep', 'Properly — traits, costs, common health problems', '', 1),
            o('some', 'A bit', '', 0.6),
            o('none', 'Not really, or I have not decided yet', '', 0.35,
              { fix: 'That is what the other two tools here are for. Run the cost check and the matcher before you speak to a breeder or a shelter.' })
          ] },
        { id: 'worst', dim: 'motive', w: 1,
          q: 'Have you pictured the unglamorous version?',
          sub: 'Six in the morning in the rain. Chewed skirting boards. Cleaning up sickness. Incontinence at fourteen, and the decision at the end of it.',
          opts: [
            o('yes', 'Yes, and I accept it', '', 1),
            o('sortof', 'Sort of', '', 0.6),
            o('no', 'Honestly, no', '', 0.25,
              { fix: 'Spend a weekend fostering or shelter-volunteering. Everyone should meet the unglamorous version before they sign up for a decade of it.' })
          ] }
      ]
    }
  ];

  var BANDS = [
    { min: 82, key: 'ready',    title: 'You are ready',                  color: 'var(--good)',
      line: 'Your circumstances genuinely support an animal. The remaining work is choosing the right one rather than deciding whether to.' },
    { min: 66, key: 'cond',     title: 'Ready, with conditions',         color: 'var(--moss)',
      line: 'The foundation is solid and there are one or two things to sort out first. Handle them and this becomes a straightforward yes.' },
    { min: 46, key: 'notyet',   title: 'Not yet — and that is fixable',  color: 'var(--warn)',
      line: 'Nothing here says never. It says the gap between your situation and a good home for an animal is real, and most of it is closeable within a year.' },
    { min: 0,  key: 'no',       title: 'This is not the moment',         color: 'var(--bad)',
      line: 'On your own answers, taking an animal now would most likely end badly for it and expensively for you. That is worth knowing before rather than after.' }
  ];

  /* ---------------- Currency-aware label interpolation ---------------- */

  function fill(text) {
    return String(text).replace(/\{(\d+)\}/g, function (_, n) {
      return M.money(parseInt(n, 10));
    });
  }

  /* ---------------- Render ---------------- */

  var root, form, allQs = [];

  function buildQuestion(q) {
    var html = '<div class="field" data-q="' + q.id + '">';
    html += '<div class="field__label" style="display:block"><span>' + fill(q.q) + '</span></div>';
    if (q.sub) html += '<p class="field__hint" style="margin:-4px 0 11px">' + fill(q.sub) + '</p>';
    html += '<div class="options options--grid">';
    q.opts.forEach(function (op) {
      html += '<label class="opt"><input type="radio" name="' + q.id + '" value="' + op.v + '">' +
              '<span><b>' + fill(op.l) + '</b>' +
              (op.sub ? '<small>' + fill(op.sub) + '</small>' : '') +
              '</span></label>';
    });
    html += '</div></div>';
    return html;
  }

  function render() {
    var html = '';
    STEPS.forEach(function (st, i) {
      html += '<section class="step" data-step="' + i + '">' +
                '<div class="step__head">' +
                  '<span class="step__num">Step ' + (i + 1) + ' of ' + STEPS.length + ' — ' + st.title + '</span>' +
                  '<h3>' + st.title + '</h3>' +
                  '<p class="muted small measure" style="margin:0">' + st.blurb + '</p>' +
                '</div>';
      st.qs.forEach(function (q) { html += buildQuestion(q); });
      html += '</section>';
    });
    form.querySelector('[data-steps]').innerHTML = html;

    STEPS.forEach(function (st) { st.qs.forEach(function (q) { allQs.push(q); }); });
  }

  /* ---------------- Wizard navigation ---------------- */

  var current = 0;

  function stepNodes() { return form.querySelectorAll('.step'); }

  function showStep(i) {
    var nodes = stepNodes();
    current = M.clamp(i, 0, nodes.length - 1);
    Array.prototype.forEach.call(nodes, function (n, k) {
      n.classList.toggle('is-active', k === current);
    });
    var pct = ((current) / nodes.length) * 100;
    form.querySelector('[data-progress]').style.width = pct + '%';
    form.querySelector('[data-progress-label]').textContent = 'Step ' + (current + 1) + ' / ' + nodes.length;
    form.querySelector('[data-back]').disabled = current === 0;
    var isLast = current === nodes.length - 1;
    form.querySelector('[data-next]').textContent = isLast ? 'See my result' : 'Continue';
    var top = form.getBoundingClientRect().top + window.scrollY - 96;
    if (window.scrollY > top) window.scrollTo({ top: top, behavior: 'smooth' });
  }

  function unanswered(stepIndex) {
    return STEPS[stepIndex].qs.filter(function (q) {
      return !M.val(form, q.id, null);
    });
  }

  function flagMissing(qs) {
    qs.forEach(function (q) {
      var node = form.querySelector('[data-q="' + q.id + '"]');
      node.style.outline = '2px solid var(--bad)';
      node.style.outlineOffset = '10px';
      node.style.borderRadius = 'var(--r-sm)';
      setTimeout(function () { node.style.outline = 'none'; }, 2200);
    });
    var first = form.querySelector('[data-q="' + qs[0].id + '"]');
    window.scrollTo({ top: first.getBoundingClientRect().top + window.scrollY - 130, behavior: 'smooth' });
  }

  /* ---------------- Scoring ---------------- */

  function score() {
    var dimTotals = {}, dimWeights = {};
    DIMS.forEach(function (d) { dimTotals[d.id] = 0; dimWeights[d.id] = 0; });

    var flags = [], fixes = [], cap = 100, answers = {};

    allQs.forEach(function (q) {
      var v = M.val(form, q.id, null);
      var op = null;
      for (var i = 0; i < q.opts.length; i++) if (q.opts[i].v === v) op = q.opts[i];
      if (!op) return;
      answers[q.id] = v;

      dimTotals[q.dim] += op.p * q.w;
      dimWeights[q.dim] += q.w;

      if (op.flag) flags.push({ level: op.flag.level, title: op.flag.title, text: fill(op.flag.text) });
      if (op.cap != null && op.cap < cap) cap = op.cap;
      if (op.fix) {
        var dimW = 0.15;
        DIMS.forEach(function (d) { if (d.id === q.dim) dimW = d.w; });
        fixes.push({
          text: fill(op.fix),
          heading: fill(q.q),
          weight: (1 - op.p) * q.w * dimW
        });
      }
    });

    var dims = DIMS.map(function (d) {
      var pct = dimWeights[d.id] ? (dimTotals[d.id] / dimWeights[d.id]) * 100 : 0;
      return { id: d.id, name: d.name, w: d.w, pct: Math.round(pct) };
    });

    var raw = 0;
    dims.forEach(function (d) { raw += d.pct * d.w; });

    var total = Math.round(Math.min(raw, cap));
    var capped = raw > cap + 0.5;

    fixes.sort(function (a, b) { return b.weight - a.weight; });

    var band = BANDS[BANDS.length - 1];
    for (var i = 0; i < BANDS.length; i++) if (total >= BANDS[i].min) { band = BANDS[i]; break; }

    return { total: total, raw: Math.round(raw), capped: capped, cap: cap,
             dims: dims, flags: flags, fixes: fixes.slice(0, 5), answers: answers };
  }

  /* ---------------- Result rendering ---------------- */

  function icon(level) {
    if (level === 'good') return '<svg class="flag__icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 10.5l4 4 8-9" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    if (level === 'bad') return '<svg class="flag__icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="10" cy="10" r="7.5"/><path d="M10 6v5M10 13.6v.1" stroke-linecap="round"/></svg>';
    return '<svg class="flag__icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 3.2l7 12.4H3z" stroke-linejoin="round"/><path d="M10 8v3.4M10 13.7v.1" stroke-linecap="round"/></svg>';
  }

  /* Translate the answers into constraints the matcher can consume. */
  function constraintsFrom(a) {
    var aloneMap  = { lt4: 3, '4to6': 6, '7to9': 9, '10': 11 };
    var activeMap = { lt15: 12, '15to30': 25, '30to60': 45, gt60: 90 };
    var spaceMap  = { studio: 'studio', flat: 'flat', 'house-noyard': 'house', 'house-yard': 'yard', rural: 'yard' };
    var budgetMap = { lt50: 1, '50to120': 2, '120to250': 3, '250to500': 4, gt500: 5 };
    var horizonMap = { lt3: 3, '3to7': 7, '8to15': 15, gt15: 20 };
    return {
      alone:   aloneMap[a.away] != null ? aloneMap[a.away] : 8,
      active:  activeMap[a.active] != null ? activeMap[a.active] : 30,
      space:   spaceMap[a.space] || 'flat',
      budget:  budgetMap[a.slack] || 3,
      allergy: a.allergy || 'no',
      horizon: horizonMap[a.horizon] || 12,
      novice:  a.experience === 'primary' ? 'exp' : (a.experience === 'family' ? 'some' : 'first')
    };
  }

  function showResult(r) {
    var out = document.getElementById('result');

    var C = 2 * Math.PI * 74;
    var offset = C * (1 - r.total / 100);

    var html = '';

    html += '<div class="verdict reveal is-in" style="--vc:' + r.band.color + '">' +
      '<div class="verdict__grid">' +
        '<div class="dial">' +
          '<svg viewBox="0 0 168 168"><circle class="dial__track" cx="84" cy="84" r="74"/>' +
          '<circle class="dial__val" cx="84" cy="84" r="74" stroke-dasharray="' + C + '" stroke-dashoffset="' + C + '" data-dial/></svg>' +
          '<div class="dial__center"><b data-count>0</b><span>Readiness</span></div>' +
        '</div>' +
        '<div>' +
          '<p class="verdict__title">' + r.band.title + '</p>' +
          '<p class="lede" style="font-size:1.02rem;margin-bottom:16px">' + r.band.line + '</p>' +
          (r.capped
            ? '<div class="note" style="background:var(--bad-soft);color:var(--bad)"><b>Capped at ' + r.cap + '.</b> Your answers scored ' + r.raw + ' overall, but at least one response is a genuine blocker rather than a weak spot. Those are listed below, and they have to be resolved first — no amount of strength elsewhere substitutes.</div>'
            : '') +
        '</div>' +
      '</div></div>';

    /* Dimensions */
    html += '<div class="grid grid-2" style="margin-top:18px">';
    html += '<div class="card"><h4 style="margin-bottom:18px">Where you stand</h4><div class="meters">';
    r.dims.slice().sort(function (a, b) { return a.pct - b.pct; }).forEach(function (d) {
      html += '<div class="meter"><div class="meter__top"><span class="meter__name">' + d.name + '</span>' +
              '<span class="meter__score">' + d.pct + '</span></div>' +
              '<div class="meter__bar"><div class="meter__fill" data-w="' + d.pct + '" style="background:' + M.scoreColor(d.pct) + '"></div></div></div>';
    });
    html += '</div><p class="tiny muted" style="margin-top:16px">Weighted: time 24%, money 22%, home 18%, life stability 15%, support 11%, motivation 10%.</p></div>';

    /* Flags */
    html += '<div class="card"><h4 style="margin-bottom:18px">' +
            (r.flags.length ? 'What we noticed' : 'No red flags') + '</h4><div class="flags">';
    if (!r.flags.length) {
      html += '<div class="flag flag--good">' + icon('good') +
              '<div><b>Nothing is standing in your way</b><p>None of your answers raised a blocker or a warning. That is unusual and it is a good sign.</p></div></div>';
    } else {
      r.flags.sort(function (a, b) { return (a.level === 'bad' ? 0 : 1) - (b.level === 'bad' ? 0 : 1); });
      r.flags.forEach(function (f) {
        html += '<div class="flag flag--' + f.level + '">' + icon(f.level) +
                '<div><b>' + f.title + '</b><p>' + f.text + '</p></div></div>';
      });
    }
    html += '</div></div></div>';

    /* Fix list */
    if (r.fixes.length) {
      html += '<div class="card" style="margin-top:18px"><h4 style="margin-bottom:6px">What to fix first</h4>' +
              '<p class="small muted" style="margin-bottom:20px">Ordered by how much each one is actually costing you.</p>' +
              '<ol style="margin:0;padding-left:0;list-style:none">';
      r.fixes.forEach(function (f, i) {
        html += '<li style="display:grid;grid-template-columns:auto 1fr;gap:15px;padding:15px 0;border-top:1px solid var(--line-soft)">' +
          '<span class="match__rank" style="width:30px;height:30px;font-size:.9rem">' + (i + 1) + '</span>' +
          '<div><b style="font-size:.9rem;display:block;margin-bottom:4px">' + f.heading + '</b>' +
          '<p class="small muted" style="margin:0">' + f.text + '</p></div></li>';
      });
      html += '</ol></div>';
    }

    /* Next steps */
    var c = constraintsFrom(r.answers);
    var nextLine = r.total >= 66
      ? 'Next: find out what it actually costs where you live, then narrow down which animal fits the life you just described.'
      : 'If you want to keep exploring anyway — and you should, because knowing the numbers is how the gap closes — start with the cost picture.';

    html += '<div class="card card--sand" style="margin-top:18px">' +
      '<h4 style="margin-bottom:8px">Where to go from here</h4>' +
      '<p class="small muted measure" style="margin-bottom:20px">' + nextLine + '</p>' +
      '<div class="row">' +
        '<a class="btn btn--primary" href="cost.html">Run the cost reality check</a>' +
        '<a class="btn btn--ghost" href="match.html?from=readiness">Find my match</a>' +
        '<button type="button" class="btn btn--quiet no-print" data-print>Save as PDF</button>' +
        '<button type="button" class="btn btn--quiet" data-restart>Start again</button>' +
      '</div>' +
      '<p class="tiny muted" style="margin-top:16px">Your answers stay in this browser. Nothing is uploaded anywhere.</p>' +
    '</div>';

    out.innerHTML = html;

    M.store.set('readiness', { total: r.total, constraints: c, at: Date.now() });

    M.revealResult(out);
    form.querySelector('.wizard').style.display = 'none';

    /* Animate */
    requestAnimationFrame(function () {
      var dial = out.querySelector('[data-dial]');
      if (dial) dial.style.strokeDashoffset = offset;
      M.countTo(out.querySelector('[data-count]'), r.total, function (n) { return Math.round(n); }, 1000);
      Array.prototype.forEach.call(out.querySelectorAll('.meter__fill'), function (n) {
        n.style.width = n.getAttribute('data-w') + '%';
      });
    });

    out.querySelector('[data-print]').addEventListener('click', function () { window.print(); });
    out.querySelector('[data-restart]').addEventListener('click', function () {
      form.reset();
      out.innerHTML = '';
      out.classList.remove('is-active');
      form.querySelector('.wizard').style.display = '';
      showStep(0);
      window.scrollTo({ top: form.getBoundingClientRect().top + window.scrollY - 120, behavior: 'smooth' });
    });
  }

  /* ---------------- Init ---------------- */

  function init() {
    root = document.getElementById('readiness');
    if (!root) return;
    form = root;

    render();
    showStep(0);

    form.querySelector('[data-next]').addEventListener('click', function () {
      var missing = unanswered(current);
      if (missing.length) { flagMissing(missing); return; }
      if (current === STEPS.length - 1) {
        var r = score();
        var band = BANDS[BANDS.length - 1];
        for (var i = 0; i < BANDS.length; i++) if (r.total >= BANDS[i].min) { band = BANDS[i]; break; }
        r.band = band;
        showResult(r);
      } else {
        showStep(current + 1);
      }
    });

    form.querySelector('[data-back]').addEventListener('click', function () { showStep(current - 1); });

    /* Advance automatically when the last question on a step is answered. */
    form.addEventListener('change', function (e) {
      if (e.target.type !== 'radio') return;
      if (unanswered(current).length === 0 && current < STEPS.length - 1) {
        setTimeout(function () { showStep(current + 1); }, 260);
      }
    });

    /* Re-render currency-dependent copy when the region changes. */
    document.addEventListener('mibowi:region', function () {
      var saved = {};
      allQs.forEach(function (q) { saved[q.id] = M.val(form, q.id, null); });
      allQs.length = 0;
      render();
      allQs.forEach(function (q) {
        if (saved[q.id]) {
          var input = form.querySelector('[name="' + q.id + '"][value="' + saved[q.id] + '"]');
          if (input) input.checked = true;
        }
      });
      showStep(current);
    });

    form.addEventListener('submit', function (e) { e.preventDefault(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
