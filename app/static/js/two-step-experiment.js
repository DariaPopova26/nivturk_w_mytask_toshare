//---------------------------------------//
// Define experiment parameters.
//---------------------------------------//

// Define transition probabilities.
// Note: this version uses a simple 50/50 probabilistic split for the
// non-deterministic ship.

// Define timing parameters
const choice_duration = 10000;
const feedback_duration = 1200;

// Define randomization parameters
const randomize_s1 = true;             // randomize left/right position of state 1 rockets
const randomize_s2 = false;            // keep left/right position of state 2 aliens stable (current version of the experiment)

// Define quality assurance parameters
var missed_threshold = 6;
var missed_responses = 0;

//---------------------------------------//
// Define stimulus features.
//---------------------------------------//

// Define stimulus constants (6 colors: green, purple, red, blue, pink, yellow)
const planet_colors = ['#5b7c65','#706081','#7f5d5d','#5f6f81','#d16ba5','#d9b24c'];
const font_colors = ['#398667','#754198','#aa5349','#416598','#b33c86','#b38600'];
const color_names = ['green','purple','red','blue','pink','yellow'];

// Rocket palette: colors distinct from planet color hexes. These will be
// sampled so that ship colors are not used for aliens (which use the planet colors)
const rocket_palette = [
  '#FFD700', // gold
  '#FF69B4', // hot pink
  '#00CED1', // neon blue
  '#9DE82B', // neon green
  '#FFA500', // orange
  '#8A2BE2', // violet
  '#FF4500', // orange red
  '#4de0a0ff', // lturquoise
  '#0681aaff', // deep  blue
  '#8a6dbfff', // pastel purple
  '#FF1493', // deep pink
  '#354e1bff'  // deep green
];

// Helper to convert hex to RGB; supports 6 or 8 digit hex
function hexToRgb(hex) {
  const clean = hex.replace('#','');
  const h = clean.length === 8 ? clean.slice(0,6) : clean;
  const int = parseInt(h, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255
  };
}

function colorDistanceSquared(h1, h2) {
  const a = hexToRgb(h1); const b = hexToRgb(h2);
  const dr = a.r - b.r, dg = a.g - b.g, db = a.b - b.b;
  return dr*dr + dg*dg + db*db;
}

function minDistanceToPlanets(color, planetHexes) {
  return Math.min(...planetHexes.map(p => colorDistanceSquared(color, p)));
}

// Weighted sample without replacement (weights aligned to items array).
function weightedSampleNoReplace(items, weights, k) {
  const selected = [];
  const pool = items.map((item, idx) => ({ item, w: Math.max(weights[idx], 0) }));
  for (let i = 0; i < k && pool.length > 0; i++) {
    const total = pool.reduce((acc, x) => acc + x.w, 0);
    if (total <= 0) {
      // fallback uniform if all weights zero
      const choice = jsPsych.randomization.sampleWithoutReplacement(pool, 1)[0];
      selected.push(choice.item);
      pool.splice(pool.indexOf(choice), 1);
      continue;
    }
    let r = Math.random() * total;
    let pickIdx = 0;
    for (let j = 0; j < pool.length; j++) {
      r -= pool[j].w;
      if (r <= 0) { pickIdx = j; break; }
    }
    selected.push(pool[pickIdx].item);
    pool.splice(pickIdx, 1);
  }
  return selected;
}

// Deterministic rocket color is selected per block (always leads to planet 0 for that block)

// Build block-specific stimulus assignments. For each of 5 blocks, choose 3 planet
// colors (from 6), assign all 6 alien types (1..6) randomly into the 3 planets
// (two alien types per planet), and choose two rocket colors from the rocket
// palette that are not the planet color hexes
const NUM_BLOCKS = 5;
const block_task_info = [];
let prev_planet_indices = null;
let prev_rocket_colors = null;

for (let b = 0; b < NUM_BLOCKS; b++) {
  let planet_indices;
  if (prev_planet_indices === null) {
    planet_indices = jsPsych.randomization.shuffle([0,1,2,3,4,5]).slice(0,3);
  } else {
    const allColors = [0,1,2,3,4,5];
    const weights = allColors.map(idx => prev_planet_indices.includes(idx) ? 1 : 3);
    planet_indices = weightedSampleNoReplace(allColors, weights, 3);
  }
  prev_planet_indices = planet_indices.slice();
  // Shuffle alien types 1..6 and assign two per planet
  const types = jsPsych.randomization.shuffle([1,2,3,4,5,6]);
  const aliens = [];
  for (let p = 0; p < 3; p++) {
    const t1 = types[2*p];
    const t2 = types[2*p + 1];
    aliens.push('/static/img/aliens_svg/A' + t1 + '-' + color_names[planet_indices[p]] + '.svg');
    aliens.push('/static/img/aliens_svg/A' + t2 + '-' + color_names[planet_indices[p]] + '.svg');
  }

  // Choose rocket colors far from the current planet colors AND from each other.
  const planet_hexes = planet_indices.map(i => planet_colors[i]);
  const DIST_THRESH = 80 * 80; // squared distance threshold
  const ROCKET_DIST_THRESH = 80 * 80; // squared distance between rockets
  
  // Find two rockets that are both far from planets and far from each other
  let rocket_colors = null;
  const candidate_pairs = [];
  
  for (let i = 0; i < rocket_palette.length; i++) {
    for (let j = i + 1; j < rocket_palette.length; j++) {
      const r1 = rocket_palette[i];
      const r2 = rocket_palette[j];
      
      // Check if both rockets are far from all planets
      const r1_dist_to_planets = minDistanceToPlanets(r1, planet_hexes);
      const r2_dist_to_planets = minDistanceToPlanets(r2, planet_hexes);
      
      if (r1_dist_to_planets > DIST_THRESH && r2_dist_to_planets > DIST_THRESH) {
        // Check if rockets are far from each other
        const rockets_dist = colorDistanceSquared(r1, r2);
        if (rockets_dist > ROCKET_DIST_THRESH) {
          // Track candidate pairs with their minimum distance
          const min_dist = Math.min(r1_dist_to_planets, r2_dist_to_planets, rockets_dist);
          candidate_pairs.push({ pair: [r1, r2], min_dist });
        }
      }
    }
  }
  
  if (candidate_pairs.length === 0) {
    // Fallback: pick any two that satisfy planet distance, then sort by mutual distance
    let candidates = rocket_palette.filter(c => minDistanceToPlanets(c, planet_hexes) > DIST_THRESH);
    if (candidates.length < 2) {
      candidates = rocket_palette.slice();
    }
    candidates = jsPsych.randomization.shuffle(candidates);
    rocket_colors = candidates.slice(0, 2);
  } else {
    // Prefer pairs that avoid repeating rocket colors from the previous block
    let filtered_pairs = candidate_pairs;
    if (prev_rocket_colors && prev_rocket_colors.length) {
      const no_overlap = candidate_pairs.filter(c => !prev_rocket_colors.includes(c.pair[0]) && !prev_rocket_colors.includes(c.pair[1]));
      if (no_overlap.length > 0) {
        filtered_pairs = no_overlap;
      }
    }

    // Choose the pair with the largest minimum distance
    filtered_pairs.sort((a, b) => b.min_dist - a.min_dist);
    rocket_colors = jsPsych.randomization.shuffle(filtered_pairs[0].pair);
  }

  // Randomly pick which rocket color is deterministic for this block
  const deterministic_rocket_color = rocket_colors[Math.floor(Math.random() * 2)];

  block_task_info.push({
    planet_colors: planet_indices.map(i => planet_colors[i]),
    font_colors: planet_indices.map(i => font_colors[i]),
    planet_names: planet_indices.map(i => color_names[i]),
    rocket_colors: rocket_colors,
    rocket_names: rocket_colors.map((_, idx) => 'ship' + (idx+1)),
    aliens: aliens,
    deterministic_rocket_color: deterministic_rocket_color
  });

  // Track rocket colors used in this block to reduce repetition in the next block
  prev_rocket_colors = rocket_colors.slice();
}


//---------------------------------------//
// Define reward outcomes.
//---------------------------------------//

// Define reward outcomes.
// Use noise-based rewards from two-step-drifts-with-noise.js

// Number of trials (debug if need)
const TEST_TRIALS_PER_BLOCK = 40; // 40 trials per block

// Build all preload images from all blocks for jsPsych
const preload_images = [];
block_task_info.forEach(info => {
  preload_images.push(...info.aliens);
});
// Preload practice aliens (created after practice_info below)
// Will be added after practice_info is created

// Store all blocks' drifts in an array
const all_block_drifts = [];
const block_indices = [0, 1, 2, 3, 4];
block_indices.forEach(ix => {
  const drifts_full = (typeof window !== 'undefined' && window.all_noisy_drifts) ? window.all_noisy_drifts[ix] : [drifts_01, drifts_02, drifts_03, drifts_04, drifts_05][ix];
  const drifts = drifts_full.slice(0, TEST_TRIALS_PER_BLOCK);
  all_block_drifts.push(drifts);
});

// Define practice stimuli from the first block
const practice_info = Object.assign({}, block_task_info[0]);

// Create practice aliens with P-label (P1-P6 for each color)
// For practice, use 6 P-labeled aliens (all 6 types across the 3 planets of first block)
practice_info.aliens = [];
for (let t = 1; t <= 6; t++) {
  const planet_idx = Math.floor((t - 1) / 2);
  // planet_names already contains color names (e.g., 'green', 'purple')
  const planet_color = practice_info.planet_names[planet_idx];
  practice_info.aliens.push('/static/img/aliens_svg/P' + t + '-' + planet_color + '.svg');
}

// Add practice aliens to preload
preload_images.push(...practice_info.aliens);

//---------------------------------------//
// Define experiment timeline.
//---------------------------------------//

// Preallocate space for all blocks and their trials.
var TWO_STEP_TASK = [];

// Build a transition map (rockets -> planets) for a given block
function buildTransitionMapHtml(task_info, block_num) {
  const rocket_colors = task_info.rocket_colors;
  const planet_colors = task_info.font_colors || task_info.planet_colors;
  const deterministic_color = task_info.deterministic_rocket_color;
  const deterministic_index = rocket_colors.indexOf(deterministic_color);
  const other_index = deterministic_index === 0 ? 1 : 0;

  // positions for SVG
  const r1x = 170, r2x = 430, ry = 300;
  const p1x = 150, p2x = 300, p3x = 450, py = 45;

  return `
  <div class="transition-map-wrapper">
    <style>
      .transition-map-wrapper { display: flex; justify-content: center; align-items: center; }
      .transition-map-title { text-align: center; font-size: 20px; margin: 6px 0 12px; color: #ffffff; }
      .transition-map {
        position: relative;
        width: 600px;
        height: 360px;
        --width: 560px;
        background: url('/static/img/background-stars.png') center / cover no-repeat;
        border-radius: 12px;
      }
      .transition-map-svg { position: absolute; left: 0; top: 0; }
      .transition-map .transition-rocket {
        position: absolute;
        bottom: 0;
        transform: translate(-50%, 0) scale(0.8);
        z-index: 2;
      }
    </style>
    <div>
      <div class="transition-map-title">Rocketship to planet transition map for Block ${block_num}</div>
      <div class="transition-map">
        <svg class="transition-map-svg" width="600" height="360" viewBox="0 0 600 360" aria-label="Rocket to planet transitions">
          <defs>
            <marker id="arrow" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L6,3 z" fill="#ffffff" />
            </marker>
          </defs>

          <!-- planets -->
          <circle cx="${p1x}" cy="${py}" r="36" fill="${planet_colors[0]}" stroke="#ffffff" stroke-width="3"></circle>
          <circle cx="${p2x}" cy="${py}" r="36" fill="${planet_colors[1]}" stroke="#ffffff" stroke-width="3"></circle>
          <circle cx="${p3x}" cy="${py}" r="36" fill="${planet_colors[2]}" stroke="#ffffff" stroke-width="3"></circle>

          <!-- arrows: deterministic rocket to planet 0 -->
          <line x1="${deterministic_index === 0 ? r1x : r2x}" y1="${ry-70}" x2="${p1x}" y2="${py+45}" stroke="#ffffff" stroke-width="3" marker-end="url(#arrow)" />

          <!-- arrows: other rocket to planets 1 and 2 -->
          <line x1="${other_index === 0 ? r1x : r2x}" y1="${ry-70}" x2="${p2x}" y2="${py+45}" stroke="#ffffff" stroke-width="3" marker-end="url(#arrow)" />
          <line x1="${other_index === 0 ? r1x : r2x}" y1="${ry-70}" x2="${p3x}" y2="${py+45}" stroke="#ffffff" stroke-width="3" marker-end="url(#arrow)" />
        </svg>

        <!-- rockets (HTML) -->
        <div class="rocket transition-rocket" state="map" style="left: ${r1x}px;">
          <div class="rocket-body">
            <div class="rocket-window" style="background: ${rocket_colors[0]}"></div>
            <div class="rocket-studs"></div>
            <div class="rocket-fin" side="0" style="background: ${rocket_colors[0]}"></div>
            <div class="rocket-fin" side="1" style="background: ${rocket_colors[0]}"></div>
            <div class="rocket-fire"></div>
          </div>
        </div>
        <div class="rocket transition-rocket" state="map" style="left: ${r2x}px;">
          <div class="rocket-body">
            <div class="rocket-window" style="background: ${rocket_colors[1]}"></div>
            <div class="rocket-studs"></div>
            <div class="rocket-fin" side="0" style="background: ${rocket_colors[1]}"></div>
            <div class="rocket-fin" side="1" style="background: ${rocket_colors[1]}"></div>
            <div class="rocket-fire"></div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

// Generate trials and ready screens for all 5 blocks.
for (let block_ix = 0; block_ix < 5; block_ix++) {
  
  // Get the stimuli for this block
  const task_info = block_task_info[block_ix];
  const block_drifts = all_block_drifts[block_ix];
  const block_num = block_ix + 1; // 1-indexed for display

  // Pre-compute forced trials: 6 per block, force only the rocket choice.
  const totalTrials = block_drifts.length;
  // Exclude the first three trials from being forced
  const positions = Array.from({length: totalTrials}, (_, idx) => idx).filter(idx => idx >= 3);
  const weights = positions.map(idx => idx < Math.floor(totalTrials / 2) ? 2 : 1); // bias to first half (still excluding first 3)
  const forced_positions = weightedSampleNoReplace(positions, weights, 6);
  // Randomize forced rocket choices (balanced left/right indices in rocket_colors array)
  const forced_targets = jsPsych.randomization.shuffle([0,1,0,1,0,1]);
  const forced_map = {};
  forced_positions.forEach((pos, idx) => { forced_map[pos] = forced_targets[idx]; });

  // Add a ready screen before the block (skip for block 0 - use READY_01 before timeline)
  if (block_ix > 0) {
    const ready_screen = {
      type: jsPsychTwoStepInstructions,
      on_start: function(trial) {
        let earned = 0;
        try {
          earned = typeof window.gem_counter === 'number' ? window.gem_counter : 0;
        } catch (e) {}
        const finished_block = block_num - 1;
        trial.pages = [
          `<p>Take a break for a few moments and press any button when you are ready to continue.</p><p>You earned <b>${earned}</b> gems in <b>Block ${finished_block}/5</b>.</p>`,
          "You have now travelled to a completely different part of the galaxy.</p> <p> All ships, planets and aliens are brand new.</p>",
          buildTransitionMapHtml(task_info, block_num),
          `Get ready to begin <b>Block ${block_num}/5</b>.<br>Press next when you're ready to start.`,
        ];
      },
      pages: [
        "Take a break for a few moments and press any button when you are ready to continue.",
        "You have now travelled to a completely different part of the galaxy.</p> <p> All ships, planets and aliens are brand new.</p>",
        buildTransitionMapHtml(task_info, block_num),
        `Get ready to begin <b>Block ${block_num}/5</b>.<br>Press next when you're ready to start.`,
      ]
    };
    TWO_STEP_TASK.push(ready_screen);
  }

  // Generate trials for this block
  for (let i = 0; i < block_drifts.length; i++) {

    const is_forced = Object.prototype.hasOwnProperty.call(forced_map, i);
    const forced_rocket_key = is_forced ? forced_map[i] : null; // 0 or 1
    let forced_state1_key = null;
    let forced_state1_color = null;
    let forced_state2_key = null;
    let force_transition = null;
    let forced_message = null;

    if (is_forced) {
      forced_state1_key = forced_rocket_key;
      forced_state1_color = task_info.rocket_colors[forced_state1_key];
      forced_state2_key = null;
      force_transition = null;
      forced_message = null;
    }

    // Define trial.
    const trial = {
      type: jsPsychTwoStepTrial,
      // deterministic_rocket_color tells the plugin which rocket COLOR always leads to planet 0
      deterministic_rocket_color: task_info.deterministic_rocket_color,
      outcomes: block_drifts[i],
      rocket_colors: task_info.rocket_colors,
      planet_colors: task_info.planet_colors,
      aliens: task_info.aliens,
      choice_duration: choice_duration,
      feedback_duration: feedback_duration,
      randomize_s1: randomize_s1,
      randomize_s2: randomize_s2,
      forced_trial: is_forced,
      forced_state1_key: forced_state1_key,
      forced_state1_color: forced_state1_color,
      forced_alien_index: null,
      force_transition: force_transition,
      forced_message: forced_message,
      show_gem_counter: false,
      data: {
        trial: i+1,
        block: block_num,
        drifts: block_drifts[i],
        drift_ix: block_ix
      },
      on_finish: function(data) {

        // Store number of browser interactions
        data.browser_interactions = jsPsych.data.getInteractionData().filter({trial: data.trial_index}).count();

        // Evaluate missing data
        if ( data.state_1_choice == null || data.state_2_choice == null ) {

          // Set missing data to true.
          data.missing = true;

          // Increment counter. Check if experiment should end.
          missed_responses++;
          if (missed_responses >= missed_threshold) {
            jsPsych.endExperiment();
          }

        } else {

          // Set missing data to false.
          data.missing = false;

        }

      }
    };

    // Define looping node.
    const trial_node = {
      timeline: [trial],
      loop_function: function(data) {
        return data.values()[0].missing;
      }
    };

    // Append trial.
    TWO_STEP_TASK.push(trial_node);

  }

  // Add end-of-block quiz
  const finished_block_instructions = {
    type: jsPsychTwoStepInstructions,
    on_start: function(trial) {
      let earned = 0;
      try {
        earned = typeof window.gem_counter === 'number' ? window.gem_counter : 0;
      } catch (e) {}
      trial.pages = [
        `<p>Great job! You've finished <b>Block ${block_num}/5</b>.</p><p>You earned <b>${earned}</b> gems in this block.</p>`
      ];
    },
    pages: [
      `<p>Great job! You've finished <b>Block ${block_num}/5</b>.</p>`
    ]
  };

  TWO_STEP_TASK.push(finished_block_instructions);

}

//---------------------------------------//
// Define transition screens.
//---------------------------------------//

// Define ready screen for the start of the experiment (before Block 1).
var READY_01 = {
  type: jsPsychTwoStepInstructions,
  pages: [
    "<p>Great job! You've finished the instructions.</p><p>We'll get started with the real game now.</p>",
    "<p>In the real game, you will see new planets, aliens, and rocket ships.</p><p>However, the rules of the game <b>have not changed</b>.</p>",
    "Get ready to begin <b>Block 1/5</b>.<br>Press next when you're ready to start.",
    buildTransitionMapHtml(block_task_info[0], 1),
  ]
}

//---------------------------------------//
// Define practice two-step block (full two-step trials)
//---------------------------------------//
// Use the first block's stimulus assignments for practice
const PRACTICE_TRIALS = 10;
const practice_drifts_full = (typeof window !== 'undefined' && window.all_noisy_drifts) ? window.all_noisy_drifts[0] : (typeof drifts_01 !== 'undefined' ? drifts_01 : null);
const practice_drifts = practice_drifts_full ? practice_drifts_full.slice(0, PRACTICE_TRIALS) : [];

// Build practice two-step trial list
var PRACTICE_TWO_TASK = [];
// Add a ready screen for practice
PRACTICE_TWO_TASK.push({
  type: jsPsychTwoStepInstructions,
  pages: ["Let's practice the full game for a few trials.", "This practice includes rockets, planets, aliens, and rewards. You will see the reward counter update."]
});

// Reset gem counter before practice
PRACTICE_TWO_TASK.push({ type: jsPsychCallFunction, func: function(){ try { window.gem_counter = 0; } catch(e){} } });

for (let i = 0; i < PRACTICE_TRIALS; i++) {
  const t_outcomes = practice_drifts[i] || [0,0,0,0,0,0];
  const is_forced_practice = i === 1;
  const trial = {
    type: jsPsychTwoStepTrial,
    deterministic_rocket_color: block_task_info[0].deterministic_rocket_color,
    outcomes: t_outcomes,
    rocket_colors: block_task_info[0].rocket_colors,
    planet_colors: block_task_info[0].planet_colors,
    aliens: practice_info.aliens, // use P-labeled practice aliens
    choice_duration: choice_duration,
    feedback_duration: feedback_duration,
    randomize_s1: randomize_s1,
    randomize_s2: randomize_s2,
    forced_trial: is_forced_practice,
    forced_state1_key: is_forced_practice ? 0 : null,
    forced_state2_key: is_forced_practice ? 0 : null,
    show_gem_counter: false,
    data: {
      practice: true,
      trial: i+1,
      drifts: t_outcomes
    },
    on_finish: function(data) {
      // Keep same on_finish behavior as main trials
      data.browser_interactions = jsPsych.data.getInteractionData().filter({trial: data.trial_index}).count();
    }
  };
  PRACTICE_TWO_TASK.push(trial);
}

// Wrap as a timeline node so it can be inserted into INSTRUCTIONS
var PRACTICE_TWO_NODE = { timeline: PRACTICE_TWO_TASK };

//---------------------------------------//
// Define end of experiment screens.
//---------------------------------------//

// Define finish screen.
const instructions_04 = {
  type: jsPsychTwoStepInstructions,
  on_start: function(trial) {
    let earned = 0;
    try {
      earned = typeof window.gem_counter === 'number' ? window.gem_counter : 0;
    } catch (e) {}
    trial.pages = [
      `<p>Great job! You've finished the task.</p><p>You earned <b>${earned}</b> gems in <b>Block ${NUM_BLOCKS}/5</b>.</p><p>Before you finish, we have a couple of short questions for you.</p>`,
    ];
  },
  pages: [
    "<p>Great job! You've finished the task.</p><p>Before you finish, we have a couple of short questions for you.</p>",
  ]
}

// Define finish screen and quiz built dynamically at runtime
var FINISHED = [
  instructions_04,
  {
    type: jsPsychTwoStepComprehension,
    prompts: ['loading...'],
    options: [['loading...']],
    correct: ['loading...'],
    on_start: function(trial) {
      // Build quiz_04 dynamically when this trial starts
      const final_block_info = block_task_info[NUM_BLOCKS - 1];
      const deterministic_ship_color = final_block_info.deterministic_rocket_color;
      const probabilistic_ship_color = final_block_info.rocket_colors.find(c => c !== final_block_info.deterministic_rocket_color);

      // Convert hex colors to HTML-styled labels for quiz display
      const color_labels = final_block_info.rocket_colors.map(hex => 
        `<span style='color: ${hex}; font-weight: bold;'>spaceship of this color</span>`
      );

      trial.prompts = [
        `Which spaceship in the final block <b>always went to a single planet</b>?`,
        `Which spaceship in the final block <b>went to two different planets</b>?`
      ];
      trial.options = [
        color_labels,
        color_labels,
      ];
      trial.correct = [
        `<span style='color: ${deterministic_ship_color}; font-weight: bold;'>spaceship of this color</span>`,
        `<span style='color: ${probabilistic_ship_color}; font-weight: bold;'>spaceship of this color</span>`,
      ];
    }
  }
];