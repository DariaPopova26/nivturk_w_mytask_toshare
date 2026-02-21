var jsPsychTwoStepTrial = (function (jspsych) {
  'use strict';

  const info = {
    name: 'two-step-trial',
    description: '',
    parameters: {
      transition: {
        type: jspsych.ParameterType.INT,
        pretty_name: 'Transition',
        default: 1,
        description: 'State transition (common = 1, uncommon = 0). Optional; deterministic/probabilistic logic overrides this.'
      },
      outcomes: {
        type: jspsych.ParameterType.INT,
        array: true,
        pretty_name: 'Outcomes',
        description: 'Reward outcome for each bandit (integer number of gems).'
      },
      rocket_colors: {
        type: jspsych.ParameterType.HTML_STRING,
        array: true,
        pretty_name: 'Rocket colors',
        description: 'Colors of the state 1 left/right rockets.'
      },
      deterministic_rocket_color: {
        type: jspsych.ParameterType.HTML_STRING,
        pretty_name: 'Deterministic rocket color',
        description: 'The rocket color (hex) that always leads to planet 0.'
      },
      planet_colors: {
        type: jspsych.ParameterType.HTML_STRING,
        array: true,
        pretty_name: 'Planet colors',
        description: 'Colors of the state 2 planets.'
      },
      aliens: {
        type: jspsych.ParameterType.HTML_STRING,
        array: true,
        pretty_name: 'Aliens',
        description: 'Paths to alien images (length = planets * 2).'
      },
      randomize_s1: {
        type: jspsych.ParameterType.BOOL,
        pretty_name: 'Randomize (state 1)',
        default: true,
        description: 'Randomize left/right positions of state 1 rockets.'
      },
      randomize_s2: {
        type: jspsych.ParameterType.BOOL,
        pretty_name: 'Randomize (state 2)',
        default: true,
        description: 'Randomize left/right positions of state 2 aliens.'
      },
      valid_responses_s1: {
        type: jspsych.ParameterType.KEYCODE,
        array: true,
        pretty_name: 'Valid responses',
        default: ['arrowleft', 'arrowright'],
        description: 'The keys the subject is allowed to press to respond during the first state.'
      },
      valid_responses_s2: {
        type: jspsych.ParameterType.KEYCODE,
        array: true,
        pretty_name: 'Valid responses',
        default: ['arrowleft', 'arrowright'],
        description: 'The keys the subject is allowed to press to respond during the second state.'
      },
      choice_duration: {
        type: jspsych.ParameterType.INT,
        pretty_name: 'Choice duration',
        default: null,
        description: 'How long to listen for responses before trial ends.'
      },
      feedback_duration: {
        type: jspsych.ParameterType.INT,
        pretty_name: 'Trial duration',
        default: 1000,
        description: 'How long to show feedback before it ends.'
      },
      animation: {
        type: jspsych.ParameterType.BOOL,
        pretty_name: 'Animation',
        default: true,
        desscription: 'Display animations during trial (true / false).'
      },
      forced_trial: {
        type: jspsych.ParameterType.BOOL,
        default: false,
        pretty_name: 'Forced trial',
        description: 'When true, restrict choices to instructed sides and optionally force transition.'
      },
      forced_state1_key: {
        type: jspsych.ParameterType.INT,
        default: null,
        pretty_name: 'Forced S1 key',
        description: '0 = left, 1 = right key allowed for state 1.'
      },
      forced_state1_color: {
        type: jspsych.ParameterType.HTML_STRING,
        default: null,
        pretty_name: 'Forced S1 color',
        description: 'Rocket color to force in state 1; side determined after shuffle.'
      },
      forced_state2_key: {
        type: jspsych.ParameterType.INT,
        default: null,
        pretty_name: 'Forced S2 key',
        description: '0 = left, 1 = right key allowed for state 2.'
      },
      forced_alien_index: {
        type: jspsych.ParameterType.INT,
        default: null,
        pretty_name: 'Forced alien index',
        description: 'Absolute alien index (0-5) to force at state 2.'
      },
      force_transition: {
        type: jspsych.ParameterType.INT,
        default: null,
        pretty_name: 'Forced transition',
        description: 'If set (0/1/2), overrides transition destination planet.'
      },
      forced_message: {
        type: jspsych.ParameterType.STRING,
        default: null,
        pretty_name: 'Forced message',
        description: 'Instruction banner text for forced trials.'
      },
      show_gem_counter: {
        type: jspsych.ParameterType.BOOL,
        default: true,
        pretty_name: 'Show gem counter',
        description: 'Show cumulative gem counter during trials.'
      },
    }
  }

  /**
  * jspsych-two-step
  * adapted from Sam Zorowitz, Branson Byers, Gili Karni
  *
  * Plug-in to run skewed two-step task trial
  **/
  class TwoStepTrialPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }
    trial(display_element, trial) {

      //---------------------------------------//
      // Section 1: Define HTML.
      //---------------------------------------//

      // Initialize HTML.
      var new_html = '';

      // Insert CSS (window animation).
      new_html += `<style>
      body {
        height: 100vh;
        max-height: 100vh;
        overflow: hidden;
        position: fixed;
      }
      .jspsych-content-wrapper {
        background: #606060;
        z-index: -1;
      }
      .forced-banner {
        position: absolute;
        top: 6px;
        left: 50%;
        transform: translateX(-50%);
        padding: 6px 12px;
        background: #ffd54f;
        border: 2px solid #444;
        border-radius: 6px;
        font-weight: bold;
        color: #000;
        display: none;
        z-index: 5;
      }
      .reward {
        color: #ffffff;
        font-weight: 700;
        font-size: 18px;
        text-align: center;
        line-height: 1.2em;
        position: relative;
        margin-top: 6px;
      }
      .gem-img {
        width: 40px;
        height: 40px;
        position: absolute;
        /* will be positioned via inline styles relative to the alien */
        z-index: 30;
      }
      .center-reward {
        position: absolute;
        left: 50%;
        top: 45%;
        transform: translate(-50%, -50%);
        z-index: 1000;
        font-size: 48px;
        color: #ffffff;
        font-weight: 800;
        text-shadow: 0 2px 6px rgba(0,0,0,0.6);
        pointer-events: none;
      }
      .gem-counter {
        position: absolute;
        right: 18px;
        top: 10px;
        z-index: 1001;
        color: #ffffff;
        font-weight: 900;
        font-size: 28px;
        background: rgba(0,0,0,0.25);
        padding: 10px 14px;
        border-radius: 8px;
        box-shadow: 0 3px 8px rgba(0,0,0,0.45);
      }
      </style>`;

      // Open two-step container.
      new_html += '<div class="two-step-container">';
        new_html += '<div id="forced-banner" class="forced-banner"></div>';

  // gem counter (top of screen)
  new_html += `<div id="gem-counter" class="gem-counter">0</div>`;

      // Draw sky & stars.
      new_html += '<div class="landscape-sky" state="1">';
      new_html += '<div class="stars"></div>';
      new_html += '</div>';

      // Draw ground.
      new_html += '<div class="landscape-ground" state="1"></div>';

      // Define mapping of rockets to sides.
      var state_1_ids = [0,1];
      if ( trial.randomize_s1 ) { state_1_ids = jsPsych.randomization.shuffle(state_1_ids); }

      // Draw rockets
      state_1_ids.forEach((j, i) => {
        new_html += `<div class="tower" id="tower-${i}" side="${i}"><div class="arm"></div></div>`;
        new_html += `<div class="platform" id="platform-${i}" side="${i}"></div>`;
        new_html += `<div class="rocket" id="rocket-${i}" state="1" side="${i}">`;
        new_html += '<div class="rocket-body">';
        new_html += `<div class="rocket-window" style="background: ${trial.rocket_colors[j]}"></div>`;
        new_html += '<div class="rocket-studs"></div>';
        new_html += `<div class="rocket-fin" side="0" style="background: ${trial.rocket_colors[j]}"></div>`;
        new_html += `<div class="rocket-fin" side="1" style="background: ${trial.rocket_colors[j]}"></div>`;
        new_html += `<div class="rocket-fire" id="fire-${i}"></div>`;
        new_html += '</div></div>';
      });

      // Define mapping of aliens to sides.
      var state_2_ids = [0,1];
      if ( trial.randomize_s2 ) { state_2_ids = jsPsych.randomization.shuffle(state_2_ids); }
      
      // Store the original (planet-0) state_2_ids mapping for forced-trial alien lookup.
      var state_2_ids_base = state_2_ids.slice();

      // Draw aliens (two aliens per planet). Include a small gem image (hidden by
      // default) next to each alien and a small reward container.
      // also include a large centered reward display (hidden) for the +N text.
      state_2_ids.forEach((j, i) => {
        new_html += `<div class="alien" id="alien-${i}" state="1" side="${i}">`;
        new_html += `<img id="alien-${i}-img"></img>`;
        new_html += `</div>`;
        // small gem image near alien (hidden until feedback)
        new_html += `<img class="gem-img" id="gem-${i}" src="/static/img/treasure_svg/gems.svg" style="display:none" />`;
        // small numeric reward near alien - announces how much reward received
        new_html += `<div class="reward" id="reward-${i}" state="1" side="${i}"></div>`;
      });

      // large centered reward display (hidden until feedback)
      new_html += `<div id="center-reward" class="center-reward" style="display:none"></div>`;

      // Close wrapper.
      new_html += '</div>';

      // Draw HTML.
      display_element.innerHTML = new_html;

      // Helpers for forced trial banner
      const bannerEl = display_element.querySelector('#forced-banner');
      const showBanner = (txt) => { if (bannerEl) { bannerEl.textContent = txt; bannerEl.style.display = 'block'; } };
      const hideBanner = () => { if (bannerEl) { bannerEl.style.display = 'none'; } };

      // FORCED TRIAL HANDLING  

      // If this is a forced trial, compute and store the forced side but keep valid_responses_s1 as [left, right]
      // Validate the response after recording it.
      var forced_s1_side = null;
      if (trial.forced_trial) {
        const banner = display_element.querySelector('#forced-banner');
        // Determine forced side for state 1 from color if provided, else fallback to key
        if (trial.forced_state1_color) {
          const colorIndex = trial.rocket_colors.indexOf(trial.forced_state1_color);
          if (colorIndex !== -1) {
            forced_s1_side = state_1_ids.indexOf(colorIndex); // map color index to side after shuffle
          }
        }
        if (forced_s1_side === null && trial.forced_state1_key !== null) {
          // Map the requested rocket index to the displayed side after shuffle
          const mapped = state_1_ids.indexOf(trial.forced_state1_key);
          forced_s1_side = mapped !== -1 ? mapped : trial.forced_state1_key;
        }

        if (banner && forced_s1_side !== null) {
          const dir1 = forced_s1_side === 0 ? 'LEFT' : 'RIGHT';
          // Always derive banner text from the mapped side to avoid mismatches
          showBanner(`This is a forced trial: Choose ${dir1} rocket`);
        } else {
          hideBanner();
        }
      } else {
        hideBanner();
      }
      
      // Always keep valid_responses_s1 as standard [left, right] to maintain proper indexing
      // For forced trials, we validate the choice matches after recording.

      // Initialize gem counter for the block if not present or if this is trial 1.
      try {
        var gemCounterEl = display_element.querySelector('#gem-counter');
        if (typeof window.gem_counter === 'undefined') {
          window.gem_counter = 0;
        }
        if (typeof window.total_gems === 'undefined') {
          window.total_gems = 0;
        }
        // If trial.data exists and indicates this is the first trial, reset counter
        if (trial.data && typeof trial.data.trial !== 'undefined' && trial.data.trial === 1) {
          window.gem_counter = 0;
        }
        // Reset cumulative gems only at the very start of the main task
        if (trial.data && trial.data.trial === 1 && trial.data.block === 1) {
          window.total_gems = 0;
        }
        if (gemCounterEl) {
          gemCounterEl.textContent = window.gem_counter;
          gemCounterEl.style.display = trial.show_gem_counter ? 'block' : 'none';
        }
      } catch (e) {
        // ignore
      }

      //---------------------------------------//
      // Section 2: Response handling.
      //---------------------------------------//

      // confirm screen resolution
      const screen_resolution = [window.innerWidth, window.innerHeight];
      if (screen_resolution[0] < 540 || screen_resolution[1] < 400) {
        var minimum_resolution = 0;
      } else {
        var minimum_resolution = 1;
      }

      // Preallocate space
      var response = {
        state_1_key: null,
        state_1_choice: null,
        state_1_rt: null,
        state_2: null,
        state_2_key: null,
        state_2_choice: null,
        state_2_rt: null,
        outcome: null,
      }
      
      // Store forced side variables for access in response handlers
      var forced_s2_side = null;

      // function to handle missed responses
      var missed_response = function() {

        // Kill all setTimeout handlers.
        jsPsych.pluginAPI.clearAllTimeouts();
        jsPsych.pluginAPI.cancelAllKeyboardResponses();

        // Display warning message.
        const msg = '<p style="position: absolute; left: 50%; top: 50%; -webkit-transform: translate(-50%, -50%); transform: translate(-50%, -50%); font-size: 20px; line-height: 1.5em; color: black">You did not respond within the allotted time. Please pay more attention on the next trial.<br><br><b>Warning:</b> If you miss too many trials, we may end the exepriment early and reject your work.';

        display_element.innerHTML = '<style>.jspsych-content-wrapper {background: #606060;}</style><div class="two-step-container" style="background: #FFFFFF;">' + msg + '</div>';

        jsPsych.pluginAPI.setTimeout(function() {
          end_trial();
        }, 5000);

      }

      // handle responses during state 1
      var after_first_response = function(info) {

        // Kill all setTimeout handlers.
        jsPsych.pluginAPI.clearAllTimeouts();
        jsPsych.pluginAPI.cancelAllKeyboardResponses();

        // Record responses.
        response.state_1_rt = info.rt;
        response.state_1_key = trial.valid_responses_s1.indexOf(info.key);
        
        // On forced trials, validate that the response matches the forced side
        if (trial.forced_trial && forced_s1_side !== null && response.state_1_key !== forced_s1_side) {
          // Ignore this response; wait for the correct key
          var keyboardListener = jsPsych.pluginAPI.getKeyboardResponse({
            callback_function: after_first_response,
            valid_responses: trial.valid_responses_s1,
            rt_method: 'performance',
            persist: false,
            allow_held_key: false
          });
          return;
        }
        
        response.state_1_choice = state_1_ids[response.state_1_key];

        // Handle animations
        // If animation = true, then the rocket blast off animation will play.
        // Otherwise, the next state of the trial will present immediately.
        if ( trial.animation ) {

          // display_element.querySelector('#rocket-' + response.state_1_key).setAttribute('state', 'common');
          display_element.querySelector('#fire-' + response.state_1_key).style['display'] = 'inherit';
          setTimeout(function() { state_transition(); }, 800);

        } else {

          state_transition();

        }

      };

      // Intermediate function to update screen objects from state 1 to state 2.
      var state_transition = function() {

        // Define second state.
        // The rocket with color matching deterministic_rocket_color always leads to planet 0.
        // The other rocket leads to planet 1 or 2 with equal probability (50/50), unless forced.
        if (trial.forced_trial && trial.force_transition !== null) {
          response.state_2 = trial.force_transition;
        } else {
          const chosen_rocket_color = trial.rocket_colors[response.state_1_choice];
          if (chosen_rocket_color === trial.deterministic_rocket_color) {
            response.state_2 = 0;
          } else {
            response.state_2 = (Math.random() < 0.5) ? 1 : 2;
          }
        }

        // Define second state ids (absolute alien indices for current planet).
        state_2_ids = state_2_ids.map(function(k) {return k + 2 * response.state_2});

        // On forced trials, find which display side the forced alien appears on, then update banner.
        // Use state_2_ids_base (pre-planet-mapping) to determine the display side of the forced alien.
        forced_s2_side = null;
        if (trial.forced_trial) {
          if (trial.forced_alien_index !== null) {
            // forced_alien_index is 0-5 (absolute); find which relative position (0 or 1) 
            // it maps to within the current planet in state_2_ids_base
            const planet_offset = 2 * response.state_2;
            const base_idx_0 = state_2_ids_base[0];
            const base_idx_1 = state_2_ids_base[1];
            if (base_idx_0 + planet_offset === trial.forced_alien_index) {
              forced_s2_side = 0;
            } else if (base_idx_1 + planet_offset === trial.forced_alien_index) {
              forced_s2_side = 1;
            }
          }
          if (forced_s2_side === null && trial.forced_state2_key !== null) {
            // Map the relative alien index (0/1 within planet) through the shuffled base mapping to side
            const mapped = state_2_ids_base.indexOf(trial.forced_state2_key);
            forced_s2_side = mapped !== -1 ? mapped : trial.forced_state2_key;
          }
          // At stage 2, show reward-visibility banner instead of forcing alien choice
          showBanner('This is a forced trial: you can see what rewards the aliens will give you');
        }
        
        // Keep valid_responses_s2 as standard [left, right] for proper indexing;
        // validate forced choice after recording.

        // Update background.
        display_element.querySelector('.landscape-sky').setAttribute('state', '2');
        display_element.querySelector('.landscape-ground').setAttribute('state', '2');
        display_element.querySelector('.landscape-ground').style['background'] = trial.planet_colors[response.state_2];

        // Hide rocket elements.
        display_element.querySelector('#platform-0').setAttribute('state', '2');
        display_element.querySelector('#platform-1').setAttribute('state', '2');
        display_element.querySelector('#tower-0').setAttribute('state', '2');
        display_element.querySelector('#tower-1').setAttribute('state', '2');

        // Re-position chosen rocket.
        display_element.querySelector('#rocket-' + response.state_1_key).setAttribute('state', '2');
        display_element.querySelector('#fire-' + response.state_1_key).style['display'] = 'none';
        display_element.querySelector('#rocket-' + (1 - response.state_1_key)).style['display'] = 'none';

        // Display aliens.
        display_element.querySelector('#alien-0-img').setAttribute('src', trial.aliens[state_2_ids[0]]);
        display_element.querySelector('#alien-0').setAttribute('state', '2');
        display_element.querySelector('#alien-1-img').setAttribute('src', trial.aliens[state_2_ids[1]]);
        display_element.querySelector('#alien-1').setAttribute('state', '2');

        // On forced trials, reveal both alien rewards during the choice stage.
        // For non-forced trials, keep reward previews hidden.
        const reward0 = display_element.querySelector('#reward-0');
        const reward1 = display_element.querySelector('#reward-1');
        if (trial.forced_trial) {
          // Defensive: ensure outcomes array exists and has valid entries
          if (!trial.outcomes || !Array.isArray(trial.outcomes) || trial.outcomes.length < 2) {
            trial.outcomes = trial.outcomes || [0, 0];
            while (trial.outcomes.length < 2) { trial.outcomes.push(0); }
          }
          const out0 = trial.outcomes[state_2_ids[0]] || 0;
          const out1 = trial.outcomes[state_2_ids[1]] || 0;
          const alien0 = display_element.querySelector('#alien-0');
          const alien1 = display_element.querySelector('#alien-1');
          const containerEl = display_element.querySelector('.two-step-container') || display_element;
          const parentRect = containerEl.getBoundingClientRect();
          const rect0 = alien0 ? alien0.getBoundingClientRect() : null;
          const rect1 = alien1 ? alien1.getBoundingClientRect() : null;
          const topBase = Math.min(
            rect0 ? rect0.top : Number.POSITIVE_INFINITY,
            rect1 ? rect1.top : Number.POSITIVE_INFINITY
          );
          const defaultY = parentRect.height * 0.18;
          const y = Number.isFinite(topBase)
            ? Math.max(20, topBase - parentRect.top - 140)
            : Math.max(20, defaultY);
          const centerX = parentRect.width / 2;
          const offset = Math.min(parentRect.width * 0.18, 160);

          if (reward0) {
            reward0.textContent = '+' + String(out0);
            reward0.setAttribute('status', 'preview');
            reward0.style.position = 'absolute';
            reward0.style.left = (centerX - offset) + 'px';
            reward0.style.top = y + 'px';
            reward0.style.transform = 'translate(-50%, 0)';
            reward0.style.zIndex = '1000';
            reward0.style.pointerEvents = 'none';
            reward0.style.color = '#ffffff';
            reward0.style.fontSize = '22px';
            reward0.style.fontWeight = '700';
            reward0.style.textShadow = '0 2px 6px rgba(0,0,0,0.6)';
            reward0.style.display = 'block';
          }
          if (reward1) {
            reward1.textContent = '+' + String(out1);
            reward1.setAttribute('status', 'preview');
            reward1.style.position = 'absolute';
            reward1.style.left = (centerX + offset) + 'px';
            reward1.style.top = y + 'px';
            reward1.style.transform = 'translate(-50%, 0)';
            reward1.style.zIndex = '1000';
            reward1.style.pointerEvents = 'none';
            reward1.style.color = '#ffffff';
            reward1.style.fontSize = '22px';
            reward1.style.fontWeight = '700';
            reward1.style.textShadow = '0 2px 6px rgba(0,0,0,0.6)';
            reward1.style.display = 'block';
          }
        } else {
          if (reward0) { reward0.textContent = ''; reward0.removeAttribute('status'); reward0.style.display = 'none'; }
          if (reward1) { reward1.textContent = ''; reward1.removeAttribute('status'); reward1.style.display = 'none'; }
        }

        // start the response listener
        var keyboardListener = jsPsych.pluginAPI.getKeyboardResponse({
          callback_function: after_second_response,
          valid_responses: trial.valid_responses_s2,
          rt_method: 'performance',
          persist: false,
          allow_held_key: false
        });

        // end trial if no response.
        if (trial.choice_duration !== null) {
          jsPsych.pluginAPI.setTimeout(function() {
            missed_response();
          }, trial.choice_duration);
        }

      };

      // function to handle responses by the subject
      var after_second_response = function(info) {

        // Kill all setTimeout handlers.
        jsPsych.pluginAPI.clearAllTimeouts();
        jsPsych.pluginAPI.cancelAllKeyboardResponses();

        // Record responses.
        response.state_2_rt = info.rt;
        response.state_2_key = trial.valid_responses_s2.indexOf(info.key);
        
        // On forced trials, validate that the response matches the forced side
        if (trial.forced_trial && forced_s2_side !== null && response.state_2_key !== forced_s2_side && !(trial.data && trial.data.practice)) {
          // Ignore this response; wait for the correct key
          var keyboardListener = jsPsych.pluginAPI.getKeyboardResponse({
            callback_function: after_second_response,
            valid_responses: trial.valid_responses_s2,
            rt_method: 'performance',
            persist: false,
            allow_held_key: false
          });
          return;
        }
        
        response.state_2_choice = state_2_ids[response.state_2_key];

        // Defensive: ensure outcomes array exists and has valid entries
        if (!trial.outcomes || !Array.isArray(trial.outcomes) || trial.outcomes.length < 2) {
          trial.outcomes = trial.outcomes || [0, 0];
          // if outcome index is out of range, pad with zeros
          while (trial.outcomes.length < 2) { trial.outcomes.push(0); }
        }
        response.outcome = trial.outcomes[response.state_2_choice] || 0;

        // Present feedback.
        state_2_feedback(response.state_2_key, response.outcome)

        // Pause for animation (2s).
        setTimeout(function() { end_trial(); }, trial.feedback_duration);

      };

      // function to present second state feedback.
      var state_2_feedback = function(side, outcome) {
        // Show numeric gem reward. outcome is an integer number of gems.
        // Hide other gems/rewards first.
        [0,1].forEach(function(s) {
          var gem_other = display_element.querySelector('#gem-' + s);
          if (gem_other) { gem_other.style.display = 'none'; }
          var reward_other = display_element.querySelector('#reward-' + s);
          if (reward_other) { reward_other.textContent = ''; reward_other.removeAttribute('status'); }
          var alien_other = display_element.querySelector('#alien-' + s);
          if (alien_other) { alien_other.removeAttribute('status'); }
        });

        // Small reward next to the chosen alien: we won't display the +N here
        // (the centered +N will remain). Keep the small container for styling
        // or icon placement but do not show the numeric value.
        var reward_el = display_element.querySelector('#reward-' + side);
        if (reward_el) {
          reward_el.textContent = '';
          reward_el.setAttribute('status', 'chosen');
        }

        // Show gem image next to the chosen alien (large size) only if outcome > 0
        var gem_el = display_element.querySelector('#gem-' + side);
        var alien_el = display_element.querySelector('#alien-' + side);
        if (gem_el && alien_el && outcome > 0) {
          // Position gem relative to the alien on the correct side
          var GEM_W = 100, GEM_H = 100;  // Large gem size
          var alienRect = alien_el.getBoundingClientRect();
          var parentRect = display_element.getBoundingClientRect();
          var x = alienRect.left - parentRect.left + (alienRect.width/2) - (GEM_W/2);
          var y = alienRect.top - parentRect.top - GEM_H - 6;
          gem_el.style.left = x + 'px';
          gem_el.style.top = y + 'px';
          gem_el.style.display = 'block';
          gem_el.style.width = GEM_W + 'px';
          gem_el.style.height = GEM_H + 'px';
        }

        // Large centered reward in the middle of the screen
        var center_el = display_element.querySelector('#center-reward');
        if (center_el) {
          if (outcome === undefined || outcome === null) { outcome = 0; }
          center_el.textContent = '+' + String(outcome);
          center_el.style.display = 'block';
        }

        // Update gem counter (top of screen): accumulate gems this block.
        try {
          if (typeof window.gem_counter === 'undefined') { window.gem_counter = 0; }
          window.gem_counter = window.gem_counter + (Number(outcome) || 0);
          var gemCounterEl = display_element.querySelector('#gem-counter');
          if (gemCounterEl) {
            gemCounterEl.textContent = window.gem_counter;
            gemCounterEl.style.display = trial.show_gem_counter ? 'block' : 'none';
          }
          // Update total gems across all blocks (exclude practice trials)
          if (!trial.data || !trial.data.practice) {
            if (typeof window.total_gems === 'undefined') { window.total_gems = 0; }
            window.total_gems = window.total_gems + (Number(outcome) || 0);
          }
        } catch (e) {
          // ignore
        }

        // Mark chosen alien for styling.
        if (alien_el) { alien_el.setAttribute('status', 'chosen'); }
      }

      // function to end trial
      var end_trial = function() {

        // kill any remaining setTimeout handlers
        jsPsych.pluginAPI.clearAllTimeouts();

        // kill keyboard listeners
        if (typeof keyboardListener !== 'undefined') {
          jsPsych.pluginAPI.cancelKeyboardResponse(keyboardListener);
        }

        // gather the data to store for the trial
        var trial_data = {
          state_1_ids: state_1_ids,
          state_1_key: response.state_1_key,
          state_1_choice: response.state_1_choice,
          state_1_rt: response.state_1_rt,
          transition: trial.transition,
          state: response.state_2,
          state_2_ids: state_2_ids,
          state_2_key: response.state_2_key,
          state_2_choice: response.state_2_choice,
          state_2_rt: response.state_2_rt,
          outcome: response.outcome,
          rocket_colors: trial.rocket_colors,
          planet_colors: trial.planet_colors,
          screen_resolution: screen_resolution,
          minimum_resolution: minimum_resolution
        };

        // clear the display
        display_element.innerHTML = '';

        // move on to the next trial
        jsPsych.finishTrial(trial_data);
      };

      // start the response listener
      var keyboardListener = jsPsych.pluginAPI.getKeyboardResponse({
        callback_function: after_first_response,
        valid_responses: trial.valid_responses_s1,
        rt_method: 'performance',
        persist: false,
        allow_held_key: false
      });

      // end trial if no response.
      if (trial.choice_duration !== null) {
        jsPsych.pluginAPI.setTimeout(function() {
          missed_response();
        }