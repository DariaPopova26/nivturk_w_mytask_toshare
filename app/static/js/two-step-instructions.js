//---------------------------------------//
// Define instructions parameters
//---------------------------------------//

// Define comprehension thresholds.
const max_errors = 0;
const max_loops = 10;
var n_loops = 0;

//---------------------------------------//
// Define instructions (section 1a)
//---------------------------------------//

// Define instructions screens.
const instructions_1a = {
  type: jsPsychTwoStepInstructions,
  pages: [
    "<p>In this game, you will be visiting different alien planets<br>in search of treasure.</p>",
    `<p>Each planet has two aliens on it. For example:</p><p>The <b><font color='${practice_info.font_colors[0]}'>${practice_info.planet_names[0]}</font></b> aliens live on the <b><font color='${practice_info.font_colors[0]}'>${practice_info.planet_names[0]}</font></b> planet.</p><p>The <b><font color='${practice_info.font_colors[1]}'>${practice_info.planet_names[1]}</font></b> aliens live on the <b><font color='${practice_info.font_colors[1]}'>${practice_info.planet_names[1]}</font></b> planet.</p>`,
    "<p>When you visit a planet, you can choose an alien to trade with.</p><p>When you trade with an alien, it will either give you some amount of <b>gems</b>.</p>",
    "<p>Gems are valuable.</p><p>This is what gems look like.</p>",
    "<p>To choose an alien to trade with, you will use the</p><p><b>left/right arrow keys</b> on your keyboard.</p>",
    "<p>An alien may give you a slightly different number of gems <i>every</i> time you trade with it.</p>",
    "<p>Some aliens are <b>more generous.</b></p><p>That is, you may gather more gems by choosing to trade with such aliens.</p>",
    "<p>Your goal is to collect as many gems as you can</p>",
  ],
  add_aliens: [false, false, false, true, false, false, false, true],
  add_rockets: [false, false, false, false, false, false, false, false],
  add_diamonds: [false, false, false, false, false, true, false, false],
  add_rocks: [false, false, false, false, false, false, false, false],
  aliens: practice_info.aliens,
  on_start: function(trial) {

    // if first loop, include additional messages.
    if (jsPsych.data.get().filter({quiz: 1}).count() == 0) {
      trial.pages.unshift(
        "<p>We are now beginning the <b>Space Treasure</b> game.</p><p>Use the buttons below, or your keyboard's arrow keys, to<br>navigate the instructions.</p>",
        "<p>The instructions are broken into three short parts.</p><p>There will be a <b>quiz</b> at the end of each part, so please read carefully.</p>",
      )
    }

  }
}

// Define section 1 comprehension check.
const quiz_1 = {
  type: jsPsychTwoStepComprehension,
  prompts: [
    "To choose an alien to trade with, which keys do you use?",
    "<i>True</i> or <i>False</i>:&nbsp;Your goal is to get as many gems as possible.",
    "<i>True</i> or <i>False</i>:&nbsp;Some aliens are more generous than others.",
  ],
  options: [
    ["a/d keys", "1/0 keys", "left/right arrow keys"],
    ["True", "False"],
    ["True", "False"],
  ],
  correct: [
    "left/right arrow keys",
    "True",
    "True"
  ],
  data: {quiz: 1}
}

const instructions_1a_help_node = {
  timeline: [{
    type: jsPsychTwoStepInstructions,
    pages: [
      "<p>You did not answer all of the quiz questions correctly.</p><p>Please review the following instructions carefully.</p>"
    ],
    add_aliens: [false],
    add_rockets: [false],
    add_diamonds: [false],
    add_rocks: [false],
    aliens: practice_info.aliens,
  }],
  conditional_function: function() {
    if (jsPsych.data.get().filter({quiz: 1}).count() > 0) {
      return true;
    } else {
      return false;
    }
  }
}

var instructions_loop_1a = {
  timeline: [
    instructions_1a_help_node,
    instructions_1a,
    quiz_1,
  ],
  loop_function: function(data) {

    // Extract number of errors.
    const num_errors = data.values().slice(-1)[0].num_errors;

    // Check if instructions should repeat.
    n_loops++;
    if (num_errors > max_errors && n_loops >= max_loops) {
      return false;
    } else if (num_errors > max_errors) {
      return true;
    } else {
      return false;
    }

  }
}

//---------------------------------------//
// Define instructions (section 1b)
//---------------------------------------//

// Define instructions screens.
const instructions_1b_node = {
  timeline: [{
    type: jsPsychTwoStepInstructions,
    pages: [
      "<p>Great job! Now let's practice with two aliens.</p><p>On the next screen, use the <b>left/right arrow keys</b> on your keyboard to choose an alien to trade with. You will have 10 chances to figure out which alien is more generous.</p>",
      // "<p><b>Hint:</b> The aliens will sometimes switch the side of the screen<br>they are on. The side an alien appears on does not change<br>how likely it is to give you treasure.</p>"
    ],
    add_aliens: [false, false],
    add_rockets: [false, false],
    add_diamonds: [false, false],
    add_rocks: [false, false],
    aliens: practice_info.aliens,
    data: {phase: 'instructions_1b'}
  }],
  conditional_function: function() {
    const n_trial = jsPsych.data.get().filter({phase: 'instructions_1b'}).count();
    if (n_trial > 0) {
      return false;
    } else {
      return true;
    }
  }
}

// Initialize practice variables.
// In 1b, we have two aliens with different base reward values.
// Alien 0 (left): base reward 2 gems (lower yielding)
// Alien 1 (right): base reward 7 gems (higher yielding)
// Each trial: add Gaussian noise N(0,2), round, and clip to >= 0.
// track consecutive correct choices (choosing the high-yielding alien).
var practice_1_counter = 0;

// Helper function to generate noisy reward (same as in drifts file)
function generateNoisyReward(baseReward) {
  function gaussianRandom(mean = 0, stdev = 1) {
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    let z0 = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z0 * stdev + mean;
  }
  const noise = gaussianRandom(0, 2);
  return Math.max(0, Math.round(baseReward + noise));
}

// Define section 1 practice
const practice_1_node = {
  timeline: [{
    type: jsPsychTwoStepAlienPractice,
    outcomes: [generateNoisyReward(2), generateNoisyReward(7)],
    aliens: practice_info.aliens.slice(0,2),
    planet_color: practice_info.planet_colors[0],
    choice_duration: choice_duration,
    feedback_duration: feedback_duration,
    randomize: false,
    on_start: function(trial) {
      // Generate numeric rewards for each alien (with noise)
      // Alien 0: base 2 gems (lower yielding)
      // Alien 1: base 7 gems (higher yielding) == GENEROUS
      trial.outcomes = [
        generateNoisyReward(2),  // Alien 0: low base reward + noise
        generateNoisyReward(7)   // Alien 1: high base reward + noise
      ];
    },
    on_finish: function(data) {
      // Check if participant chose the higher-yielding alien (alien 1, state_2_choice == 1)
      if (data.state_2_choice == 1) {
        practice_1_counter++;
      } else {
        practice_1_counter = 0;
      }
    }
  }],
  conditional_function: function() {

    // Query number of practice trials so far.
    const n_trial = jsPsych.data.get().filter({trial_type: 'alien-practice'}).count() % 10;

    // Run exactly 10 practice trials, then end.
    if ( n_trial >= 10 ) {
      return false;
    } else {
      return true;
    }

  }
}

const practice_1_help_node = {
  timeline: [{
    type: jsPsychTwoStepInstructions,
    pages: [
      "<p>Seems like you're having trouble.</p><p>Remember, you are trying to identify which alien is more generous.</p>",
      "<p>Let's try again.</p><p>On the next screen, use the <b>left/right arrow keys</b> on your keyboard to choose an alien to trade with. You will have 10 more chances to figure out which alien gives you more gems.</p>"
    ],
    show_clickable_nav: true,
    button_label_previous: "Prev",
    button_label_next: "Next",
  }],
  conditional_function: function() {
    if ( practice_1_counter >= 3 ) {
      return false;
    } else {
      return true;
    }
  }
}

// Practice block (section 1b)
const instructions_loop_1b = {
  timeline: [
    instructions_1b_node, practice_1_node, practice_1_node, practice_1_node,
    practice_1_node, practice_1_node, practice_1_node, practice_1_node,
    practice_1_node, practice_1_node, practice_1_node, practice_1_help_node
  ],
  loop_function: function(data) {
    if ( practice_1_counter >= 3 ) {
      return false;
    } else {
      return true;
    }
  }
}

//---------------------------------------//
// Define instructions (section 2a)
//---------------------------------------//

const instructions_2a = {
  type: jsPsychTwoStepInstructions,
  pages: [
    "<p>Next, you will learn how to travel to the alien planets.</p>",
    `<p>To visit a planet, you will pick a rocket ship to travel on.</p><p>Below are two example rocket ships to pick from:<br>the <b><font color='${practice_info.rocket_colors[0]}'>${practice_info.rocket_names[0]}</font></b> and <b><font color='${practice_info.rocket_colors[1]}'>${practice_info.rocket_names[1]}</font></b> rocket ships.</p>`,
    "<p>Some rockets always go to the same planet, while others go to two possible destinations at random.</p>",
    "<p>To choose a rocket ship to travel on, you will use the</p><p><b>left/right arrow keys</b> on your keyboard.</p>",
    "<p>Sometimes the game will tell you which rocket to choose.</p><p>These are <b>forced-choice</b> trials.</p><p>When that happens, follow the instruction and pick the indicated rocket.</p>",
  ],
  add_aliens: [false, false, false, false, false, false],
  add_rockets: [false, false, true, true, true, true],
  add_diamonds: [false, false, false, false, false, false],
  add_rocks: [false, false, false, false, false, false],
  rocket_colors: practice_info.rocket_colors,
  aliens: practice_info.aliens,
  on_start: function(trial) {

    // if first loop, include additional messages.
    if (jsPsych.data.get().filter({quiz: 2}).count() == 0) {
      trial.pages.unshift(
        "<p>Great job! You figured out which alien is more generous (even though it may not give the same number of gems all the time).</p>"
      )
    }

  }
}

// Define section 1 comprehension check.
const quiz_2 = {
  type: jsPsychTwoStepComprehension,
  prompts: [
    "To choose a rocket ship to travel on, which keys do you use?",
    "<i>True</i> or <i>False</i>:&nbsp;&nbsp;All rocket ships will always travel to one planet.",
    "<i>True</i> or <i>False</i>:&nbsp;&nbsp;Some rocket ships go to two destinations.",
  ],
  options: [
    ["a/d keys", "1/0 keys", "left/right arrow keys"],
    ["True", "False"],
    ["True", "False"],
  ],
  correct: [
    "left/right arrow keys",
    "False",
    "True"
  ],
  data: {quiz: 2}
}

const instructions_2a_help_node = {
  timeline: [{
    type: jsPsychTwoStepInstructions,
    pages: [
      "<p>You did not answer all of the quiz questions correctly.</p><p>Please review the following instructions carefully.</p>"
    ],
    add_aliens: [false],
    add_rockets: [false],
    add_diamonds: [false],
    add_rocks: [false],
    aliens: practice_info.aliens,
  }],
  conditional_function: function() {
    if (jsPsych.data.get().filter({quiz: 2}).count() > 0) {
      return true;
    } else {
      return false;
    }
  }
}

var instructions_loop_2a = {
  timeline: [
    instructions_2a_help_node,
    instructions_2a,
    quiz_2,
  ],
  loop_function: function(data) {

    // Extract number of errors.
    const num_errors = data.values().slice(-1)[0].num_errors;

    // Check if instructions should repeat.
    n_loops++;
    if (num_errors > max_errors && n_loops >= max_loops) {
      return false;
    } else if (num_errors > max_errors) {
      return true;
    } else {
      return false;
    }

  }
}

//---------------------------------------//
// Define instructions (section 3)
//---------------------------------------//

const instructions_3a = {
  type: jsPsychTwoStepInstructions,
  pages: [
    "<p>At the end of the game, the total number of gems you've collected</p><p>will be converted into a <b>performance bonus</b>.</p>",
    "<p>Your goal is to try and collect as many gems as you can!</p>",
    "<p>You will complete 5 blocks of trials.</p>",
    "<p>The planets, rocket ships and aliens will change each block.</p>",
    "<p>That is, your memory from the previous block will not help you in the next one.</p>"
  ],
  add_aliens: [false, false, false, false, false, false, false],
  add_rockets: [false, false, false, false, false, false, false],
  add_diamonds: [false, false, false, false, false, false, false],
  add_rocks: [false, false, false, false, false, false, false],
  aliens: practice_info.aliens,
  on_start: function(trial) {

    // if first loop, include additional messages.
    if (jsPsych.data.get().filter({quiz: 3}).count() == 0) {
      trial.pages.unshift(
        "<p>Good job! We are almost finished with the instructions.</p><p>Before we start the real game, here are some final details.</p>",
      )
    }

  }
}

// Define section 1 comprehension check.
const quiz_3 = {
  type: jsPsychTwoStepComprehension,
  prompts: [
    "<i>True</i> or <i>False</i>:&nbsp;&nbsp;The aliens don't give the same number of gems all the time.",
    "<i>True</i> or <i>False</i>:&nbsp;&nbsp;Rocket ships, aliens, and planets will change each block.",
    "<i>True</i> or <i>False</i>:&nbsp;&nbsp;The gems you earn will affect your performance bonus.",
  ],
  options: [
    ["True", "False"],
    ["True", "False"],
    ["True", "False"],
  ],
  correct: [
    "True",
    "True",
    "True"
  ],
  data: {quiz: 3}
}

const instructions_3a_help_node = {
  timeline: [{
    type: jsPsychTwoStepInstructions,
    pages: [
      "<p>You did not answer all of the quiz questions correctly.</p><p>Please review the following instructions carefully.</p>"
    ],
    add_aliens: [false],
    add_rockets: [false],
    add_diamonds: [false],
    add_rocks: [false],
    aliens: practice_info.aliens,
  }],
  conditional_function: function() {
    if (jsPsych.data.get().filter({quiz: 3}).count() > 0) {
      return true;
    } else {
      return false;
    }
  }
}

const instructions_loop_3a = {
  timeline: [
    instructions_3a_help_node,
    instructions_3a,
    quiz_3
  ],
  loop_function: function(data) {

    // Extract number of errors.
    const num_errors = data.values().slice(-1)[0].num_errors;

    // Check if instructions should repeat.
    n_loops++;
    if (num_errors > max_errors && n_loops >= max_loops) {
      return false;
    } else if (num_errors > max_errors) {
      return true;
    } else {
      return false;
    }

  }
}

//---------------------------------------//
// Define instructions timeline
//---------------------------------------//

var INSTRUCTIONS_SKIP = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: '<p>You are starting a demo of the <b>two-step task.</b></p><p>To see the instructions, press the "1" key. To skip them, press the "2" key.</p>',
  choices: ["1","2"]
}

var INSTRUCTIONS = {
  timeline: [
    instructions_loop_1a,
    instructions_loop_1b,
    instructions_loop_2a,
  instructions_loop_3a,
  // Insert the practice full two-step node defined in two-step-experiment.js
  (typeof PRACTICE_TWO_NODE !== 'undefined') ? PRACTICE_TWO_NODE : []
  ],
  conditional_function: function(){
        var data = jsPsych.data.get().last(1).values()[0];
        if(jsPsych.pluginAPI.compareKeys(data.response, '2')){
            return false;
        } else {
            return true;
        }
    }
}
