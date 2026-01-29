// Initialize jsPsych.
var jsPsych = initJsPsych({
  on_finish: function() {

    // Add interactions to the data variable
    var interaction_data = jsPsych.data.getInteractionData();
    jsPsych.data.get().addToLast({interactions: interaction_data.json()});

    // Save jsPsych data to server
    if (typeof save_success_data === 'function') {
      save_success_data().catch(function(error) {
        console.log(error);
      });
    }

  }
});
