const expression = document.querySelector('#expression');
const result = document.querySelector('#result');
const historyList = document.querySelector('#history-list');
let input = '';
let lastAnswer = 0;
let history = [];

const pretty = value => Number.isFinite(value) ? Number(value.toPrecision(12)).toLocaleString('ko-KR', { maximumFractionDigits: 10 }) : '오류';

function tokenize(text) {
  return text.replaceAll('×', '*').replaceAll('÷', '/').replaceAll('−', '-').match(/\d*\.?\d+|[()+\-*/]/g) || [];
}

function evaluate(text) {
  const normalized = text.replaceAll('×', '*').replaceAll('÷', '/').replaceAll('−', '-');
  const tokens = tokenize(text);
  if (!tokens.length || tokens.join('') !== normalized) throw Error('invalid');
  let index = 0;
  const expressionValue = () => { let value = term(); while (tokens[index] === '+' || tokens[index] === '-') { const operator = tokens[index++]; value = operator === '+' ? value + term() : value - term(); } return value; };
  const term = () => { let value = factor(); while (tokens[index] === '*' || tokens[index] === '/') { const operator = tokens[index++]; const right = factor(); if (operator === '/' && right === 0) throw Error('zero'); value = operator === '*' ? value * right : value / right; } return value; };
  const factor = () => { if (tokens[index] === '-') { index++; return -factor(); } if (tokens[index] === '(') { index++; const value = expressionValue(); if (tokens[index++] !== ')') throw Error('paren'); return value; } const value = Number(tokens[index++]); if (!Number.isFinite(value)) throw Error('number'); return value; };
  const value = expressionValue();
  if (index !== tokens.length || !Number.isFinite(value)) throw Error('invalid');
  return value;
}

function render() { expression.textContent = input; try { result.textContent = input ? pretty(evaluate(input)) : '0'; } catch { result.textContent = input ? '…' : '0'; } }
function add(value) { if (value === '.' && /(?:^|[+−×÷(])\d*\.\d*$/.test(input)) return; input += value; render(); }
function addHistory(formula, value) { history.unshift({ formula, value }); history = history.slice(0, 6); historyList.innerHTML = history.map(item => `<li data-formula="${item.formula}"><span>${item.formula}</span><span>= ${pretty(item.value)}</span></li>`).join(''); }
function calculate() { try { const value = evaluate(input); addHistory(input, value); lastAnswer = value; input = String(Number(value.toPrecision(12))); render(); } catch { result.textContent = '식 확인'; } }
function currentValue() { try { return input ? evaluate(input) : lastAnswer; } catch { return lastAnswer; } }
function action(name) { if (name === 'clear') input = ''; if (name === 'backspace') input = input.slice(0, -1); if (name === 'equals') return calculate(); if (name === 'percent') input = String(currentValue() / 100); if (name === 'vat') input = String(currentValue() * 1.1); if (name === 'negate') input = String(-currentValue()); render(); }

document.querySelector('#keys').addEventListener('click', event => { const button = event.target.closest('button'); if (!button) return; button.dataset.action ? action(button.dataset.action) : add(button.dataset.value); });
document.querySelector('.quick').addEventListener('click', event => { const button = event.target.closest('button'); if (button) action(button.dataset.action); });
document.querySelector('#clear-history').addEventListener('click', () => { history = []; historyList.innerHTML = '<li class="empty">아직 계산한 식이 없어요.</li>'; });
historyList.addEventListener('click', event => { const row = event.target.closest('[data-formula]'); if (row) { input = row.dataset.formula; render(); } });
window.addEventListener('keydown', event => { const key = { '*':'×', '/':'÷', '+':'+', '-':'−', '(':'(', ')':')' }; if (event.key === 'Enter' || event.key === '=') { event.preventDefault(); calculate(); } else if (event.key === 'Escape') action('clear'); else if (event.key === 'Backspace') action('backspace'); else if (/^[0-9.]$/.test(event.key)) add(event.key); else if (key[event.key]) add(key[event.key]); });
