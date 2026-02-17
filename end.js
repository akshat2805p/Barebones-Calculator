// --- Calculator Elements ---
const acbtn = document.getElementById("ac");
const debtn = document.getElementById("de");
const numbtns = document.getElementsByClassName("numbers");
const opbtns = document.getElementsByClassName("operator");
const display = document.querySelector(".display");
const equalsign = document.getElementById("equal");

// --- History Elements ---
const historyList = document.getElementById("history-list");
const clearHistoryBtn = document.getElementById("clear-history");
let calculationHistory = [];

// --- Theme Toggle ---
const themeToggle = document.getElementById("theme-toggle");
themeToggle.addEventListener('change', () => {
    if (themeToggle.checked) {
        document.body.classList.remove('light-mode');
    } else {
        document.body.classList.add('light-mode');
    }
});
if (!themeToggle.checked) document.body.classList.add('light-mode');

// --- Navigation Logic ---
const viewCalc = document.getElementById("view-calculator");
const viewConv = document.getElementById("view-converter");
const viewHist = document.getElementById("view-history");
const navItems = document.querySelectorAll(".nav-item");

const views = {
    "view-calculator": viewCalc,
    "view-converter": viewConv,
    "view-history": viewHist
};

navItems.forEach(item => {
    item.addEventListener('click', () => {
        // Remove active class from all
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        const targetId = item.getAttribute('data-target');

        // Hide all views
        Object.values(views).forEach(view => {
            view.classList.remove('active-view');
            view.style.display = 'none';
        });

        // Show target view
        const targetView = views[targetId];
        if (targetView) {
            targetView.style.display = 'flex';
            setTimeout(() => targetView.classList.add('active-view'), 10);
        }
    });
});


// --- Calculator Logic ---
let beforeoperator = "";
let afteroperator = "";
let displaystring = "0";
let operation;
let lastEquation = "";

display.textContent = displaystring;

function addText(inputstring) {
    if (displaystring === "0" && inputstring !== ".") {
        displaystring = inputstring;
    } else {
        if (inputstring === '.' && displaystring.includes(".")) return;
        displaystring += inputstring;
    }
    display.textContent = displaystring;
}

function Operation() {
    if (!beforeoperator) return 0;

    // Parse operands logic
    // The original logic was relying on naive split. 
    // New logic: We know 'beforeoperator' (operand 1) and 'displaystring' has the full sequence.
    // Actually, typical calculator logic:
    // 1. Type number (Display: "10")
    // 2. Click Operator (Display doesn't change yet, but logic stores "10" as before)
    // 3. Type number (Display invalidates? Or appends?)
    // In this app, it seems to clear display on operator click? 
    // Let's check operator listener: it sets beforeoperator = display.textContent.
    // But it DOES NOT clear displaystring immediately? 
    // Wait, the operator listener calls `addText(opbtns[j].value)`
    // So if I type "50", click "+", display becomes "50+".
    // Then I type "10", display becomes "50+10".

    // So 'pre_operation' tries to split "50+10" by "+" to get "10".

    pre_operation(); // Finds 'afteroperator' value

    let before = parseFloat(beforeoperator);
    let after = parseFloat(afteroperator);
    if (isNaN(after)) after = 0;

    let result;

    switch (operation) {
        case "+": result = before + after; break;
        case "-": result = before - after; break;
        case "x": result = before * after; break;
        case "/": result = before / after; break;
        default: return after;
    }

    // Save to History
    saveHistory(`${before} ${operation} ${after}`, result);

    beforeoperator = "";
    operation = undefined;
    afteroperator = "";
    displaystring = "";
    return result;
}

// Listeners
for (let i = 0; i < numbtns.length; i++) {
    numbtns[i].addEventListener('click', () => addText(numbtns[i].value));
}
for (let j = 0; j < opbtns.length; j++) {
    opbtns[j].addEventListener('click', () => {
        if (displaystring === "") return;
        // If we already have an operator in the string, we might want to calculate first?
        // Simple calc: allow one operator.
        if (operation) {
            // Already has operator
            return;
        }
        beforeoperator = display.textContent; // "50"
        addText(opbtns[j].value); // "50+"
        operation = opbtns[j].value;
    });
};

debtn.addEventListener('click', () => {
    // If deleting an operator
    let lastChar = displaystring.toString().slice(-1);
    let operators = ['+', '-', 'x', '/'];
    if (operators.includes(lastChar)) {
        operation = undefined;
        beforeoperator = "";
    }

    displaystring = displaystring.toString().slice(0, -1);
    if (displaystring === "") displaystring = "0";
    display.textContent = displaystring;
});

acbtn.addEventListener('click', () => {
    operation = undefined;
    beforeoperator = "";
    afteroperator = "";
    displaystring = "0";
    display.textContent = "0";
});

equalsign.addEventListener('click', () => {
    if (operation !== undefined) {
        let finalResult = Operation();
        let formatted = Number.isInteger(finalResult) ? finalResult : finalResult.toFixed(2);
        // Reset display to result
        displaystring = formatted.toString();
        display.textContent = displaystring;
        // Clean up
        operation = undefined;
        beforeoperator = "";
    }
});

function pre_operation() {
    let operators = ['+', '-', 'x', '/'];
    for (let a = 0; a < 4; a++) {
        if (displaystring.includes(operators[a])) {
            let splitArr = displaystring.toString().split(operators[a]);
            // If negative number at start? e.g. "-5+3"
            // Split by "+": ["-5", "3"] -> after is "3".
            // If "5*-3" -> Split by "*": ["5", "-3"] -> after is "-3".
            if (splitArr.length > 1) {
                afteroperator = splitArr[splitArr.length - 1];
            }
            break;
        }
    }
}

// --- History Logic ---
function saveHistory(expr, res) {
    let item = { expression: expr, result: res };
    calculationHistory.unshift(item); // Add to top
    if (calculationHistory.length > 20) calculationHistory.pop(); // Limit to 20
    renderHistory();
}

function renderHistory() {
    historyList.innerHTML = "";
    if (calculationHistory.length === 0) {
        historyList.innerHTML = '<div class="empty-state">No history yet</div>';
        return;
    }

    calculationHistory.forEach(item => {
        let div = document.createElement("div");
        div.className = "history-item";
        div.innerHTML = `
            <div class="expression">${item.expression}</div>
            <div class="result">= ${Number.isInteger(item.result) ? item.result : item.result.toFixed(2)}</div>
        `;
        // Optional: Click to load result?
        div.addEventListener('click', () => {
            displaystring = item.result.toString();
            display.textContent = displaystring;
            // Switch to calc view
            navItems[0].click();
        });
        historyList.appendChild(div);
    });
}

clearHistoryBtn.addEventListener('click', () => {
    calculationHistory = [];
    renderHistory();
});


// --- Converter Logic ---
const convBtns = document.getElementsByClassName("conv-btn");
const convAc = document.getElementById("conv-ac");
const convEnter = document.getElementById("conv-enter");
const sourceAmountEl = document.getElementById("source-amount");
const targetAmountEl = document.getElementById("target-amount");
const swapBtn = document.getElementById("swap-currency");

// Select Elements
const sourceSelect = document.getElementById("source-currency");
const targetSelect = document.getElementById("target-currency");
const sourceSymbolEl = document.getElementById("source-symbol");
const targetSymbolEl = document.getElementById("target-symbol");

let convInput = "0";

// Comprehensive List of Currencies (Rates Base: INR 1.0)
// Source: x-rates.com (Real-time approx)
const currencies = {
    "INR": { rate: 1.0, symbol: "₹" },
    "USD": { rate: 0.011092, symbol: "$" },
    "EUR": { rate: 0.009436, symbol: "€" },
    "GBP": { rate: 0.008267, symbol: "£" },
    "AUD": { rate: 0.016628, symbol: "A$" },
    "CAD": { rate: 0.015278, symbol: "C$" },
    "SGD": { rate: 0.014323, symbol: "$" },
    "CHF": { rate: 0.008803, symbol: "Fr" },
    "MYR": { rate: 0.045591, symbol: "RM" },
    "JPY": { rate: 1.723179, symbol: "¥" },
    "CNY": { rate: 0.078292, symbol: "¥" },
    "ARS": { rate: 15.934299, symbol: "$" },
    "BHD": { rate: 0.004171, symbol: ".د.ب" },
    "BWP": { rate: 0.153636, symbol: "P" },
    "BRL": { rate: 0.060007, symbol: "R$" },
    "BND": { rate: 0.014323, symbol: "$" },
    "BGN": { rate: 0.018456, symbol: "лв" },
    "CLP": { rate: 10.147904, symbol: "$" },
    "COP": { rate: 42.349858, symbol: "$" },
    "CZK": { rate: 0.228391, symbol: "Kč" },
    "DKK": { rate: 0.070486, symbol: "kr" },
    "HKD": { rate: 0.086319, symbol: "$" },
    "HUF": { rate: 3.611251, symbol: "Ft" },
    "ISK": { rate: 1.398540, symbol: "kr" },
    "IDR": { rate: 184.757970, symbol: "Rp" },
    "IRR": { rate: 466.723911, symbol: "﷼" },
    "ILS": { rate: 0.035569, symbol: "₪" },
    "KZT": { rate: 5.773737, symbol: "₸" },
    "KRW": { rate: 16.325658, symbol: "₩" },
    "KWD": { rate: 0.003401, symbol: "د.ك" },
    "LYD": { rate: 0.060229, symbol: "ل.د" },
    "MUR": { rate: 0.511198, symbol: "₨" },
    "MXN": { rate: 0.200014, symbol: "$" },
    "NPR": { rate: 1.600750, symbol: "₨" },
    "NZD": { rate: 0.019066, symbol: "NZ$" },
    "NOK": { rate: 0.111544, symbol: "kr" },
    "OMR": { rate: 0.004268, symbol: "ر.ع." },
    "PKR": { rate: 3.111471, symbol: "₨" },
    "PHP": { rate: 0.653851, symbol: "₱" },
    "PLN": { rate: 0.039871, symbol: "zł" },
    "QAR": { rate: 0.040375, symbol: "ر.ق" },
    "RON": { rate: 0.048040, symbol: "lei" },
    "RUB": { rate: 0.890064, symbol: "₽" },
    "SAR": { rate: 0.041595, symbol: "ر.س" },
    "ZAR": { rate: 0.187058, symbol: "R" },
    "LKR": { rate: 3.421630, symbol: "Rs" },
    "SEK": { rate: 0.102491, symbol: "kr" },
    "TWD": { rate: 0.346051, symbol: "NT$" },
    "THB": { rate: 0.350821, symbol: "฿" },
    "TTD": { rate: 0.075226, symbol: "$" },
    "TRY": { rate: 0.472665, symbol: "₺" },
    "AED": { rate: 0.040736, symbol: "د.إ" }
};

function populateCurrencies() {
    const keys = Object.keys(currencies).sort();
    keys.forEach(key => {
        let optionS = document.createElement("option");
        optionS.value = key;
        optionS.textContent = key;
        sourceSelect.appendChild(optionS);

        let optionT = document.createElement("option");
        optionT.value = key;
        optionT.textContent = key;
        targetSelect.appendChild(optionT);
    });

    sourceSelect.value = "INR";
    targetSelect.value = "USD";
    updateSymbols();
}

function updateSymbols() {
    const sVal = sourceSelect.value;
    const tVal = targetSelect.value;

    sourceSymbolEl.textContent = currencies[sVal].symbol;
    targetSymbolEl.textContent = currencies[tVal].symbol;

    updateConversion();
}

sourceSelect.addEventListener('change', updateSymbols);
targetSelect.addEventListener('change', updateSymbols);

function updateConversion() {
    let inputVal = parseFloat(convInput);
    if (isNaN(inputVal)) inputVal = 0;

    // Logic: Input / SourceRate * TargetRate
    // (Rates are Base INR 1.0)
    const sRate = currencies[sourceSelect.value].rate;
    const tRate = currencies[targetSelect.value].rate;

    // If input is Source Currency. Convert to Base (INR).
    // If Source is INR (1.0). Value is Input.
    // If Source is USD (0.011). 1 USD = 90 INR.
    // So 1 unit source / sRate = INR value?
    // Ex: 1 USD. 1 / 0.011 = 90 INR. Correct.
    let baseINR = inputVal / sRate;

    // Convert Base INR to Target.
    // Target USD (0.011). 90 INR * 0.011 = 1 USD.
    let finalVal = baseINR * tRate;

    sourceAmountEl.textContent = inputVal.toLocaleString();
    targetAmountEl.textContent = finalVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function addConvText(val) {
    if (convInput === "0" && val !== ".") convInput = val;
    else {
        if (val === '.' && convInput.includes(".")) return;
        convInput += val;
    }
    updateConversion();
}

for (let k = 0; k < convBtns.length; k++) {
    convBtns[k].addEventListener('click', () => {
        let val = convBtns[k].value;
        if (val.trim() !== "") addConvText(val);
    });
}
convAc.addEventListener('click', () => {
    convInput = "0";
    updateConversion();
});
swapBtn.addEventListener('click', () => {
    let temp = sourceSelect.value;
    sourceSelect.value = targetSelect.value;
    targetSelect.value = temp;
    updateSymbols();
});

// Save Conversion to History
convEnter.addEventListener('click', () => {
    let inputVal = parseFloat(convInput);
    if (isNaN(inputVal) || inputVal === 0) return;

    const sRate = currencies[sourceSelect.value].rate;
    const tRate = currencies[targetSelect.value].rate;
    let usdVal = inputVal / sRate;
    let finalVal = usdVal * tRate;

    let expr = `${inputVal.toLocaleString()} ${sourceSelect.value} to ${targetSelect.value}`;
    let res = finalVal; // format in render

    saveHistory(expr, res);

    // Optional: Visual feedback?
    convEnter.innerHTML = '<i class="fas fa-check-double"></i>';
    setTimeout(() => convEnter.innerHTML = '<i class="fas fa-check"></i>', 1000);
});

populateCurrencies();
