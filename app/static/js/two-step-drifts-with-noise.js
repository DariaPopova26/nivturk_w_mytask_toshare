// rewards with noise: clean rewards + Gaussian noise N(0, 2)
// Structure: 5 blocks, 62 trials per block (50 standard + 12 forced)
// Reward structure: [deterministic_alien_1, deterministic_alien_2, prob_planet_1_alien_1, prob_planet_1_alien_2, prob_planet_2_alien_1, prob_planet_2_alien_2]

// Box-Muller transform to generate Gaussian random numbers
function gaussianRandom(mean = 0, stdev = 1) {
  let u = 0, v = 0;
  while(u === 0) u = Math.random(); // Converting [0,1) to (0,1)
  while(v === 0) v = Math.random();
  let z0 = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
  return z0 * stdev + mean;
}

// Clean rewards for each block (from two-step-clean-rewards.js)
const cleanRewards = {
  block_01: [[3, 7], [6, 9], [2, 3]],
  block_02: [[2, 4], [6, 11], [1, 2]],
  block_03: [[4, 6], [5, 9], [1, 4]],
  block_04: [[6, 10], [9, 11], [2, 4]],
  block_05: [[8, 10], [9, 10], [2, 8]]
};

// Function to generate trials with noise for a block
function generateBlockWithNoise(cleanRewardsBlock) {
  const trials = [];
  const trialsPerCycle = 50;
  const forcedChoiceTrials = 12;
  const totalTrials = trialsPerCycle + forcedChoiceTrials;
  
  // Flatten the 3 pairs into 6 aliens
  const aliens = [
    cleanRewardsBlock[0][0], // deterministic branch, alien 1
    cleanRewardsBlock[0][1], // deterministic branch, alien 2
    cleanRewardsBlock[1][0], // probabilistic planet 1, alien 1
    cleanRewardsBlock[1][1], // probabilistic planet 1, alien 2
    cleanRewardsBlock[2][0], // probabilistic planet 2, alien 1
    cleanRewardsBlock[2][1]  // probabilistic planet 2, alien 2
  ];
  
  for (let i = 0; i < totalTrials; i++) {
    const trial = aliens.map(alien => {
      // Add Gaussian noise N(0, 2) to each reward, then round to integer
      const noise = gaussianRandom(0, 2);
      // const noise = 0 // DEBUGGING: NO NOISE FOR NOW
      // Round after adding noise so results are integers; then clip to >= 0
      // NO NEGATIVE REWARDS ALLOWED
      const noisyReward = Math.max(0, Math.round(alien + noise));
      return noisyReward;
    });
    trials.push(trial);
  }
  
  return trials;
}

// Generate noisy rewards for all 5 blocks, global access
const _drifts_01 = generateBlockWithNoise(cleanRewards.block_01);
const _drifts_02 = generateBlockWithNoise(cleanRewards.block_02);
const _drifts_03 = generateBlockWithNoise(cleanRewards.block_03);
const _drifts_04 = generateBlockWithNoise(cleanRewards.block_04);
const _drifts_05 = generateBlockWithNoise(cleanRewards.block_05);

// Attach to window to ensure availability in all script contexts
window.drifts_01 = _drifts_01;
window.drifts_02 = _drifts_02;
window.drifts_03 = _drifts_03;
window.drifts_04 = _drifts_04;
window.drifts_05 = _drifts_05;

// Also provide an array shortcut
window.all_noisy_drifts = [window.drifts_01, window.drifts_02, window.drifts_03, window.drifts_04, window.drifts_05];
