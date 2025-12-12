class Calculator {
    constructor(previousOperandTextElement, currentOperandTextElement) {
        this.previousOperandTextElement = previousOperandTextElement;
        this.currentOperandTextElement = currentOperandTextElement;
        this.history = JSON.parse(localStorage.getItem('calc_history')) || []; // Load from local storage
        this.clear();
        this.updateHistoryUI(); // Load history on start
    }

    clear() {
        this.currentOperand = '0';
        this.previousOperand = '';
        this.operation = undefined;
    }

    delete() {
        if (this.currentOperand === '0') return;
        this.currentOperand = this.currentOperand.toString().slice(0, -1);
        if (this.currentOperand === '') this.currentOperand = '0';
    }

    appendNumber(number) {
        if (number === '.' && this.currentOperand.includes('.')) return;
        if (this.currentOperand === '0' && number !== '.') {
            this.currentOperand = number.toString();
        } else {
            this.currentOperand = this.currentOperand.toString() + number.toString();
        }
    }

    chooseOperation(operation) {
        if (this.currentOperand === '') return;
        if (this.previousOperand !== '') {
            this.compute();
        }
        this.operation = operation;
        this.previousOperand = this.currentOperand;
        this.currentOperand = '';
    }

    compute() {
        let computation;
        const prev = parseFloat(this.previousOperand);
        const current = parseFloat(this.currentOperand);

        if (isNaN(prev) || isNaN(current)) return;

        switch (this.operation) {
            case '+': computation = prev + current; break;
            case '-': computation = prev - current; break;
            case '*': computation = prev * current; break;
            case '÷':
                if (current === 0) {
                    computation = "Nice try 🤨";
                    this.currentOperand = computation;
                    this.operation = undefined;
                    this.previousOperand = '';
                    return;
                } else {
                    computation = prev / current;
                }
                break;
            default: return;
        }

        // --- HISTORY LOGIC START ---
        // Round long decimals to avoid messy history
        let result = Math.round(computation * 10000) / 10000;

        this.addToHistory(prev, this.operation, current, result);
        // --- HISTORY LOGIC END ---

        this.currentOperand = result;
        this.operation = undefined;
        this.previousOperand = '';
    }

    addToHistory(prev, op, current, result) {
        const entry = {
            expression: `${prev} ${op} ${current}`,
            result: result,
            date: new Date().toLocaleString('en-US', {
                month: 'short', day: 'numeric',
                hour: 'numeric', minute: 'numeric', hour12: true
            })
        };

        // Add to beginning of array
        this.history.unshift(entry);

        // Limit to last 20 items to save space
        if (this.history.length > 20) this.history.pop();

        // Save to browser memory
        localStorage.setItem('calc_history', JSON.stringify(this.history));

        this.updateHistoryUI();
    }

    updateHistoryUI() {
        const historyList = document.getElementById('history-list');
        historyList.innerHTML = ''; // Clear current list

        if (this.history.length === 0) {
            historyList.innerHTML = '<p class="empty-msg">No history yet.</p>';
            return;
        }

        this.history.forEach(item => {
            const div = document.createElement('div');
            div.classList.add('history-item');
            div.innerHTML = `
                <div class="history-expression">${item.expression} =</div>
                <div class="history-result">${item.result}</div>
                <div class="history-time">${item.date}</div>
            `;
            historyList.appendChild(div);
        });
    }

    clearHistory() {
        this.history = [];
        localStorage.removeItem('calc_history');
        this.updateHistoryUI();
    }

    updateDisplay() {
        this.currentOperandTextElement.innerText = this.currentOperand;
        if (this.operation != null) {
            this.previousOperandTextElement.innerText =
                `${this.previousOperand} ${this.operation}`;
        } else {
            this.previousOperandTextElement.innerText = '';
        }
    }
}

// Select Elements
const previousOperandTextElement = document.getElementById('previous-operand');
const currentOperandTextElement = document.getElementById('current-operand');
const calculator = new Calculator(previousOperandTextElement, currentOperandTextElement);

// UI Event Listeners
document.querySelectorAll('[data-number]').forEach(button => {
    button.addEventListener('click', () => {
        calculator.appendNumber(button.innerText);
        calculator.updateDisplay();
    });
});

document.querySelectorAll('[data-operation]').forEach(button => {
    button.addEventListener('click', () => {
        calculator.chooseOperation(button.innerText);
        calculator.updateDisplay();
    });
});

document.querySelector('[data-action="compute"]').addEventListener('click', () => {
    calculator.compute();
    calculator.updateDisplay();
});

document.querySelector('[data-action="clear"]').addEventListener('click', () => {
    calculator.clear();
    calculator.updateDisplay();
});

document.querySelector('[data-action="delete"]').addEventListener('click', () => {
    calculator.delete();
    calculator.updateDisplay();
});

// History Toggle Logic
const wrapper = document.querySelector('.wrapper');
const historyBtn = document.getElementById('history-btn');
const clearHistoryBtn = document.getElementById('clear-history');

historyBtn.addEventListener('click', () => {
    wrapper.classList.toggle('history-open');
});

clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Clear all calculation history?')) {
        calculator.clearHistory();
    }
});

// Keyboard Support
document.addEventListener('keydown', (e) => {
    if ((e.key >= 0 && e.key <= 9) || e.key === '.') {
        calculator.appendNumber(e.key);
        calculator.updateDisplay();
    }
    if (e.key === 'Backspace') {
        calculator.delete();
        calculator.updateDisplay();
    }
    if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        calculator.compute();
        calculator.updateDisplay();
    }
    if (e.key === 'Escape') {
        calculator.clear();
        calculator.updateDisplay();
    }
    if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {
        let op = e.key;
        if (op === '/') op = '÷';
        calculator.chooseOperation(op);
        calculator.updateDisplay();
    }
});