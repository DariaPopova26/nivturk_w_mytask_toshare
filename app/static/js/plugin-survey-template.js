var jsPsychSurveyTemplate = (function (jspsych) {
  'use strict';

  const info = {
    name: 'survey-template',
    description: '',
    parameters: {
      items: {
        type: jspsych.ParameterType.HTML_STRING,
        array: true,
        pretty_name: 'Items',
        decription: 'The questions associated with the survey'
      },
      scale: {
        type: jspsych.ParameterType.HTML_STRING,
        array: true,
        pretty_name: 'Scale',
        decription: 'The response options associated with the survey'
      },
      reverse: {
        type: jspsych.ParameterType.BOOL,
        array: true,
        pretty_name: 'Randomize Question Order',
        default: [],
        description: 'If true, the corresponding item will be reverse scored'
      },
      scoring_index: {
        type: jspsych.ParameterType.INT,
        pretty_name: 'Scoring index',
        decription: 'The minimum item score (e.g. 0 if scoring is 0-indexed)',
        default: 0
      },
      infrequency_items: {
        type: jspsych.ParameterType.INT,
        array: true,
        pretty_name: 'Infrequency items',
        decription: 'Infrequency-check item numbers (0-indexed)',
        default: null
      },
      instructions: {
        type: jspsych.ParameterType.HTML_STRING,
        pretty_name: 'Instructions',
        decription: 'The instructions associated with the survey'
      },
      randomize_question_order: {
        type: jspsych.ParameterType.BOOL,
        pretty_name: 'Randomize Question Order',
        default: true,
        description: 'If true, the order of the questions will be randomized'
      },
      scale_repeat: {
        type: jspsych.ParameterType.INT,
        pretty_name: 'Scale repeat',
        default: 10,
        description: 'The number of items before the scale repeats'
      },
      survey_width: {
        type: jspsych.ParameterType.INT,
        pretty_name: 'Survey width',
        default: 900,
        description: 'The number of pixels occupied by the survey'
      },
      item_width: {
        type: jspsych.ParameterType.INT,
        pretty_name: 'Item width',
        default: 50,
        description: 'The percentage of a row occupied by an item text'
      },
      button_label: {
        type: jspsych.ParameterType.STRING,
        pretty_name: 'Button label',
        default:  'Continue',
        description: 'The text that appears on the button to finish the trial.'
      },
    }
  }

  /* jspsych-survey-template.js
  * a jspsych plugin extension for measuring items on a likert scale
  *
  * authors: Sam Zorowitz, Dan Bennett
  *
  */
  class SurveyTemplatePlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }
    trial(display_element, trial) {

      //---------------------------------------//
      // Define survey HTML.
      //---------------------------------------//

      // Initialize HTML
      var html = '';

      // Define CSS constants
      const n  = trial.scale.length;              // Number of item responses
      const x1 = trial.item_width;                // Width of item prompt (percentage)
      const x2 = (100 - trial.item_width) / n;    // Width of item response (percentage)

      const survey_width_css = (trial.survey_width <= 100)
        ? `${trial.survey_width}vw`
        : `${trial.survey_width}px`;

      // Insert CSS
      html += `<style>
      .survey-template-wrap {
        height: 100vh;
        width: 100vw;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        padding: 24px 16px 40px;
        box-sizing: border-box;
        --survey-width: ${survey_width_css};
      }
      .survey-template-instructions {
        width: var(--survey-width);
        max-width: 1100px;
        margin: 0 auto 12px;
        font-size: 16px;
        line-height: 1.5em;
      }
      .survey-template-container {
        display: grid;
        grid-template-columns: ${x1}% repeat(${n}, ${x2}%);
        grid-template-rows: auto;
        width: var(--survey-width);
        max-width: 1100px;
        margin: 0 auto;
        background-color: #F8F8F8;
        border-radius: 8px;
      }
      .survey-template-row {
        display: contents;
      }
      .survey-template-row:hover div {
        background-color: #dee8eb;
      }
      .survey-template-header {
        padding: 18px 0 0px 0;
        text-align: center;
        font-size: 14px;
        line-height: 1.15em;
      }
      .survey-template-prompt {
        padding: 12px 0 12px 15px;
        text-align: left;
        font-size: 15px;
        line-height: 1.15em;
        justify-items: center;
      }
      .survey-template-response {
        padding: 12px 0 12px 0;
        font-size: 13px;
        text-align: center;
        line-height: 1.15em;
        justify-items: center;
      }
      .survey-template-response input[type='radio'] {
        position: relative;
        width: 16px;
        height: 16px;
      }
      .survey-template-response .pseudo-input {
        position: relative;
        height: 0px;
        width: 0px;
        display: inline-block;
      }
      .survey-template-response .pseudo-input:after {
        position: absolute;
        left: 6.5px;
        top: -6px;
        height: 2px;
        width: calc(var(--survey-width) * ${x2 / 100} - 100%);
        background: #d8dcd6;
        content: "";
      }
      .survey-template-response:last-child .pseudo-input:after {
        display: none;
      }
      .survey-template-footer {
        margin: 0 auto;
        width: var(--survey-width);
        max-width: 1100px;
        padding: 0 0 0 0;
        text-align: right;
      }
      .survey-template-footer input[type=submit] {
        background-color: #F0F0F0;
        padding: 8px 20px;
        border: none;
        border-radius: 4px;
        margin-top: 5px;
        margin-bottom: 20px;
        margin-right: 0px;
        font-size: 13px;
        color: black;
      }
      /* honeypot css */
      .survey-template-block {
        position: absolute;
        top: 0%;
        -webkit-transform: translate3d(0, -100%, 0);
        transform: translate3d(0, -100%, 0);
      }
      </style>`;

      // Initialize survey.
      html += '<div class="survey-template-wrap">';

      // Add instructions.
      html += '<div class="survey-template-instructions">' + trial.instructions + '</div><br>';

      // Setup table row for options.
      html += '<div class="survey-template-container">';
      html += '<div class="survey-template-row">';
      html += '<div></div>';
      for (var i = 0; i < trial.scale.length; i++) {
        html += '<div class="survey-template-header">' + trial.scale[i] + '</div>';
      }
      html += '</div>'; // close header row

      // Randomize order of questions, if necessary.
      var question_order = [];
      for (var i = 0; i < trial.items.length; i++) {
        question_order.push(i);
      }
      if (trial.randomize_question_order) {
        question_order = this.jsPsych.randomization.shuffle(question_order);
      }

      // Add each item.
      for (var j = 0; j < trial.items.length; j++) {
        var q = question_order[j];
        html += '<div class="survey-template-row">';
        html += '<div class="survey-template-prompt">' + trial.items[q] + '</div>';
        for (var k = 0; k < trial.scale.length; k++) {
          html += '<div class="survey-template-response">';
          html += '<input type="radio" name="Q' + q + '" value="' + k + '" required>'; 
          html += '<span class="pseudo-input"></span>';
          html += '</div>';
        }
        html += '</div>'; // close survey-template-row
      }

      html += '</div>'; // close survey-template-container

      // Add text field to catch bots.
      html += '<input type="text" name="email" class="survey-template-block" autocomplete="off">';

      // Add submit button.
      html += '<div class="survey-template-footer"><input type="submit" id="jspsych-survey-template-submit" value="' + trial.button_label + '"></div>';

      html += '</div>'; // close survey-template-wrap

      // Display
      display_element.innerHTML = html;

      // Log response times.
      var start_time = performance.now();

      // Validate and save responses.
      display_element.querySelector('#jspsych-survey-template-submit').addEventListener('click', (event) => {
        event.preventDefault();

        // Ensure all items are answered.
        var responses = {};
        var all_answered = true;
        for (var j = 0; j < trial.items.length; j++) {
          var q = j;
          var selected = display_element.querySelector('input[name="Q' + q + '"]:checked');
          if (selected) {
            responses['Q' + (q + 1).toString().padStart(2, '0')] = parseInt(selected.value);
          } else {
            all_answered = false;
          }
        }

        // Check honeypot
        var honeypot = display_element.querySelector('input[name="email"]').value;
        if (honeypot !== '') {
          all_answered = false;
        }

        // Return if not all answered.
        if (!all_answered) {
          alert('Please respond to all questions.');
          return;
        }

        // Score responses.
        var scores = {};
        var total_score = 0;
        for (var j = 0; j < trial.items.length; j++) {
          var q = j;
          var value = responses['Q' + (q + 1).toString().padStart(2, '0')];
          var score = trial.reverse[q] ? (trial.scale.length - 1 - value) : value;
          total_score += score + trial.scoring_index;
          scores['Q' + (q + 1).toString().padStart(2, '0')] = score + trial.scoring_index;
        }

        // Define trial data.
        var trial_data = {
          rt: performance.now() - start_time,
          responses: responses,
          scores: scores,
          score: total_score
        }

        // Finish trial.
        this.jsPsych.finishTrial(trial_data);
      });
    }
  }

  SurveyTemplatePlugin.info = info;

  return SurveyTemplatePlugin;

})(jsPsychModule);
