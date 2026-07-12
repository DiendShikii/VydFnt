(function(){
    "use strict";

    let audioCtx = null;
    let soundOn = true;
    function beep(freq, dur){
        if(!soundOn) return;
        try{
            if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'square';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
            osc.connect(gain).connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + dur);
        }catch(e){ /* audio not available, fail silently */ }
    }
    function beepClick(){ beep(220, 0.05); }
    function beepSuccess(){ beep(660, 0.08); setTimeout(()=>beep(880,0.1), 90); }
    function beepError(){ beep(120, 0.18); }

    function fmtNum(n){
        n = Math.round(n * 1e8) / 1e8;
        if (Object.is(n, -0)) n = 0;
        let s = n.toString();
        return s;
    }

    function normalizeExpr(raw){
        let e = raw.toLowerCase();
        e = e.replace(/×/g,'*').replace(/⋅/g,'*').replace(/\*\*/g,'^');
        e = e.replace(/\s+/g,'');
        e = e.replace(/exp\(x\)/g,'e^x');
        e = e.replace(/π/g,'pi');
        if(e === '') throw new Error('EXPRESI KOSONG');
        return e;
    }

    function splitTerms(expr){
        expr = expr.replace(/\^-/g, '^~');
        if(!/^[+-]/.test(expr)) expr = '+' + expr;
        const matches = expr.match(/[+-][^+-]+/g);
        if(!matches) throw new Error('TIDAK ADA TERM YANG DIKENALI');
        return matches.map(t => {
            const sign = t[0] === '-' ? -1 : 1;
            return { sign: sign, body: t.slice(1) };
        });
    }

    function parseTerm(body){
        body = body.replace(/~/g, '-');
        let m;

        if ((m = body.match(/^(\d*\.?\d*)\*?sin\(x\)$/))) {
            return { kind:'sin', coeff: m[1] === '' ? 1 : parseFloat(m[1]) };
        }
        if ((m = body.match(/^(\d*\.?\d*)\*?cos\(x\)$/))) {
            return { kind:'cos', coeff: m[1] === '' ? 1 : parseFloat(m[1]) };
        }
        if ((m = body.match(/^(\d*\.?\d*)\*?tan\(x\)$/))) {
            return { kind:'tan', coeff: m[1] === '' ? 1 : parseFloat(m[1]) };
        }
        if ((m = body.match(/^(\d*\.?\d*)\*?e\^x$/))) {
            return { kind:'exp', coeff: m[1] === '' ? 1 : parseFloat(m[1]) };
        }
        if ((m = body.match(/^(\d*\.?\d*)\*?(\d+(?:\.\d+)?)\^x$/))) {
            return { kind:'expBase', coeff: m[1] === '' ? 1 : parseFloat(m[1]), base: parseFloat(m[2]) };
        }
        if ((m = body.match(/^(\d*\.?\d*)\/x$/))) {
            return { kind:'invX', coeff: m[1] === '' ? 1 : parseFloat(m[1]) };
        }
        if ((m = body.match(/^(\d*\.?\d*)\*?x\^(-?\d+(?:\.\d+)?)$/))) {
            return { kind:'poly', coeff: m[1] === '' ? 1 : parseFloat(m[1]), power: parseFloat(m[2]) };
        }
        if ((m = body.match(/^(\d*\.?\d*)\*?x$/))) {
            return { kind:'poly', coeff: m[1] === '' ? 1 : parseFloat(m[1]), power: 1 };
        }
        if ((m = body.match(/^(\d+(?:\.\d+)?)$/))) {
            return { kind:'poly', coeff: parseFloat(m[1]), power: 0 };
        }
        throw new Error('TERM "' + body.toUpperCase() + '" TIDAK DIKENALI');
    }

    function integrateTerm(sign, parsed){
        let finalCoeff, shape, explicitMul = false;

        switch(parsed.kind){
            case 'sin':
                finalCoeff = -parsed.coeff; shape = 'cos(x)'; break;
            case 'cos':
                finalCoeff = parsed.coeff; shape = 'sin(x)'; break;
            case 'tan':
                finalCoeff = -parsed.coeff; shape = 'ln|cos(x)|'; break;
            case 'exp':
                finalCoeff = parsed.coeff; shape = 'e^x'; break;
            case 'expBase': {
                const denom = Math.log(parsed.base);
                finalCoeff = parsed.coeff / denom;
                shape = parsed.base + '^x';
                explicitMul = true;
                break;
            }
            case 'invX':
                finalCoeff = parsed.coeff; shape = 'ln|x|'; break;
            case 'poly':
                if (parsed.power === -1){
                    finalCoeff = parsed.coeff; shape = 'ln|x|';
                } else {
                    const newPower = parsed.power + 1;
                    finalCoeff = parsed.coeff / newPower;
                    if (newPower === 1) shape = 'x';
                    else shape = 'x^' + fmtNum(newPower);
                }
                break;
            default:
                throw new Error('ATURAN INTEGRAL TIDAK DITEMUKAN');
        }

        finalCoeff *= sign;

        const magnitude = Math.abs(finalCoeff);
        const sign2 = finalCoeff < 0 ? '-' : '+';
        let prefix;
        if (explicitMul){
            prefix = (magnitude === 1 ? '1' : fmtNum(magnitude)) + '*';
        } else {
            prefix = (magnitude === 1) ? '' : fmtNum(magnitude);
        }
        return { sign2: sign2, body: prefix + shape };
    }

    function integrateExpression(rawExpr){
        const expr = normalizeExpr(rawExpr);
        const terms = splitTerms(expr);
        const resultTerms = terms.map(t => integrateTerm(t.sign, parseTerm(t.body)));

        let out = '';
        resultTerms.forEach((rt, i) => {
            if (i === 0){
                out += (rt.sign2 === '-' ? '-' : '') + rt.body;
            } else {
                out += ' ' + rt.sign2 + ' ' + rt.body;
            }
        });
        out += ' + C';
        return out;
    }

    const state = {
        history: [],
        step: 0
    };

    const exprInput = document.getElementById('exprInput');
    const resultPanel = document.getElementById('resultPanel');
    const resultDisplay = document.getElementById('resultDisplay');
    const stepNote = document.getElementById('stepNote');
    const levelBadge = document.getElementById('levelBadge');
    const expBar = document.getElementById('expBar');
    const historyPanel = document.getElementById('historyPanel');
    const historyList = document.getElementById('historyList');

    function render(){
        if(state.history.length === 0){
            resultPanel.style.display = 'none';
            historyPanel.style.display = 'none';
            return;
        }
        resultPanel.style.display = '';
        historyPanel.style.display = state.history.length > 0 ? '' : 'none';

        const last = state.history[state.history.length - 1];
        levelBadge.textContent = 'LV.' + state.history.length;
        stepNote.textContent = '∫ ' + last.input + ' dx  =';
        resultDisplay.classList.remove('error');
        resultDisplay.textContent = last.result;
        const pct = Math.min(100, state.history.length * 20);
        expBar.style.width = pct + '%';

        historyList.innerHTML = '';
        state.history.forEach((h, idx) => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML =
            '<span class="h-step">STEP ' + (idx+1) + ' — ∫...dx</span>' +
            '<span class="h-expr">' + escapeHtml(h.input) + '</span>' +
            '<span class="h-arrow">&#8594;</span>' +
            '<span class="h-result">' + escapeHtml(h.result) + '</span>';
            historyList.appendChild(div);
        });
        historyList.scrollTop = historyList.scrollHeight;
    }

    function escapeHtml(s){
        return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function showError(msg){
        resultPanel.style.display = '';
        resultDisplay.classList.add('error');
        resultDisplay.textContent = '⚠ GAME OVER: ' + msg;
        stepNote.textContent = state.history.length
        ? 'LANJUTKAN DARI STEP ' + state.history.length
        : '';
        beepError();
    }

    function doIntegrate(inputExpr){
        try{
            const result = integrateExpression(inputExpr);
            state.history.push({ input: inputExpr, result: result });
            render();
            beepSuccess();
        }catch(err){
            showError(err.message || 'EKSPRESI TIDAK VALID');
        }
    }

    document.getElementById('calcBtn').addEventListener('click', () => {
        const v = exprInput.value.trim();
        if(!v){ showError('MASUKKAN FUNGSI DULU, PLAYER!'); return; }
        beepClick();
        doIntegrate(v);
    });

    exprInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') document.getElementById('calcBtn').click();
    });

        document.getElementById('integrateAgainBtn').addEventListener('click', () => {
            if(state.history.length === 0) return;
            beepClick();
            const last = state.history[state.history.length - 1];
            const nextInput = last.result.replace(/\s*\+\s*C\s*$/,'');
            doIntegrate(nextInput);
        });

        document.getElementById('undoBtn').addEventListener('click', () => {
            if(state.history.length === 0) return;
            beepClick();
            state.history.pop();
            render();
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            beepClick();
            state.history = [];
            exprInput.value = '';
            render();
        });

        document.getElementById('copyBtn').addEventListener('click', () => {
            if(state.history.length === 0) return;
            const last = state.history[state.history.length - 1];
            navigator.clipboard.writeText(last.result).then(() => {
                const btn = document.getElementById('copyBtn');
                const old = btn.textContent;
                btn.textContent = '✔ TERSALIN!';
                setTimeout(() => btn.textContent = old, 1200);
            }).catch(()=>{});
            beepClick();
        });

        document.getElementById('muteBtn').addEventListener('click', function(){
            soundOn = !soundOn;
            this.textContent = soundOn ? '🔊 SUARA: ON' : '🔇 SUARA: OFF';
        });

        const tokens = ['x','x^','+','-','*','/','(',')','sin(x)','cos(x)','tan(x)','e^x','^2','^3'];
        const quickWrap = document.getElementById('quickButtons');
        tokens.forEach(tok => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'tok-btn';
            b.textContent = tok;
            b.addEventListener('click', () => {
                insertAtCursor(exprInput, tok);
                beepClick();
            });
            quickWrap.appendChild(b);
        });

        const presets = ['2x','3x^2 + 2x','sin(x)','cos(x)','e^x','1/x','5x^4 - 3x^2 + 7','2^x'];
        const presetWrap = document.getElementById('presetButtons');
        presets.forEach(p => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'preset-btn';
            b.textContent = p;
            b.addEventListener('click', () => {
                exprInput.value = p;
                exprInput.focus();
                beepClick();
            });
            presetWrap.appendChild(b);
        });

        function insertAtCursor(input, text){
            input.focus();
            const start = input.selectionStart ?? input.value.length;
            const end = input.selectionEnd ?? input.value.length;
            const val = input.value;
            input.value = val.slice(0, start) + text + val.slice(end);
            const pos = start + text.length;
            input.setSelectionRange(pos, pos);
        }

        render();
})();
