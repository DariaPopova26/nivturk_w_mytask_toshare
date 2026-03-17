// Initialize jsPsych.
var jsPsych = initJsPsych({
  on_finish: async function() {

    // Add interactions to the data variable
    var interaction_data = jsPsych.data.getInteractionData();
    jsPsych.data.get().addToLast({interactions: interaction_data.json()});

    // Save jsPsych data to server, then navigate to complete page.
    // Awaiting the save ensures the POST completes before the browser navigates away.
    if (typeof save_success_data === 'function') {
      try {
        await save_success_data();
      } catch(error) {
        console.log(error);
      }
    }

    // Navigate to complete page only after save has finished.
    window.location = '/complete';

  }
});
