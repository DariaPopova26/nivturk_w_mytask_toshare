var jsPsychTwoStepAlienPractice = (function (jspsych) {
  'use strict';

  const info = {
    name: 'alien-practice',
    description: '',
    parameters: {
      outcomes: {
        type: jspsych.ParameterType.INT,
        array: true,
        pretty_name: 'Outcomes',
        description: 'Reward outcome for each bandit (reward = 1, no reward = 0)'
      },
      aliens: {
        type: jspsych.ParameterType.HTML_STRING,
        array: true,
        pretty_name: 'Aliens',
        description: 'Paths to alien images (array of 2, 4, or 6 aliens).'
      },
      planet_color: {
        type: jspsych.ParameterType.HTML_STRING,
        pretty_name: 'Planet color',
        description: 'Colors of the alien planet.'
      },
      randomize: {
        type: jspsych.ParameterType.BOOL,
        pretty_name: 'Randomize',
        default: true,
        description: 'Randomize left/right positions of aliens.'
      },
      valid_responses: {
        type: jspsych.ParameterType.KEYCODE,
        array: true,
        pretty_name: 'Valid responses',
        default: ['arrowleft', 'arrowright'],
        description: 'The keys the subject is allowed to press to respond to the stimulus.'
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
      iti_duration: {
        type: jspsych.ParameterType.INT,
        pretty_name: 'Inter-trial interval duration',
        default: 1000,
        description: 'How long to hide stimuli on start of trial.'
      }
    }
  }

  /**
  * plugin-alien-practice
  * adapted from Sam Zorowitz, Branson Byers, Gili Karni
  *
  * plugin to run a practice trial of the second stage of the two-step task
  **/
  class TwoStepAlienPracticePlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }
    trial(display_element, trial) {

      //---------------------------------------//
      // Define HTML.
      //---------------------------------------//

      // Define CSS styling.
      var new_html = '';
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
      </style>`;

      // Open two-step container.
      new_html += '<div class="two-step-container">';

      // Draw sky & stars.
      new_html += '<div class="landscape-sky" state="2">';
      new_html += '<div class="stars"></div>';
      new_html += '</div>';

      // Draw ground.
      new_html += `<div class="landscape-ground" state="2" style="background: ${trial.planet_color}"></div>`;

      // Define mapping of aliens to sides.
      var state_2_ids = [0,1];
      if ( trial.randomize ) { state_2_ids = jsPsych.randomization.shuffle(state_2_ids); }

      // Draw aliens with error handling for missing images
      state_2_ids.forEach((j, i) => {
        new_html += `<div class="alien" id="alien-${i}" state="2" side="${i}" style="display: none;">`;
        // Normalize path: make absolute '/static/...' unless already absolute
        var alien_src = trial.aliens[state_2_ids[i]] || '';
        if (alien_src && alien_src.indexOf('/static/') !== 0 && alien_src.indexOf('http') !== 0) {
          alien_src = '/' + alien_src.replace(/^\/*/, '');
        }
        new_html += `<img id="alien-${i}-img" src="${alien_src}" onerror="this.style.display='none'"></img>`;
        new_html += '</div>';
        new_html += `<img class="gem-img" id="gem-${i}" src="/static/img/treasure_svg/gems.svg" style="display:none;position:absolute;z-index:30" />`;
      });

      // Large centered reward display (hidden until feedback)
      new_html += `<div id="center-reward" style="position: absolute; left: 50%; top: 45%; transform: translate(-50%, -50%); z-index: 1000; font-size: 48px; color: #ffffff; font-weight: 800; text-shadow: 0 2px 6px rgba(0,0,0,0.6); pointer-events: none; display: none;"></div>`;

      // Close wrapper.
      new_html += '</div>';

      // draw
      display_element.innerHTML = new_html;

      //---------------------------------------//
      // Response handling.
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
        state_2_key: null,
        state_2_choice: null,
        state_2_rt: null,
        outcome: null,
      }

      // function to handle missed responses
      var missed_response = function() {

        // Kill all setTimeout handlers.
        jsPsych.pluginAPI.clearAllTimeouts();
        jsPsych.pluginAPI.cancelAllKeyboardResponses();

        // Display warning message.
        const msg = '<p style="position: absolute; left: 50%; top: 50%; -webkit-transform: translate(-50%, -50%); transform: translate(-50%, -50%); font-size: 20px; line-height: 1.5em; color: black">You did not respond within the allotted time. Please pay more attention on the next trial.';

        display_element.innerHTML = '<style>.jspsych-content-wrapper {background: #606060;}</style><div class="two-step-container" style="background: #FFFFFF;">' + msg + '</div>';

        jsPsych.pluginAPI.setTimeout(function() {
          end_trial();
        }, 5000);

      }

      // function to handle responses by the subject
      var after_second_response = function(info) {

        // Kill all setTimeout handlers.
        jsPsych.pluginAPI.clearAllTimeouts();
        jsPsych.pluginAPI.cancelAllKeyboardResponses();

        // Record responses.
        response.state_2_rt = info.rt;
        response.state_2_key = trial.valid_responses.indexOf(info.key);
        response.state_2_choice = state_2_ids[response.state_2_key];
        
        // Ensure outcomes array is defined and has valid values
        if (!trial.outcomes || trial.outcomes.length < 2) {
          trial.outcomes = [0, 0];
        }
        response.outcome = trial.outcomes[response.state_2_choice] || 0;

        // Present feedback.
        state_2_feedback(response.state_2_key, response.outcome)

        // Pause for animation (2s).
        setTimeout(function() { end_trial(); }, trial.feedback_duration);

      };

      // function to present second state feedback.
      var state_2_feedback = function(side, outcome) {
        // outcome is now a numeric gem count (integer)
        // Ensure outcome is defined and is a number
        if (outcome === undefined || outcome === null) {
          outcome = 0;
        }
        
        // Show gem image next to the chosen alien (match main trial size) only if outcome > 0
        var gem_el = display_element.querySelector('#gem-' + side);
        var alien_el = display_element.querySelector('#alien-' + side);
        if (gem_el && alien_el && outcome > 0) {
          // Position gem relative to the alien on the correct side
          // Use 100px size to match the main trial plugin
          var GEM_W = 100, GEM_H = 100;
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
        
        // Large centered reward in the middle of the screen showing the numeric count
        var center_el = display_element.querySelector('#center-reward');
        if (center_el) {
          center_el.textContent = '+' + outcome.toString();
          center_el.style.display = 'block';
        }
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
          state_2_ids: state_2_ids,
          state_2_key: response.state_2_key,
          state_2_choice: response.state_2_choice,
          state_2_rt: response.state_2_rt,
          outcome: response.outcome,
          screen_resolution: screen_resolution,
          minimum_resolution: minimum_resolution
        };

        // clear the display
        display_element.innerHTML = '';

        // move on to the next trial
        jsPsych.finishTrial(trial_data);
      };

      // hide stimuli during iti
      var keyboardListener = '';
      jsPsych.pluginAPI.setTimeout(function() {

        // unhide stimili
        display_element.querySelector('#alien-0').style['display'] = 'block';
        display_element.querySelector('#alien-1').style['display'] = 'block';

        // start the response listener
        keyboardListener = jsPsych.pluginAPI.getKeyboardResponse({
          callback_function: after_second_response,
          valid_responses: trial.valid_responses,
          rt_method: 'performance',
          persist: false,
          allow_held_key: false
        });

      }, trial.iti_duration);

      // end trial if no response.
      if (trial.choice_duration !== null) {
        jsPsych.pluginAPI.setTimeout(function() {
          missed_response();
        }, trial.choice_duration + trial.iti_duration);
      };

    };
  }
  TwoStepAlienPracticePlugin.info = info;

  return TwoStepAlienPracticePlugin;

})(jsPsychModule);
