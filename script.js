const output = document.getElementById('output');
const buttons = document.querySelectorAll('.btn');
const clear = document.getElementById('btn-clear');
const removeLast = document.getElementById('btn-delete');
const equal = document.getElementById('btn-equal');
const calculatorForm = document.getElementById('calculator-form');
const angleMode = document.getElementById('angle-mode');
let justCalculated = false;
let useDegrees = true;

function appendValue(value) {
    if (output.value === 'Error') {
        output.value = '';
    }
    if (justCalculated && /^[0-9.(π]/.test(value)) {
        output.value = '';
    }
    justCalculated = false;
    output.value += value;
}

function appendFunction(name) {
    if (justCalculated) {
        output.value = '';
    } else if (/[0-9)π]$/.test(output.value)) {
        output.value += '*';
    }
    output.value += `${name}(`;
    justCalculated = false;
}

function calculate(expression, degrees) {
    let position = 0;

    function parseExpression() {
        let value = parseTerm();
        while (expression[position] === '+' || expression[position] === '-') {
            const operator = expression[position++];
            const next = parseTerm();
            value = operator === '+' ? value + next : value - next;
        }
        return value;
    }

    function parseTerm() {
        let value = parseUnary();
        while (['*', '/', '%'].includes(expression[position])) {
            const operator = expression[position++];
            const next = parseUnary();
            if ((operator === '/' || operator === '%') && next === 0) {
                throw new Error('Cannot divide by zero');
            }
            value = operator === '*' ? value * next : operator === '/' ? value / next : value % next;
        }
        return value;
    }

    function parseUnary() {
        if (expression[position] === '+' || expression[position] === '-') {
            const sign = expression[position++];
            const value = parseUnary();
            return sign === '-' ? -value : value;
        }
        return parsePower();
    }

    function parsePower() {
        const base = parsePrimary();
        if (expression[position] === '^') {
            position++;
            return base ** parseUnary();
        }
        return base;
    }

    function parsePrimary() {
        if (expression[position] === '(') {
            position++;
            const value = parseExpression();
            if (expression[position] !== ')') {
                throw new Error('Missing closing parenthesis');
            }
            position++;
            return value;
        }

        if (expression[position] === 'π') {
            position++;
            return Math.PI;
        }

        const functionName = expression.slice(position).match(/^(sin|cos|tan|sqrt|ln)\(/);
        if (functionName) {
            position += functionName[1].length + 1;
            const argument = parseExpression();
            if (expression[position] !== ')') {
                throw new Error('Missing closing parenthesis');
            }
            position++;

            if (functionName[1] === 'sqrt') return Math.sqrt(argument);
            if (functionName[1] === 'ln') return Math.log(argument);
            const angle = degrees ? argument * Math.PI / 180 : argument;
            if (functionName[1] === 'sin') return Math.sin(angle);
            if (functionName[1] === 'cos') return Math.cos(angle);
            if (Math.abs(Math.cos(angle)) < 1e-12) {
                throw new Error('Tangent is undefined');
            }
            return Math.tan(angle);
        }

        const number = expression.slice(position).match(/^(?:\d+\.?\d*|\.\d+)/);
        if (!number) {
            throw new Error('Invalid expression');
        }
        position += number[0].length;
        return Number(number[0]);
    }

    const result = parseExpression();
    if (position !== expression.length || !Number.isFinite(result)) {
        throw new Error('Invalid expression');
    }
    const cleanResult = Math.abs(result) < 1e-12 ? 0 : result;
    return Number.parseFloat(cleanResult.toPrecision(12)).toString();
}

buttons.forEach(button => {
    button.addEventListener('click', () => {
        const { action, value } = button.dataset;
        if (action === 'function') {
            appendFunction(value);
        } else if (action === 'square' && output.value && output.value !== 'Error') {
            output.value += '^2';
            justCalculated = false;
        } else if (action === 'reciprocal' && output.value && output.value !== 'Error') {
            output.value = `1/(${output.value})`;
            justCalculated = false;
        } else if (action === 'constant') {
            if (justCalculated) output.value = '';
            else if (/[0-9)π]$/.test(output.value)) output.value += '*';
            output.value += value;
            justCalculated = false;
        } else if (value) {
            appendValue(value);
        }
    });
});

function showResult() {
    if (!output.value) return;
    try {
        output.value = calculate(output.value, useDegrees);
        justCalculated = true;
    } catch {
        output.value = 'Error';
        justCalculated = true;
    }
}

equal.addEventListener('click', showResult);
calculatorForm.addEventListener('submit', event => event.preventDefault());
angleMode.addEventListener('click', () => {
    useDegrees = !useDegrees;
    angleMode.textContent = useDegrees ? 'DEG' : 'RAD';
    angleMode.setAttribute('aria-label', `Angle mode: ${useDegrees ? 'degrees' : 'radians'}`);
    angleMode.setAttribute('aria-pressed', String(useDegrees));
});
clear.addEventListener('click', () => {
    output.value = '';
    justCalculated = false;
});
removeLast.addEventListener('click', () => {
    output.value = output.value === 'Error' ? '' : output.value.slice(0, -1);
    justCalculated = false;
});

document.addEventListener('keydown', event => {
    if (/^[0-9()+\-*/%.]$/.test(event.key)) {
        appendValue(event.key);
    } else if (event.key === '^') {
        appendValue('^');
    } else if (event.key.toLowerCase() === 'p') {
        appendValue('π');
    } else if (event.key === 'Enter' || event.key === '=') {
        event.preventDefault();
        showResult();
    } else if (event.key === 'Backspace') {
        output.value = output.value === 'Error' ? '' : output.value.slice(0, -1);
        justCalculated = false;
    } else if (event.key === 'Escape' || event.key.toLowerCase() === 'c') {
        output.value = '';
        justCalculated = false;
    }
});