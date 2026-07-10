let mode = 'barisan';
let type = 'aritmetika';

function setMode(m){
    mode = m;
    document.getElementById('tab-barisan').classList.toggle('active', m==='barisan');
    document.getElementById('tab-deret').classList.toggle('active', m==='deret');
    updatePanel();
    hideResult();
}

function setType(t){
    type = t;
    const artBtn = document.getElementById('tab-aritmetika');
    const geoBtn = document.getElementById('tab-geometri');
    artBtn.classList.toggle('active', t==='aritmetika');
    geoBtn.classList.toggle('active', t==='geometri');
    geoBtn.classList.toggle('pink', t==='geometri');
    updatePanel();
    hideResult();
}

function updatePanel(){
    const title = document.getElementById('panel-title');
    const modeLabel = mode === 'barisan' ? 'Barisan' : 'Deret';
    const typeLabel = type === 'aritmetika' ? 'Aritmetika' : 'Geometri';
    title.textContent = modeLabel + ' ' + typeLabel;

    const bLabel = document.querySelector('#field-bede label');
    bLabel.innerHTML = type === 'aritmetika'
    ? 'b <span class="hint">— beda</span>'
    : 'r <span class="hint">— rasio</span>';
    document.getElementById('inp-b').placeholder = type === 'aritmetika' ? 'contoh: 4' : 'contoh: 2';
}

function hideResult(){
    document.getElementById('result-panel').classList.remove('show');
    document.getElementById('error-msg').classList.remove('show');
}

function showError(msg){
    const el = document.getElementById('error-msg');
    el.textContent = msg;
    el.classList.add('show');
    document.getElementById('result-panel').classList.remove('show');
}

function fmt(num){
    if (!isFinite(num)) return '∞';
    if (Number.isInteger(num)) return num.toLocaleString('id-ID');
    return Number(num.toFixed(6)).toLocaleString('id-ID', {maximumFractionDigits:6});
}

function hitung(){
    const a = parseFloat(document.getElementById('inp-a').value);
    const b = parseFloat(document.getElementById('inp-b').value);
    const n = parseInt(document.getElementById('inp-n').value);

    if (isNaN(a) || isNaN(b) || isNaN(n)){
        showError('Isi semua kolom terlebih dahulu dengan angka yang valid.');
        return;
    }
    if (n < 1){
        showError('n harus bernilai 1 atau lebih.');
        return;
    }
    if (type === 'geometri' && b === 0){
        showError('Rasio (r) tidak boleh 0.');
        return;
    }

    document.getElementById('error-msg').classList.remove('show');

    if (mode === 'barisan' && type === 'aritmetika') barisanAritmetika(a,b,n);
    else if (mode === 'barisan' && type === 'geometri') barisanGeometri(a,b,n);
    else if (mode === 'deret' && type === 'aritmetika') deretAritmetika(a,b,n);
    else deretGeometri(a,b,n);
}

function reveal(){
    document.getElementById('result-panel').classList.add('show');
}

function setValueColor(pink){
    const rv = document.getElementById('result-value');
    rv.classList.toggle('pink', pink);
}

function barisanAritmetika(a,b,n){
    const Un = a + (n-1)*b;
    document.getElementById('result-label').textContent = 'Suku ke-' + n + ' (Un)';
    document.getElementById('result-value').textContent = fmt(Un);
    setValueColor(false);

    document.getElementById('formula-strip').innerHTML = `
    <span class="step">Rumus umum: <b>Un = a + (n − 1)b</b></span>
    <span class="step">Substitusi: Un = ${fmt(a)} + (${n} − 1) × ${fmt(b)}</span>
    <span class="step">Un = ${fmt(a)} + ${n-1} × ${fmt(b)}</span>
    <span class="step final">Un = ${fmt(Un)}</span>
    `;

    document.getElementById('extra-grid').innerHTML = `
    <div class="extra-item"><div class="k">Suku pertama (a)</div><div class="v">${fmt(a)}</div></div>
    <div class="extra-item"><div class="k">Beda (b)</div><div class="v">${fmt(b)}</div></div>
    `;
    reveal();
}

function barisanGeometri(a,r,n){
    const Un = a * Math.pow(r, n-1);
    document.getElementById('result-label').textContent = 'Suku ke-' + n + ' (Un)';
    document.getElementById('result-value').textContent = fmt(Un);
    setValueColor(true);

    document.getElementById('formula-strip').innerHTML = `
    <span class="step">Rumus umum: <b>Un = a × r<sup>n − 1</sup></b></span>
    <span class="step">Substitusi: Un = ${fmt(a)} × ${fmt(r)}<sup>${n-1}</sup></span>
    <span class="step final pink">Un = ${fmt(Un)}</span>
    `;

    document.getElementById('extra-grid').innerHTML = `
    <div class="extra-item"><div class="k">Suku pertama (a)</div><div class="v">${fmt(a)}</div></div>
    <div class="extra-item"><div class="k">Rasio (r)</div><div class="v">${fmt(r)}</div></div>
    `;
    reveal();
}

function deretAritmetika(a,b,n){
    const Un = a + (n-1)*b;
    const Sn = n/2 * (2*a + (n-1)*b);
    document.getElementById('result-label').textContent = 'Jumlah ' + n + ' suku pertama (Sn)';
    document.getElementById('result-value').textContent = fmt(Sn);
    setValueColor(false);

    document.getElementById('formula-strip').innerHTML = `
    <span class="step">Rumus umum: <b>Sn = n/2 × (2a + (n − 1)b)</b></span>
    <span class="step">Substitusi: Sn = ${n}/2 × (2×${fmt(a)} + (${n} − 1) × ${fmt(b)})</span>
    <span class="step">Sn = ${n/2} × (${fmt(2*a)} + ${fmt((n-1)*b)})</span>
    <span class="step final">Sn = ${fmt(Sn)}</span>
    `;

    document.getElementById('extra-grid').innerHTML = `
    <div class="extra-item"><div class="k">Suku ke-${n} (Un)</div><div class="v">${fmt(Un)}</div></div>
    <div class="extra-item"><div class="k">Beda (b)</div><div class="v">${fmt(b)}</div></div>
    `;
    reveal();
}

function deretGeometri(a,r,n){
    const Un = a * Math.pow(r, n-1);
    let Sn;
    if (r === 1){
        Sn = a * n;
    } else if (Math.abs(r) < 1){
        Sn = a * (1 - Math.pow(r, n)) / (1 - r);
    } else {
        Sn = a * (Math.pow(r, n) - 1) / (r - 1);
    }

    document.getElementById('result-label').textContent = 'Jumlah ' + n + ' suku pertama (Sn)';
    document.getElementById('result-value').textContent = fmt(Sn);
    setValueColor(true);

    const rumusText = Math.abs(r) < 1
    ? 'Sn = a(1 − r<sup>n</sup>) / (1 − r)'
    : 'Sn = a(r<sup>n</sup> − 1) / (r − 1)';

    document.getElementById('formula-strip').innerHTML = `
    <span class="step">Rumus umum: <b>${rumusText}</b></span>
    <span class="step">Substitusi: a = ${fmt(a)}, r = ${fmt(r)}, n = ${n}</span>
    <span class="step final pink">Sn = ${fmt(Sn)}</span>
    `;

    document.getElementById('extra-grid').innerHTML = `
    <div class="extra-item"><div class="k">Suku ke-${n} (Un)</div><div class="v">${fmt(Un)}</div></div>
    <div class="extra-item"><div class="k">Rasio (r)</div><div class="v">${fmt(r)}</div></div>
    `;
    reveal();
}


function toggleTools(){
    const body = document.getElementById('tools-body');
    const btn = document.getElementById('tools-toggle');
    body.classList.toggle('open');
    btn.classList.toggle('open');
}

function cariBedaAritmetika(){
    const p = parseInt(document.getElementById('t1-p').value);
    const up = parseFloat(document.getElementById('t1-up').value);
    const q = parseInt(document.getElementById('t1-q').value);
    const uq = parseFloat(document.getElementById('t1-uq').value);
    const out = document.getElementById('t1-result');

    if (isNaN(p) || isNaN(up) || isNaN(q) || isNaN(uq) || p === q){
        out.textContent = 'Isi semua kolom dengan angka valid, dan pastikan p ≠ q.';
        out.classList.add('show');
        return;
    }

    const b = (uq - up) / (q - p);
    const a = up - (p - 1) * b;

    out.innerHTML = `b = (Uq − Up) / (q − p) = ${fmt(b)} &nbsp;|&nbsp; a = Up − (p − 1)b = ${fmt(a)}`;
    out.classList.add('show');
}

function cariRasioGeometri(){
    const p = parseInt(document.getElementById('t2-p').value);
    const up = parseFloat(document.getElementById('t2-up').value);
    const q = parseInt(document.getElementById('t2-q').value);
    const uq = parseFloat(document.getElementById('t2-uq').value);
    const out = document.getElementById('t2-result');

    if (isNaN(p) || isNaN(up) || isNaN(q) || isNaN(uq) || p === q || up === 0){
        out.textContent = 'Isi semua kolom dengan angka valid, pastikan p ≠ q dan Up ≠ 0.';
        out.classList.add('show');
        return;
    }

    const ratio = uq / up;
    const r = Math.sign(ratio) * Math.pow(Math.abs(ratio), 1/(q-p));
    const a = up / Math.pow(r, p-1);

    out.innerHTML = `r = (Uq / Up)<sup>1/(q−p)</sup> = ${fmt(r)} &nbsp;|&nbsp; a = Up / r<sup>p−1</sup> = ${fmt(a)}`;
    out.classList.add('show');
}

function hitungTakHingga(){
    const a = parseFloat(document.getElementById('t3-a').value);
    const r = parseFloat(document.getElementById('t3-r').value);
    const out = document.getElementById('t3-result');

    if (isNaN(a) || isNaN(r)){
        out.textContent = 'Isi kolom a dan r dengan angka valid.';
        out.classList.add('show');
        return;
    }
    if (Math.abs(r) >= 1){
        out.textContent = 'Deret ini divergen (tidak punya jumlah tak hingga) karena |r| ≥ 1.';
        out.classList.add('show');
        return;
    }

    const Sinf = a / (1 - r);
    out.innerHTML = `S∞ = a / (1 − r) = ${fmt(a)} / (1 − ${fmt(r)}) = <b style="color:var(--cyan)">${fmt(Sinf)}</b>`;
    out.classList.add('show');
}

updatePanel();
