// Number of milliseconds to debounce inputs before auto-saving
const DEBOUNCE_INTERVAL = 500;
// Key for storing prices in localStorage
const LS_KEY = 'prices';
let debounceTimeout;

/**
 * Get element references
 */
// All inputs
const elemInputs = [
  document.getElementById('day1am'),
  document.getElementById('day1pm'),
  document.getElementById('day2am'),
  document.getElementById('day2pm'),
  document.getElementById('day3am'),
  document.getElementById('day3pm'),
  document.getElementById('day4am'),
  document.getElementById('day4pm'),
  document.getElementById('day5am'),
  document.getElementById('day5pm'),
  document.getElementById('day6am'),
  document.getElementById('day6pm'),
];
// Where we'll display the analysis output
const elemAnalysisResult = document.getElementById('analysisResult');

/**
 * Page is ready, initialize
 */
function onReady () {
  // Attempt to restore prices from localStorage
  const saved = localStorage.getItem(LS_KEY);

  if (saved) {
    // We found prices in localStorage, so enter them into the inputs
    const prices = saved.split(',');

    prices.forEach((price, index) => {
      elemInputs[index].value = price;
    });

    // Analyze the prices
    _analyze(false);
  }
}

/**
 * Handle any values entered into any of the form's inputs. Debounces input.
 */
function onInput () {
  if (debounceTimeout) {
    clearTimeout(debounceTimeout);
  }

  // Show the user that something's going on
  elemAnalysisResult.innerText = '...';

  debounceTimeout = setTimeout(() => {
    _analyze(true);
  }, DEBOUNCE_INTERVAL);
}

/**
 * Handle form submission
 */
function onSubmit (event) {
  // Don't actually submit the form
  event.preventDefault();
}

/**
 * Click handler for the Reset button
 */
function reset () {
  // Removed saved values from localStorage
  localStorage.removeItem(LS_KEY);

  // Clear all input values
  elemInputs.forEach((input) => {
    input.value = undefined;
  });

  // Reset analysis
  _analyze(false);
}

/**
 * Analyze prices for any trends
 *
 * @param {Boolean} save - Save after analyzing
 */
function _analyze (save) {
  // Convert prices into an array of numbers and/or `undefined`
  const normalized = elemInputs.map((input) => {
    const priceNum = Number(input.value);

    // If we don't get a number, or the number is less than 0 then toss it
    if (Number.isNaN(priceNum) || priceNum < 1) {
      return undefined;
    }

    return priceNum;
  });

  // Try to determine a pattern
  const analysis = analyze([...normalized]);

  let result = '???';
  if (analysis === 'spikeSmall') {
    result = 'Small Spike Pattern';
  } else if (analysis === 'spikeBig') {
    result = 'Big Spike Pattern';
  } else if (analysis === 'decreasing') {
    result = 'Decreasing Pattern';
  } else if (analysis === 'random') {
    result = 'Random Pattern';
  }

  // Display the result to the user
  elemAnalysisResult.innerText = result;

  if (save) {
    // Save values to localStorage
    localStorage.setItem(LS_KEY, normalized.join(','));
  }
}

/**
 * ac-stalk-market-analyzer v1.0.1
 */
function analyze(prices) {
  // Start off with the first price since we'll have nothing to compare it to
  let lastPrice = prices.shift();
  // 1 = increase, 0 = decrease, - = no price defined for comparison
  let changes = '';
  // Determine whether each price increases or decreases from the previous one
  prices.forEach(price => {
      if (lastPrice === undefined || price === undefined) {
          changes += '-';
      }
      else if (price > lastPrice) {
          // Increase
          changes += '1';
      }
      else {
          // Decrease
          changes += '0';
      }
      lastPrice = price;
  });
  // Try to detect spikes first
  if (changes.indexOf('1111') >= 0) {
      // Small Spike
      return 'spikeSmall';
  }
  else if (changes.indexOf('111') >= 0) {
      // Big Spike
      return 'spikeBig';
  }
  // Prepare a separate string of "every price decreases" for comparison to our calculated changes
  const allDecreasing = new Array(prices.length).fill(0).join('');
  if (changes === allDecreasing) {
      return 'decreasing';
  }
  // No patterns were detected, and we've detected incomplete data
  if (changes.indexOf('-') >= 0) {
      return 'unknown';
  }
  // If we get this far we weren't able to discern any pattern
  return 'random';
}
