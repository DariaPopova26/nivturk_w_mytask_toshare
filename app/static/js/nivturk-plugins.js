const postJson = function(url, payload) {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload)
  });
};

const pass_message = function(msg) {
  postJson('/experiment', msg).catch((error) => {
    console.log(error);
  });
};

const save_success_data = function() {
  return postJson('/redirect_success', jsPsych.data.get().json());
};

const save_reject_data = function() {
  return postJson('/redirect_reject', jsPsych.data.get().json());
};

const save_error_data = function() {
  return postJson('/redirect_error', jsPsych.data.get().json());
};

const save_incomplete_data = function() {
  return postJson('/incomplete_save', jsPsych.data.get().json());
};
