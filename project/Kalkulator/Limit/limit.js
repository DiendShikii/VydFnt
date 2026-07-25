const STORAGE_KEY = 'vydfnt_kalkulator_limit_history';
const MAX_HISTORY = 12;

const FUNC_MAP = {
  asin: 'Math.asin', acos: 'Math.acos', atan: 'Math.atan',
  sin: 'Math.sin', cos: 'Math.cos', tan: 'Math.tan',
  sqrt: 'Math.sqrt', abs: 'Math.abs', exp: 'Math.exp'
};

function toJsExpression(raw){
  let s = raw.trim();
  if (!s) throw new Error('Fungsi tidak boleh kosong.');

  if (!/^[0-9a-zA-Z+\-*/^().,\s]+$/.test(s)){
    throw new Error('Ada karakter yang tidak dikenali pada f(x).');
  }

  s = s.replace(/\s+/g, '');
  s = s.replace(/\^/g, '**');

  s = s.replace(/(\d)([a-zA-Z(])/g, '$1*$2');
  s = s.replace(/(\))([\da-zA-Z(])/g, '$1*$2');

  s = s.replace(/\bln\b(?=\()/g, 'Math.log');
  s = s.replace(/\blog\b(?=\()/g, 'Math.log10');

  for (const name of Object.keys(FUNC_MAP)){
    const re = new RegExp('\\b' + name + '\\b(?=\\()', 'g');
    s = s.replace(re, FUNC_MAP[name]);
  }

  s = s.replace(/\bpi\b/g, 'Math.PI');
  s = s.replace(/\be\b/g, 'Math.E');

  return s;
}

function compileFunction(raw){
  const jsExpr = toJsExpression(raw);
  let fn;
  try{
    fn = new Function('x', 'return (' + jsExpr + ');');
  } catch(e){
    throw new Error('Format f(x) tidak valid.');
  }
  try{ fn(1.2345); } catch(e){ throw new Error('f(x) tidak dapat dievaluasi.'); }
  return fn;
}

function parseTargetString(raw){
  const s = raw.trim().toLowerCase().replace(/\s+/g, '');
  if (!s) throw new Error('Titik tujuan (x menuju ...) belum diisi.');
  if (['inf', '+inf', 'infinity', '+infinity', '∞', '+∞'].includes(s)) return Infinity;
  if (['-inf', '-infinity', '-∞'].includes(s)) return -Infinity;
  try{
    const jsExpr = toJsExpression(raw.trim());
    // eslint-disable-next-line no-new-func
    const val = new Function('return (' + jsExpr + ');')();
    if (typeof val !== 'number' || Number.isNaN(val)) throw 0;
    return val;
  } catch(e){
    throw new Error('Titik tujuan tidak valid. Gunakan angka, "inf", atau "-inf".');
  }
}

function safeEval(fn, x){
  try{
    const y = fn(x);
    if (typeof y !== 'number' || Number.isNaN(y)) return null;
    return y;
  } catch(e){ return null; }
}

function buildRows(fn, target, side){
  let xs;
  if (target === Infinity){
    xs = [10, 100, 1000, 10000, 100000, 1000000];
  } else if (target === -Infinity){
    xs = [-10, -100, -1000, -10000, -100000, -1000000];
  } else {
    const hs = [0.1, 0.01, 0.001, 0.0001, 0.00001, 0.000001];
    xs = hs.map(h => side === 'left' ? target - h : target + h);
  }
  return xs.map(x => ({ x, y: safeEval(fn, x) }));
}

function analyzeRows(rows){
  const finiteRows = rows.filter(r => r.y !== null && Number.isFinite(r.y));
  const infRows = rows.filter(r => r.y === Infinity || r.y === -Infinity);

  if (finiteRows.length >= 2){
    const last = finiteRows[finiteRows.length - 1].y;
    const prev = finiteRows[finiteRows.length - 2].y;
    const diff = Math.abs(last - prev);
    const tol = Math.max(1e-4, Math.abs(last) * 1e-4);

    if (Math.abs(last) > 1e7){
      return { type: 'infinite', value: last > 0 ? Infinity : -Infinity };
    }
    if (diff < tol){
      return { type: 'finite', value: last };
    }
    return { type: 'indeterminate', value: last };
  }
  if (infRows.length){
    return { type: 'infinite', value: infRows[infRows.length - 1].y };
  }
  return { type: 'undefined' };
}

function niceNumber(v){
  if (!Number.isFinite(v)) return v > 0 ? '∞' : '-∞';
  const rounded = Math.round(v * 1e6) / 1e6;

  if (Math.abs(rounded - Math.round(rounded)) < 1e-4){
    return String(Math.round(rounded));
  }
  if (Math.abs(rounded - Math.PI) < 1e-3) return rounded.toFixed(4) + ' (≈ π)';
  if (Math.abs(rounded + Math.PI) < 1e-3) return rounded.toFixed(4) + ' (≈ -π)';
  if (Math.abs(rounded - Math.E) < 1e-3) return rounded.toFixed(4) + ' (≈ e)';

  return String(Math.round(rounded * 10000) / 10000);
}

function formatY(y){
  if (y === null) return '—';
  if (y === Infinity) return '+∞';
  if (y === -Infinity) return '-∞';
  if (Math.abs(y) >= 100000 || (Math.abs(y) < 0.0001 && y !== 0)){
    return y.toExponential(3);
  }
  return (Math.round(y * 1e6) / 1e6).toString();
}

function formatX(x){
  if (Math.abs(x) >= 100000){
    return x.toExponential(2);
  }
  return (Math.round(x * 1e8) / 1e8).toString();
}

function computeLimit({ exprRaw, targetRaw, mode }){
  const fn = compileFunction(exprRaw);
  let target = parseTargetString(targetRaw);

  let effectiveMode = mode;
  if (target === Infinity) effectiveMode = 'right';
  if (target === -Infinity) effectiveMode = 'left';

  const out = { target, effectiveMode, fn };

  if (effectiveMode === 'both'){
    out.leftRows = buildRows(fn, target, 'left');
    out.rightRows = buildRows(fn, target, 'right');
    out.leftAnalysis = analyzeRows(out.leftRows);
    out.rightAnalysis = analyzeRows(out.rightRows);

    const L = out.leftAnalysis, R = out.rightAnalysis;
    if (L.type === 'finite' && R.type === 'finite'){
      const tol = Math.max(1e-3, Math.abs(L.value) * 1e-3);
      if (Math.abs(L.value - R.value) < tol){
        out.final = { type: 'finite', value: (L.value + R.value) / 2 };
      } else {
        out.final = { type: 'none', reason: 'beda' };
      }
    } else if (L.type === 'infinite' && R.type === 'infinite' && L.value === R.value){
      out.final = { type: 'infinite', value: L.value };
    } else if (L.type === 'undefined' && R.type === 'undefined'){
      out.final = { type: 'undefined' };
    } else {
      out.final = { type: 'none', reason: 'beda' };
    }
  } else {
    const side = effectiveMode; // 'left' | 'right'
    const rows = buildRows(fn, target, side);
    const analysis = analyzeRows(rows);
    if (side === 'left'){ out.leftRows = rows; out.leftAnalysis = analysis; }
    else { out.rightRows = rows; out.rightAnalysis = analysis; }

    if (analysis.type === 'finite') out.final = { type: 'finite', value: analysis.value };
    else if (analysis.type === 'infinite') out.final = { type: 'infinite', value: analysis.value };
    else out.final = { type: 'undefined' };
  }

  return out;
}

const els = {
  funcInput: document.getElementById('funcInput'),
  targetInput: document.getElementById('targetInput'),
  modeSwitch: document.getElementById('modeSwitch'),
  calcBtn: document.getElementById('calcBtn'),
  errorBox: document.getElementById('errorBox'),
  resultBox: document.getElementById('resultBox'),
  tableSection: document.getElementById('tableSection'),
  tablesWrap: document.getElementById('tablesWrap'),
  exampleChips: document.getElementById('exampleChips'),
  historyList: document.getElementById('historyList'),
  clearHistory: document.getElementById('clearHistory'),
};

let currentMode = 'both';

function targetToLabel(target){
  if (target === Infinity) return '∞';
  if (target === -Infinity) return '-∞';
  return niceNumber(target);
}

function renderTable(title, rows){
  const rowsHtml = rows.map(r => `<tr><td>${formatX(r.x)}</td><td>${formatY(r.y)}</td></tr>`).join('');
  return `
    <div class="approach-table">
      <div class="approach-table-title">${title}</div>
      <table>
        <thead><tr><th>x</th><th>f(x)</th></tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>`;
}

function renderResult(res, exprRaw){
  const targetLbl = targetToLabel(res.target);
  let statusClass = 'status-ok';
  let statusText = 'Limit Ada';
  let valueHtml = '';
  let noteHtml = '';

  if (res.final.type === 'finite'){
    statusClass = 'status-ok';
    statusText = 'Limit Ada';
    valueHtml = `lim<sub>x→${targetLbl}</sub> f(x) = ${niceNumber(res.final.value)}`;
    noteHtml = 'Nilai fungsi mendekati bilangan tetap saat x mendekati titik tujuan dari kedua arah (atau arah yang dipilih).';
  } else if (res.final.type === 'infinite'){
    statusClass = 'status-inf';
    statusText = 'Divergen (Tak Hingga)';
    const sign = res.final.value > 0 ? '+∞' : '-∞';
    valueHtml = `lim<sub>x→${targetLbl}</sub> f(x) = ${sign}`;
    noteHtml = 'Nilai fungsi membesar tanpa batas — limit tidak berupa bilangan real, tetapi berperilaku menuju tak hingga.';
  } else if (res.final.type === 'none'){
    statusClass = 'status-none';
    statusText = 'Limit Tidak Ada';
    valueHtml = `lim<sub>x→${targetLbl}</sub> f(x) tidak ada`;
    noteHtml = 'Nilai pendekatan dari kiri dan kanan berbeda, sehingga limit dua arah tidak ada.';
  } else {
    statusClass = 'status-none';
    statusText = 'Tidak Dapat Dihitung';
    valueHtml = `lim<sub>x→${targetLbl}</sub> f(x) = ?`;
    noteHtml = 'Fungsi tidak terdefinisi atau tidak stabil di sekitar titik ini. Periksa kembali penulisan f(x).';
  }

  let sidesHtml = '';
  const pills = [];
  if (res.leftAnalysis){
    const a = res.leftAnalysis;
    const txt = a.type === 'finite' ? niceNumber(a.value)
      : a.type === 'infinite' ? (a.value > 0 ? '+∞' : '-∞')
      : 'tidak terdefinisi';
    pills.push(`<span class="side-pill">kiri (x→${targetLbl}⁻): ${txt}</span>`);
  }
  if (res.rightAnalysis){
    const a = res.rightAnalysis;
    const txt = a.type === 'finite' ? niceNumber(a.value)
      : a.type === 'infinite' ? (a.value > 0 ? '+∞' : '-∞')
      : 'tidak terdefinisi';
    pills.push(`<span class="side-pill">kanan (x→${targetLbl}⁺): ${txt}</span>`);
  }
  if (pills.length) sidesHtml = `<div class="result-sides">${pills.join('')}</div>`;

  els.resultBox.className = 'result-box';
  els.resultBox.innerHTML = `
    <span class="result-status ${statusClass}">${statusText}</span>
    <div class="result-value">f(x) = ${escapeHtml(exprRaw)}<br>${valueHtml}</div>
    <div class="result-note">${noteHtml}</div>
    ${sidesHtml}
  `;

  // tabel
  let tablesHtml = '';
  if (res.leftRows) tablesHtml += renderTable(`Dari kiri (x → ${targetLbl}⁻)`, res.leftRows);
  if (res.rightRows) tablesHtml += renderTable(`Dari kanan (x → ${targetLbl}⁺)`, res.rightRows);
  els.tablesWrap.innerHTML = tablesHtml;
  els.tableSection.classList.remove('hidden');
}

function escapeHtml(s){
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function showError(msg){
  els.errorBox.textContent = msg;
  els.errorBox.classList.remove('hidden');
}
function hideError(){
  els.errorBox.classList.add('hidden');
  els.errorBox.textContent = '';
}

function loadHistory(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch(e){ return []; }
}
function saveHistory(list){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch(e){ /* ignore */ }
}
function pushHistory(entry){
  const list = loadHistory();
  list.unshift(entry);
  saveHistory(list.slice(0, MAX_HISTORY));
  renderHistory();
}
function resultSummary(res){
  if (res.final.type === 'finite') return { text: niceNumber(res.final.value), cls: '' };
  if (res.final.type === 'infinite') return { text: res.final.value > 0 ? '+∞' : '-∞', cls: 'h-inf' };
  if (res.final.type === 'none') return { text: 'tidak ada', cls: 'h-none' };
  return { text: '?', cls: 'h-none' };
}
function renderHistory(){
  const list = loadHistory();
  if (!list.length){
    els.historyList.innerHTML = '<p class="history-empty">Riwayat kosong.</p>';
    return;
  }
  els.historyList.innerHTML = list.map((item, i) => `
    <div class="history-item" data-idx="${i}">
      <span class="h-expr">f(x)=${escapeHtml(item.expr)}, x→${escapeHtml(item.targetLabel)}</span>
      <span class="h-result ${item.cls}">${escapeHtml(item.resultText)}</span>
    </div>
  `).join('');

  els.historyList.querySelectorAll('.history-item').forEach(el => {
    el.addEventListener('click', () => {
      const idx = Number(el.dataset.idx);
      const item = loadHistory()[idx];
      if (!item) return;
      els.funcInput.value = item.expr;
      els.targetInput.value = item.targetRaw;
      setMode(item.mode);
      runCalculation();
    });
  });
}

const EXAMPLES = [
  { label: '(x²-1)/(x-1), x→1',        expr: '(x^2-1)/(x-1)',            target: '1',    mode: 'both' },
  { label: 'sin(x)/x, x→0',            expr: 'sin(x)/x',                 target: '0',    mode: 'both' },
  { label: '(1-cos(x))/x², x→0',       expr: '(1-cos(x))/x^2',           target: '0',    mode: 'both' },
  { label: '(x²+3x-4)/(x-1), x→1',     expr: '(x^2+3x-4)/(x-1)',         target: '1',    mode: 'both' },
  { label: '1/x, x→0 (tak ada)',       expr: '1/x',                      target: '0',    mode: 'both' },
  { label: '(1+1/x)^x, x→∞ (→e)',      expr: '(1+1/x)^x',                target: 'inf',  mode: 'right' },
  { label: '(2x²+3x)/(5x²-1), x→∞',    expr: '(2x^2+3x)/(5x^2-1)',       target: 'inf',  mode: 'right' },
  { label: '(sqrt(x+4)-2)/x, x→0',     expr: '(sqrt(x+4)-2)/x',          target: '0',    mode: 'both' },
];

function renderExamples(){
  els.exampleChips.innerHTML = EXAMPLES.map((ex, i) =>
    `<button class="example-chip" data-idx="${i}" type="button">${escapeHtml(ex.label)}</button>`
  ).join('');
  els.exampleChips.querySelectorAll('.example-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const ex = EXAMPLES[Number(btn.dataset.idx)];
      els.funcInput.value = ex.expr;
      els.targetInput.value = ex.target;
      setMode(ex.mode);
      runCalculation();
    });
  });
}

function setMode(mode){
  currentMode = mode;
  els.modeSwitch.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
}
els.modeSwitch.addEventListener('click', (e) => {
  const btn = e.target.closest('.mode-btn');
  if (!btn || btn.disabled) return;
  setMode(btn.dataset.mode);
});

document.querySelectorAll('.chip-quick').forEach(btn => {
  btn.addEventListener('click', () => {
    els.targetInput.value = btn.dataset.target;
  });
});

function runCalculation(){
  hideError();
  const exprRaw = els.funcInput.value.trim();
  const targetRaw = els.targetInput.value.trim();

  if (!exprRaw){ showError('Isi dulu fungsi f(x).'); return; }
  if (!targetRaw){ showError('Isi dulu titik x menuju berapa.'); return; }

  try{
    const res = computeLimit({ exprRaw, targetRaw, mode: currentMode });
    renderResult(res, exprRaw);

    const summary = resultSummary(res);
    pushHistory({
      expr: exprRaw,
      targetRaw,
      targetLabel: targetToLabel(res.target),
      mode: currentMode,
      resultText: summary.text,
      cls: summary.cls,
    });
  } catch(err){
    showError(err.message || 'Terjadi kesalahan saat menghitung.');
  }
}

els.calcBtn.addEventListener('click', runCalculation);
els.funcInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') runCalculation(); });
els.targetInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') runCalculation(); });

els.clearHistory.addEventListener('click', () => {
  saveHistory([]);
  renderHistory();
});

renderExamples();
renderHistory();
