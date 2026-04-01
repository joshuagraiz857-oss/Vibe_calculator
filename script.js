/**
 * @fileoverview BGH Procurement Calculator Logic
 * Includes DOM Manipulation and Event Delegation techniques.
 */

// 1. DOM Interaction: Selecting elements using document.querySelector
// We grab the display element to update the numbers,
// and the keypad element to attach our SINGLE event listener.
const displayElement = document.querySelector('#calculator-display');
const keypadElement = document.querySelector('#keypad');

// State variables to hold the current calculating context
let currentInput = '0';
let previousInput = '';
let currentOperator = null;
let shouldResetDisplay = false; // Flag to reset display on next number click after an operator

/**
 * Updates the calculator display using textContent.
 * @param {string} value - The string to show on the calculator screen.
 */
function updateDisplay(value) {
    // We use .textContent instead of .innerHTML for security (prevents XSS)
    // and performance when updating plain text.
    displayElement.textContent = value;
}

/**
 * Handles arithmetic logic
 */
function calculate() {
    if (currentOperator === null || previousInput === '') return;

    let result = 0;
    const prev = parseFloat(previousInput);
    const current = parseFloat(currentInput);

    if (isNaN(prev) || isNaN(current)) return;

    switch (currentOperator) {
        case '+':
            result = prev + current;
            break;
        case '-':
            result = prev - current;
            break;
        case '*':
            result = prev * current;
            break;
        case '/':
            // Handle divide by zero to prevent Infinity crashing the view context
            result = current === 0 ? "Error" : prev / current;
            break;
        case '%':
            result = prev % current;
            break;
        default:
            return;
    }

    // Convert to string and handle long decimals
    currentInput = result.toString();
    currentOperator = null;
    previousInput = '';
}

/**
 * EVENT DELEGATION
 * Instead of adding 18 different event listeners (one for each button),
 * we attach ONE event listener to the parent container (.keypad).
 * 
 * WHY USE e.target?
 * When you click inside the #keypad, the click event "bubbles up" to the parent.
 * The 'event' object (e) contains information about the click.
 * 'e.target' points explicitly to the exact element that was clicked (e.g., a specific button).
 * This improves performance and simplifies the code significantly.
 * 
 * FLOW OF DATA:
 * User Click -> keypadElement captures the event -> We check if e.target is a button -> We route logic based on data attributes -> updateDisplay() modifies the DOM.
 */
keypadElement.addEventListener('click', function(e) {
    // 1. Identify what was clicked.
    const target = e.target;

    // 2. If the click wasn't on a button, do nothing (ignore clicks on the gap/container itself)
    if (!target.matches('button')) {
        return;
    }

    // 3. Extract the operation or value using dataset
    const action = target.dataset.action; // 'clear', 'delete', 'operator', 'calculate', or undefined for numbers
    const value = target.dataset.value;   // The string value: '7', '8', '+', etc.

    // FLOW ROUTING: Decide what to do based on the button clicked

    // Handle AC (All Clear)
    if (action === 'clear') {
        currentInput = '0';
        previousInput = '';
        currentOperator = null;
        updateDisplay(currentInput);
        return;
    }

    // Handle DEL (Delete last character)
    if (action === 'delete') {
        if (currentInput === "Error") {
            currentInput = '0';
        } else {
            currentInput = currentInput.length > 1 ? currentInput.slice(0, -1) : '0';
        }
        updateDisplay(currentInput);
        return;
    }

    // Handle Operators (+, -, *, /, %)
    if (action === 'operator') {
        if (currentInput === "Error") currentInput = "0";

        // If we already have an operator and a previous input, calculate intermediate result first
        if (currentOperator !== null && !shouldResetDisplay) {
            calculate();
            updateDisplay(currentInput);
        }
        
        previousInput = currentInput;
        currentOperator = value;
        shouldResetDisplay = true; // Next number will wipe the current display rather than append
        return;
    }

    // Handle Equals (=)
    if (action === 'calculate') {
        calculate();
        updateDisplay(currentInput);
        shouldResetDisplay = true; // Wait for next interaction
        return;
    }

    // Handle Numbers and Decimals (no specific 'action' set, just a 'value')
    if (!action) {
        // If the calculator was showing an Error, clear it out
        if (currentInput === "Error") {
            currentInput = "0";
        }

        // Decimal point logic
        if (value === '.') {
            if (shouldResetDisplay) {
                currentInput = '0.';
                shouldResetDisplay = false;
            } else if (!currentInput.includes('.')) {
                currentInput += '.';
            }
        } 
        // Number logic
        else {
            if (currentInput === '0' || shouldResetDisplay) {
                currentInput = value;
                shouldResetDisplay = false;
            } else {
                currentInput += value;
            }
        }
        
        updateDisplay(currentInput);
    }
});
