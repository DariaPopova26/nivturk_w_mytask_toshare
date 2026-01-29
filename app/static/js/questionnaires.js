//------------------------------------//
// Define questionnaires.
//------------------------------------//

// Pre-questionnaires screen
var pre_questionnaires = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: "<p>You will now complete 3 short questionnaires about mental health.</p><p>Press any key to continue.</p>",
  choices: "ALL_KEYS"
};

// End screen
var end_screen = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: function() {
    var total_gems = 0;
    try {
      total_gems = jsPsych.data.get()
        .filterCustom(function(t){ return t.trial_type === 'two-step-trial' && !t.practice; })
        .select('outcome')
        .sum();
    } catch (e) {
      total_gems = (typeof window.total_gems !== 'undefined') ? window.total_gems : 0;
    }
    return "<p>Congratulations! You are now done with the experiment.</p>" +
      "<p><b>Total gems earned:</b> " + total_gems + "</p>" +
      "<p>These gems will be converted to your performance bonus</p>" +
      "<p>To claim your reward, enter this code on Prolific: <b>GALAXY</b></p>" +
      "<p>Press any key to finish. You may close this window after.</p>";
  },
  choices: "ALL_KEYS"
};

// Demographics questionnaire
var demo = {
  type: 'survey-demo',
  data: {survey: 'demographics'}
};

// Debriefing questionnaire
var debrief = {
  type: 'survey-debrief',
  data: {survey: 'debrief'}
};

// Raven's progressive matrices instructions
var rpm_instructions = {
  type: 'instructions',
  pages: [
    "<h3>PUZZLE TASK</h3><p style='width: 60vw; text-align: center'>On the next page, you will be presented with <b>9 puzzles</b>. For each puzzle, your task is to <b>identify the missing piece</b> from the options appearing below the puzzle.</p><p style='width: 60vw; text-align: center'>You will have <b>6 minutes</b> to complete the task. Not everyone finishes in time<br>or answers every question correctly - just do the best you can.</p><p>Click next to start the task.</p>"
  ],
  show_clickable_nav: true,
  button_label_previous: 'Prev',
  button_label_next: 'Next',
  on_finish: function(trial) {
    pass_message('starting rpm');
  }
}

// Raven's progressive matrices task
var rpm = {
  type: 'survey-rpm',
  data: {survey: 'rpm'}
}

// Raven's progressive matrices block
var rpm_block = {
  timeline: [rpm_instructions, rpm]
}

// Anxiety control questionnaire
var acqr = {
  type: jsPsychSurveyTemplate,
  items: [
    "I can usually put worrisome thoughts out of my mind easily.",
    "I am able to control my level of anxiety.",
    "I can usually relax when I want.",
    "I am unconcerned if I become anxious in a difficult situation, because I am confident in my ability to cope with my symptoms.",
    "When I am anxious, I find it hard to focus on anything other than my anxiety.",
    "When I am frightened by something, there is generally nothing I can do.",
    "Whether I can successfully escape a frightening situation is always a matter of chance with me.",
    "There is little I can do to change frightening events.",
    "The extent to which a difficult situation resolves itself has nothing to do with my actions.",
    "If something is going to hurt me, it will happen no matter what I do.",
    "Most events that make me anxious are outside my control.",
    "How well I cope with difficult situations depends on whether I have outside help.",
    "When I am put under stress, I am likely to lose control.",
    "When I am under stress, I am not always sure how I will react.",
    "I usually find it hard to deal with difficult problems.",
    "I obey the laws of gravity" // attention check
  ],
  scale: [
    "Strongly<br>Disagree",
    "Moderately<br>Disagree",
    "Slightly<br>Disagree",
    "Slightly<br>Agree",
    "Moderately<br>Agree",
    "Strongly<br>Agree"
  ],
  reverse: [
    true, true, true, true, false, false, false, false,
    false, false, false, false, false, false, false, true
  ],
  instructions: "Please read each statement below carefully and indicate how much you think each statement is typical of you.",
  randomize_question_order: true,
  scale_repeat: 8,
  survey_width: 90,
  item_width: 50,
  data: {survey: 'acqr'}
}

// NPOQ
var npoq = {
  type: jsPsychSurveyTemplate,
  items: [
    "I see problems as a threat to my well-being",
    "I often doubt my capacity to solve problems",
    "Often before even trying to find a solution, I tell myself that it is difficult to solve problems",
    "My problems often seem insurmountable",
    "When I attempt to solve a problem, I often question my abilities",
    "I often have the impression that my problems cannot be solved",
    "Even if I manage to find some solutions to my problems, I doubt that they will be easily resolved",
    "I have a tendency to see problems as a danger",
    "My first reaction when faced with a problem is to question my abilities",
    "I often see my problems as bigger than they really are",
    "Even if I have looked at a problem from all possible angles, I still wonder if the solution I decided on will be effective",
    "I consider problems to be obstacles that interfere with my functioning",
    "When I sleep, I close my eyes" // attention check
  ],
  scale: [
    "Extremely<br>uncharacteristic<br>of me",
    "Somewhat<br>uncharacteristic<br>of me",
    "Uncertain",
    "Somewhat<br>characteristic<br>of me",
    "Extremely<br>characteristic<br>of me"
  ],
  reverse: [
    false, false, false, false, false, false, false, false,
    false, false, false, false, true
  ],
  instructions: "Please read each statement below carefully and indicate how much you think each statement is characteristic of you.",
  randomize_question_order: true,
  scale_repeat: 8,
  survey_width: 90,
  item_width: 50,
  data: {survey: 'npoq'}
}


// Generalized anxiety disorder questionnaire
var gad7 = {
  type: jsPsychSurveyTemplate,
  items: [
    "Feeling nervous, anxious, or on edge",
    "Not being able to stop or control worrying",
    "Worrying too much about different things",
    "Trouble relaxing",
    "Being so restless that it's hard to sit still",
    "Becoming easily annoyed or irritable",
    "Feeling afraid as if something awful might happen",
    "Growing 5 inches taller" // attention check
  ],
  scale: [
    "Not at all",
    "Several days",
    "Over half the days",
    "Nearly every day"
  ],
  reverse: [false, false, false, false, false, false, false, false],
  instructions: "Over the <b>last 2 weeks</b>, how often have you been bothered by the following problems?",
  randomize_question_order: true,
  scale_repeat: 8,
  survey_width: 70,
  item_width: 40,
  data: {survey: 'gad7'}
}

// Seven-up Seven Down
var sudu = {
  type: 'survey-template',
  items: [
    "Have you had periods of extreme happiness and intense energy lasting several days or more when you also felt much more anxious or tense (jittery, nervous, uptight) than usual (other than related to the menstrual cycle)?",
    "Have there been times of several days or more when you were so sad that it was quite painful or you felt that you couldn't stand it?",
    "Have there been times lasting several days or more when you felt you must have lots of excitement, and you actually did a lot of new or different things?",
    "Have you had periods of extreme happiness and intense energy (clearly more than your usual self) when, for several days or more, it took you over an hour to get to sleep at night?",
    "Have there been long periods in your life when you felt sad, depressed, or irritable most of the time?",
    "Have you had periods of extreme happiness and high energy lasting several days or more when what you saw, heard, smelled, tasted, or touched seemed vivid or intense?",
    "Have there been periods of several days or more when your thinking was so clear and quick that it was much better than most other people's?",
    "Have there been times of a couple days or more when you felt that you were a very important person or that your abilities or talents were better than most other people's?",
    "Have there been times when you have hated yourself or felt that you were stupid, ugly, unlovable, or useless?",
    "Have there been times of several days or more when you really got down on yourself and felt worthless?",
    "Have you had periods when it seemed that the future was hopeless and things could not improve?",
    "Have there been periods lasting several days or more when you were so down in the dumps that you thought you might never snap out of it?",
    "Have you had times when your thoughts and ideas came so fast that you couldn't get them all out, or they came so quickly that others complained that they couldn't keep up with your ideas?",
    "Have there been times when you have felt that you would be better off dead?",
    "Have there been times of a couple days or more when you were able to stop breathing entirely (without the aid of medical equipment)?"
  ],
  scale: [
    "Never or<br>hardly ever",
    "Sometimes",
    "Often",
    "Very often or<br>almost constantly"
  ],
  reverse: [false, false, false, false, false, false, false, false,
            false, false, false, false, false, false, false],
  instructions: "Below are some questions about behaviors that occur in the general population. Select the response that best describes how often you experience these behaviors.",
  randomize_question_order: true,
  scale_repeat: 8,
  survey_width: 85,
  item_width: 50,
  data: {survey: '7up7down'}
}


// Need for control questionnaire
var nfc6 = {
  type: 'survey-template',
  items: [
    "I would prefer complex to simple problems.",
    "I like to have the responsibility of handling a situation that requires a lot of thinking.",
    "Thinking is not my idea of fun.",
    "I would rather do something that requires little thought than something that is sure to challenge my thinking abilities.",
    "I really enjoy a task that involves coming up with new solutions to problems.",
    "I would prefer a task that is intellectual, difficult, and important to one that is somewhat important but does not require much thought.",
  ],
  scale: [
    "Extremely<br>uncharacteristic<br>of me",
    "Somewhat<br>uncharacteristic<br>of me",
    "Uncertain",
    "Somewhat<br>characteristic<br>of me",
    "Extremely<br>uncharacteristic<br>of me"
  ],
  reverse: [false, false, true, true, false, false],
  instructions: "For each of the statements below, please indicate whether or not the statement is characteristic of you or of what you believe.",
  randomize_question_order: true,
  scale_repeat: 8,
  survey_width: 80,
  item_width: 45,
  data: {survey: 'nfc6'}
}

// Define survey block
surveys = [gad7, npoq, acqr];


// Define mental health alert
mha = {
  type: jsPsychMentalHealthAlert
}

//------------------------------------//
// Define quality check
//------------------------------------//
// Check responses to infrequency items. Reject participants
// who respond carelessly on 2 or more items.

// Define infrequency item check.
var score_infrequency_items = function() {

  // Get infrequency items.
  var acqr = jsPsych.data.get().filter({survey: 'acqr'}).select('responses').values[0]['Q16'];
  var gad7 = jsPsych.data.get().filter({survey: 'gad7'}).select('responses').values[0]['Q08'];
  var sudu = jsPsych.data.get().filter({survey: '7up7down'}).select('responses').values[0]['Q15'];
  var sudu_rt = jsPsych.data.get().filter({survey: '7up7down'}).select('rt').values[0] / 1000.;

  // Score items.
  acqr = acqr < 3;        // Response should be [4,5,6]
  gad7 = gad7 > 0;        // Response should be 0
  sudu = sudu > 0;        // Response should be 0

  // Score 7up-7down completion time.
  if (sudu_rt < 15) {
    sudu_rt = 2;
  } else if (sudu_rt < 30) {
    sudu_rt = 1;
  } else {
    sudu_rt = 0;
  }

  // Assess responding.
  var num_careless = acqr + gad7 + Math.max(sudu, sudu_rt);
  if (num_careless < 2) {
    var low_quality = false;
  } else {
    var low_quality = true;
  }

  return low_quality;
}

var infrequency_check = {
  type: 'call-function',
  func: score_infrequency_items,
  on_finish: function(trial) {
    low_quality = jsPsych.data.getLastTrialData().values()[0].value;
    if (low_quality) { jsPsych.endExperiment(); }
  }
}

var score_rpm = function() {

  // Get completion time.
  var rt = jsPsych.data.get().filter({survey: 'rpm'}).select('rt').values[0] / 1000.;

  // Score completion time.
  if (rt < 15) {
    low_quality = true;
  } else {
    low_quality = false;
  }

  return low_quality;
}

var rpm_check = {
  type: 'call-function',
  func: score_rpm,
  on_finish: function(trial) {
    low_quality = jsPsych.data.getLastTrialData().values()[0].value;
    if (low_quality) { jsPsych.endExperiment(); }
  }
}
