let currentInput  = '0';
let prevInput     = '';
let operator      = null;
let freshResult   = false;
let pendingEqual  = null;
let userPlan      = null;
let history       = [];

(function init() {
  const saved = localStorage.getItem('neoncalc_plan');
  if (saved === 'plus' || saved === 'pro') {
    userPlan = saved;
    applyPlanUI();
  }
  const savedHistory = localStorage.getItem('neoncalc_history');
  if (savedHistory) {
    try { history = JSON.parse(savedHistory); renderHistory(); } catch(e) {}
  }
})();

function updateDisplay(val) {
  const el = document.getElementById('calcInput');
  const formatted = formatNum(val);
  el.textContent = formatted;
  el.classList.toggle('small', String(formatted).length > 10);
}
function updateExpression(expr) {
  document.getElementById('calcExpression').textContent = expr;
}
function formatNum(val) {
  const n = parseFloat(val);
  if (isNaN(n)) return val;
  // Avoid floating point artifacts
  const s = parseFloat(n.toPrecision(12)).toString();
  return s;
}

function pressNum(d) {
  if (freshResult) { currentInput = d; freshResult = false; }
  else currentInput = (currentInput === '0') ? d : currentInput + d;
  updateDisplay(currentInput);
  updateExpression('');
}

function pressDot() {
  if (freshResult) { currentInput = '0.'; freshResult = false; }
  else if (!currentInput.includes('.')) currentInput += '.';
  updateDisplay(currentInput);
}

function setOp(op) {
  document.querySelectorAll('.btn-op').forEach(b => b.classList.remove('active-op'));
  event.currentTarget.classList.add('active-op');

  if (operator && !freshResult) {
    const result = calculate(parseFloat(prevInput), parseFloat(currentInput), operator);
    prevInput     = String(result);
    updateDisplay(result);
  } else {
    prevInput = currentInput;
  }
  operator    = op;
  freshResult = true;
  updateExpression(formatNum(prevInput) + ' ' + opSymbol(op));
}

function pressEquals() {
  if (!operator || prevInput === '') return;

  const a    = parseFloat(prevInput);
  const b    = parseFloat(currentInput);
  const expr = `${formatNum(a)} ${opSymbol(operator)} ${formatNum(b)}`;
  const result = calculate(a, b, operator);

  document.querySelectorAll('.btn-op').forEach(b => b.classList.remove('active-op'));

  if (userPlan === null) {
    pendingEqual = { expression: expr, result };
    openModal();
    return;
  }

  showResult(expr, result);
}

function showResult(expr, result) {
  updateExpression(expr + ' =');
  updateDisplay(result);
  currentInput = String(result);
  operator     = null;
  prevInput    = '';
  freshResult  = true;
  pendingEqual = null;

  if (userPlan === 'pro') {
    addHistory(expr, result);
  }
}

function calculate(a, b, op) {
  switch(op) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    case '/': return b !== 0 ? a / b : 'Error';
  }
  return b;
}

function clearAll() {
  currentInput = '0';
  prevInput    = '';
  operator     = null;
  freshResult  = false;
  updateDisplay('0');
  updateExpression('');
  document.querySelectorAll('.btn-op').forEach(b => b.classList.remove('active-op'));
}

function toggleSign() {
  currentInput = String(parseFloat(currentInput) * -1);
  updateDisplay(currentInput);
}

function percentage() {
  currentInput = String(parseFloat(currentInput) / 100);
  updateDisplay(currentInput);
}

function opSymbol(op) {
  return { '+':'+', '-':'−', '*':'×', '/':'÷' }[op] || op;
}

function addHistory(expr, result) {
  history.unshift({ expr, result, time: Date.now() });
  localStorage.setItem('neoncalc_history', JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  const list = document.getElementById('historyList');
  if (!list) return;
  if (history.length === 0) {
    list.innerHTML = '<div class="history-empty">Belum ada riwayat perhitungan.</div>';
    return;
  }
  list.innerHTML = history.map(h => `
    <div class="history-item">
      <div class="history-expr">${h.expr}</div>
      <div class="history-result">= ${formatNum(h.result)}</div>
    </div>
  `).join('');
}

function clearHistory() {
  history = [];
  localStorage.removeItem('neoncalc_history');
  renderHistory();
}

function openModal() {
  // If user already has plus, hide Plus card and show only Pro
  const plusCard = document.getElementById('planPlus');
  const proCard  = document.getElementById('planPro');
  if (userPlan === 'plus') {
    plusCard.style.display = 'none';
    proCard.style.display  = '';
  } else {
    plusCard.style.display = '';
    proCard.style.display  = '';
  }
  document.getElementById('paymentModal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('paymentModal').classList.add('hidden');
}

document.getElementById('paymentModal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

function buyPlan(plan) {
  closeModal();

  if (plan === 'pro' || (plan === 'plus' && userPlan === null)) {
    userPlan = plan;
    localStorage.setItem('neoncalc_plan', plan);
    applyPlanUI();
    showSuccessNotif(plan);

    setTimeout(() => {
      if (pendingEqual) showResult(pendingEqual.expression, pendingEqual.result);
    }, 2800);
  }
}

function applyPlanUI() {
  const badge = document.getElementById('planBadgeHeader');
  badge.classList.remove('hidden', 'badge-plus', 'badge-pro');
  badge.classList.add(userPlan === 'pro' ? 'badge-pro' : 'badge-plus');
  badge.textContent = userPlan === 'pro' ? '⚡ PRO' : '✦ PLUS';

  if (userPlan === 'pro') {
    document.getElementById('historyPanel').classList.remove('hidden');
    document.getElementById('upgradeBubble').classList.add('hidden');
    renderHistory();
  }

  if (userPlan === 'plus') {
    document.getElementById('upgradeBubble').classList.remove('hidden');
  }
}

function showSuccessNotif(plan) {
  const overlay   = document.getElementById('successNotif');
  const planName  = document.getElementById('successPlanName');
  const upHint    = document.getElementById('upgradeToProHint');

  planName.textContent = plan === 'pro'
    ? 'Anda kini menggunakan NeonCalc PRO 🚀'
    : 'Anda kini menggunakan NeonCalc PLUS ✦';

  upHint.classList.toggle('hidden', plan === 'pro');

  overlay.classList.remove('hidden');

  const circle = overlay.querySelector('.checkmark-circle');
  const check  = overlay.querySelector('.checkmark-check');
  void circle.offsetWidth;
  void check.offsetWidth;
  circle.style.animation = 'none';
  check.style.animation  = 'none';
  requestAnimationFrame(() => {
    circle.style.animation = '';
    check.style.animation  = '';
  });

  setTimeout(() => overlay.classList.add('hidden'), 3000);
}

document.getElementById('successNotif').addEventListener('click', function(e) {
  if (e.target === this || e.target === this.querySelector('.success-box')) {
    this.classList.add('hidden');
    if (pendingEqual) showResult(pendingEqual.expression, pendingEqual.result);
  }
});

function showUpgradeToPro() {
  document.getElementById('successNotif').classList.add('hidden');
  openModal();
}

function upgradeFromSuccess() {
  document.getElementById('successNotif').classList.add('hidden');
  // Small delay then open modal showing only Pro
  setTimeout(openModal, 200);
}

document.addEventListener('keydown', e => {
  if ('0123456789'.includes(e.key)) pressNum(e.key);
  else if (e.key === '.') pressDot();
  else if (e.key === '+') setOpKey('+');
  else if (e.key === '-') setOpKey('-');
  else if (e.key === '*') setOpKey('*');
  else if (e.key === '/') { e.preventDefault(); setOpKey('/'); }
  else if (e.key === 'Enter' || e.key === '=') pressEquals();
  else if (e.key === 'Escape') clearAll();
  else if (e.key === 'Backspace') backspace();
});

function setOpKey(op) {
  const map = { '+':'+', '-':'−', '*':'×', '/':'÷' };
  document.querySelectorAll('.btn-op').forEach(b => {
    if (b.textContent === map[op]) b.click();
  });
}

function backspace() {
  if (freshResult) return;
  if (currentInput.length <= 1 || currentInput === '-0') {
    currentInput = '0';
  } else {
    currentInput = currentInput.slice(0, -1);
  }
  updateDisplay(currentInput);
}
