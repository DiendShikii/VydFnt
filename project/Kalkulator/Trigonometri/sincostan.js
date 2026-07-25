(function(){
  const state = {
    func: 'sin',
    mode: 'deg',
    inverse: false
  };

  const angleInput = document.getElementById('angleInput');
  const unitTag = document.getElementById('unitTag');
  const inputLabel = document.getElementById('inputLabel');
  const resultExpr = document.getElementById('resultExpr');
  const resultValue = document.getElementById('resultValue');
  const resultExtra = document.getElementById('resultExtra');
  const chipRow = document.getElementById('chipRow');
  const historyList = document.getElementById('historyList');
  const historyEmpty = document.getElementById('historyEmpty');
  const invBtn = document.getElementById('invBtn');

  const degChips = [0, 30, 45, 60, 90, 180, 270, 360];
  const radLabels = [
    {label:'0', val:0},
    {label:'π/6', val: Math.PI/6},
    {label:'π/4', val: Math.PI/4},
    {label:'π/3', val: Math.PI/3},
    {label:'π/2', val: Math.PI/2},
    {label:'π', val: Math.PI},
    {label:'3π/2', val: 3*Math.PI/2},
    {label:'2π', val: 2*Math.PI},
  ];

  let history = [];

  function renderChips(){
    chipRow.innerHTML = '';
    const items = state.mode === 'deg'
      ? degChips.map(d => ({label: d + '°', val: d}))
      : radLabels;
    items.forEach(item => {
      const btn = document.createElement('button');
      btn.className = 'chip clay clay-pressable';
      btn.textContent = item.label;
      btn.addEventListener('click', () => {
        angleInput.value = state.mode === 'deg' ? item.val : roundSmart(item.val);
        compute();
      });
      chipRow.appendChild(btn);
    });
  }

  function updateUnitUI(){
    unitTag.textContent = state.mode === 'deg' ? '°' : 'rad';
    inputLabel.textContent = state.inverse
      ? `Masukkan nilai ${state.func}(x)`
      : `Masukkan sudut`;
    renderChips();
  }

  function setFunc(f){
    state.func = f;
    document.querySelectorAll('.func-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.func === f);
    });
    updateUnitUI();
    compute();
  }

  function setMode(m){
    state.mode = m;
    document.querySelectorAll('.toggle-pill button').forEach(b => {
      b.classList.toggle('active', b.dataset.mode === m);
    });
    updateUnitUI();
    compute();
  }

  function toggleInverse(){
    state.inverse = !state.inverse;
    invBtn.classList.toggle('active', state.inverse);
    updateUnitUI();
    compute();
  }

  function roundSmart(n){
    return Math.round(n * 1e6) / 1e6;
  }

  function degToRad(d){ return d * Math.PI / 180; }
  function radToDeg(r){ return r * 180 / Math.PI; }

  function compute(){
    const raw = angleInput.value;
    if(raw === '' || raw === null || isNaN(Number(raw))){
      resultExpr.textContent = state.inverse
        ? `${invName(state.func)}(x) =`
        : `${state.func}(${state.mode === 'deg' ? '0°' : '0'}) =`;
      resultValue.textContent = '—';
      resultExtra.textContent = 'Masukkan angka untuk mulai menghitung';
      return null;
    }

    const x = Number(raw);

    if(!state.inverse){
      // Fungsi biasa: sin/cos/tan dari sudut
      const angleRad = state.mode === 'deg' ? degToRad(x) : x;
      let value;
      let undefinedNote = '';

      if(state.func === 'tan'){
        const cosVal = Math.cos(angleRad);
        if(Math.abs(cosVal) < 1e-10){
          resultExpr.textContent = `tan(${x}${state.mode === 'deg' ? '°' : ' rad'}) =`;
          resultValue.textContent = 'Tak terdefinisi';
          resultExtra.textContent = 'cos sudut ini bernilai 0';
          return {display: 'Tak terdefinisi', expr: `tan(${x}${state.mode === 'deg' ? '°' : ' rad'})`};
        }
        value = Math.tan(angleRad);
      } else if(state.func === 'sin'){
        value = Math.sin(angleRad);
      } else {
        value = Math.cos(angleRad);
      }

      const displayVal = roundSmart(value);
      const unitStr = state.mode === 'deg' ? '°' : ' rad';
      resultExpr.textContent = `${state.func}(${x}${unitStr}) =`;
      resultValue.textContent = displayVal;
      resultExtra.textContent = `≈ ${value.toFixed(6)}`;
      return {display: displayVal, expr: `${state.func}(${x}${unitStr})`};
    } else {
      // Inverse: dari nilai rasio cari sudut
      let angleRadResult;
      let domainError = false;

      if(state.func === 'tan'){
        angleRadResult = Math.atan(x);
      } else {
        if(x < -1 || x > 1){
          domainError = true;
        } else {
          angleRadResult = state.func === 'sin' ? Math.asin(x) : Math.acos(x);
        }
      }

      const invLabel = invName(state.func);

      if(domainError){
        resultExpr.textContent = `${invLabel}(${x}) =`;
        resultValue.textContent = 'Di luar domain';
        resultExtra.textContent = 'Nilai harus antara -1 dan 1';
        return {display: 'Di luar domain', expr: `${invLabel}(${x})`};
      }

      const displayAngle = state.mode === 'deg'
        ? roundSmart(radToDeg(angleRadResult))
        : roundSmart(angleRadResult);
      const unitStr = state.mode === 'deg' ? '°' : ' rad';

      resultExpr.textContent = `${invLabel}(${x}) =`;
      resultValue.textContent = displayAngle + unitStr;
      resultExtra.textContent = state.mode === 'deg'
        ? `≈ ${roundSmart(angleRadResult)} rad`
        : `≈ ${roundSmart(radToDeg(angleRadResult))}°`;
      return {display: displayAngle + unitStr, expr: `${invLabel}(${x})`};
    }
  }

  function invName(f){
    return f === 'sin' ? 'arcsin' : f === 'cos' ? 'arccos' : 'arctan';
  }

  function addHistory(entry){
    if(!entry) return;
    history.unshift(entry);
    if(history.length > 8) history.pop();
    renderHistory();
  }

  function renderHistory(){
    historyList.innerHTML = '';
    if(history.length === 0){
      historyList.innerHTML = '<li class="history-empty" style="list-style:none;">Belum ada riwayat perhitungan.</li>';
      return;
    }
    history.forEach(h => {
      const li = document.createElement('li');
      li.className = 'clay';
      li.innerHTML = `<span>${h.expr}</span><span>${h.display}</span>`;
      historyList.appendChild(li);
    });
  }

  document.querySelectorAll('.func-btn').forEach(btn => {
    btn.addEventListener('click', () => setFunc(btn.dataset.func));
  });
  document.querySelectorAll('.toggle-pill button').forEach(btn => {
    btn.addEventListener('click', () => setMode(btn.dataset.mode));
  });
  invBtn.addEventListener('click', toggleInverse);

  document.getElementById('calcBtn').addEventListener('click', () => {
    const result = compute();
    addHistory(result);
  });

  document.getElementById('resetBtn').addEventListener('click', () => {
    angleInput.value = '';
    compute();
  });

  document.getElementById('clearHistory').addEventListener('click', () => {
    history = [];
    renderHistory();
  });

  angleInput.addEventListener('keydown', (e) => {
    if(e.key === 'Enter'){
      const result = compute();
      addHistory(result);
    }
  });

  angleInput.addEventListener('input', compute);

  // init
  updateUnitUI();
  compute();
})();
