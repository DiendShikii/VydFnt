(function () {
    "use strict";

    let audioCtx = null;
    let soundOn = true;

    function beep(freq, dur) {
        if (!soundOn) return;
        try {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = "square";
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
            osc.connect(gain).connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + dur);
        } catch (e) {
        }
    }

    const beepClick = () => beep(220, 0.05);
    const beepSuccess = () => { beep(660, 0.08); setTimeout(() => beep(880, 0.1), 90); };
    const beepBoss = () => { beep(440, 0.07); setTimeout(() => beep(660, 0.07), 80); setTimeout(() => beep(990, 0.12), 160); };
    const beepError = () => beep(120, 0.18);

    function gcd(a, b) {
        a = Math.abs(a); b = Math.abs(b);
        while (b) { [a, b] = [b, a % b]; }
        return a || 1;
    }
    function makeFrac(num, den) {
        if (den < 0) { num = -num; den = -den; }
        const g = gcd(num, den) || 1;
        return { num: num / g, den: den / g };
    }
    function isFrac(c) { return c !== null && typeof c === "object" && "num" in c; }
    function fracMulInt(f, k) { return makeFrac(f.num * k, f.den); }
    function fracDivInt(f, k) { return makeFrac(f.num, f.den * k); }
    function fracNeg(f) { return { num: -f.num, den: f.den }; }
    function coeffToDecimal(c) { return isFrac(c) ? c.num / c.den : c; }

    function parseDecimalToFrac(str) {
        if (str === "" || str === undefined) return { num: 1, den: 1 };
        const dot = str.indexOf(".");
        if (dot === -1) {
            const n = parseInt(str, 10);
            return makeFrac(isNaN(n) ? 1 : n, 1);
        }
        const intPart = str.slice(0, dot) || "0";
        const fracPart = str.slice(dot + 1);
        const den = Math.pow(10, fracPart.length);
        const num = parseInt(intPart + fracPart, 10);
        return makeFrac(num, den);
    }

    function decimalToNiceFraction(x, tolerance = 1e-9, maxDen = 1000) {
        if (!isFinite(x)) return null;
        if (Number.isInteger(x)) return { num: x, den: 1 };
        const sign = x < 0 ? -1 : 1;
        const ax = Math.abs(x);
        let h1 = 1, h2 = 0, k1 = 0, k2 = 1, b = ax;
        for (let i = 0; i < 30; i++) {
            const a = Math.floor(b);
            const h = a * h1 + h2, k = a * k1 + k2;
            h2 = h1; h1 = h; k2 = k1; k1 = k;
            if (k1 > maxDen) break;
            if (Math.abs(ax - h1 / k1) <= tolerance) break;
            const rem = b - a;
            if (rem < 1e-12) break;
            b = 1 / rem;
        }
        if (k1 <= maxDen && Math.abs(ax - h1 / k1) <= tolerance) return makeFrac(sign * h1, k1);
        return null;
    }

    function fmtNum(n) {
        n = Math.round(n * 1e8) / 1e8;
        if (Object.is(n, -0)) n = 0;
        return n.toString();
    }

    function formatDecimalMaybeFraction(value) {
        if (Number.isInteger(value)) return fmtNum(value);
        const f = decimalToNiceFraction(value);
        if (f) return (f.num < 0 ? "-" : "") + Math.abs(f.num) + "/" + f.den;
        return fmtNum(value);
    }

    function coeffSignAndAbs(coeff) {
        if (isFrac(coeff)) {
            const sign = coeff.num < 0 ? -1 : 1;
            return { sign, abs: { num: Math.abs(coeff.num), den: coeff.den } };
        }
        return { sign: coeff < 0 ? -1 : 1, abs: Math.abs(coeff) };
    }

    function formatCoeffMagnitude(abs) {
        if (isFrac(abs)) {
            if (abs.den === 1) return { text: abs.num === 1 ? "" : String(abs.num), isOne: abs.num === 1 };
            return { text: abs.num + "/" + abs.den, isOne: false, isFrac: true };
        }
        return { text: abs === 1 ? "" : fmtNum(abs), isOne: abs === 1 };
    }

    function normalizeExpr(raw) {
        let e = raw.toLowerCase();
        e = e.replace(/×/g, "*").replace(/⋅/g, "*").replace(/\*\*/g, "^");
        e = e.replace(/\s+/g, "");
        e = e.replace(/exp\(x\)/g, "e^x");
        if (e === "") throw new Error("EXPRESI KOSONG");
        return e;
    }

    function splitTerms(expr) {
        expr = expr.replace(/\^-/g, "^~");
        if (!/^[+-]/.test(expr)) expr = "+" + expr;
        const matches = expr.match(/[+-][^+-]+/g);
        if (!matches) throw new Error("TIDAK ADA TERM YANG DIKENALI");
        return matches.map((t) => ({ sign: t[0] === "-" ? -1 : 1, body: t.slice(1) }));
    }

    function parseTerm(body) {
        body = body.replace(/~/g, "-");
        let m;
        const frac = (g) => parseDecimalToFrac(g === undefined ? "" : g);

        if ((m = body.match(/^(\d*\.?\d*)\*?sin\(x\)$/))) return { kind: "sin", coeff: frac(m[1]) };
        if ((m = body.match(/^(\d*\.?\d*)\*?cos\(x\)$/))) return { kind: "cos", coeff: frac(m[1]) };
        if ((m = body.match(/^(\d*\.?\d*)\*?tan\(x\)$/))) return { kind: "tan", coeff: frac(m[1]) };
        if ((m = body.match(/^(\d*\.?\d*)\*?ln\(x\)$/))) return { kind: "lnAbsX", coeff: frac(m[1]) };
        if ((m = body.match(/^(\d*\.?\d*)\*?e\^x$/))) return { kind: "exp", coeff: frac(m[1]) };
        if ((m = body.match(/^(\d*\.?\d*)\*?(\d+(?:\.\d+)?)\^x$/)))
            return { kind: "expBase", coeff: frac(m[1]), base: parseFloat(m[2]) };
        if ((m = body.match(/^(\d*\.?\d*)\/x$/))) return { kind: "poly", coeff: frac(m[1]), power: -1 };
        if ((m = body.match(/^(\d*\.?\d*)\*?x\^(-?\d+(?:\.\d+)?)$/)))
            return { kind: "poly", coeff: frac(m[1]), power: parseFloat(m[2]) };
        if ((m = body.match(/^(\d*\.?\d*)\*?x$/))) return { kind: "poly", coeff: frac(m[1]), power: 1 };
        if ((m = body.match(/^(\d+(?:\.\d+)?)$/))) return { kind: "poly", coeff: parseDecimalToFrac(m[1]), power: 0 };

        throw new Error('TERM "' + body.toUpperCase() + '" TIDAK DIKENALI');
    }

    function parseExpression(rawExpr) {
        const expr = normalizeExpr(rawExpr);
        const terms = splitTerms(expr);
        return terms.map((t) => {
            const p = parseTerm(t.body);
            return { kind: p.kind, coeff: fracMulInt(p.coeff, t.sign), power: p.power, base: p.base };
        });
    }

    function integrateShapeTerm(term) {
        switch (term.kind) {
            case "sin":
                return [{ kind: "cos", coeff: fracNeg(term.coeff) }];
            case "cos":
                return [{ kind: "sin", coeff: term.coeff }];
            case "tan":
                return [{ kind: "lnAbsCos", coeff: fracNeg(term.coeff) }];
            case "exp":
                return [{ kind: "exp", coeff: term.coeff }];
            case "expBase": {
                const denom = Math.log(term.base);
                return [{ kind: "expBase", coeff: coeffToDecimal(term.coeff) / denom, base: term.base }];
            }
            case "lnAbsX":
                return [
                    { kind: "xlnx", coeff: term.coeff },
                    { kind: "poly", coeff: fracNeg(term.coeff), power: 1 },
                ];
            case "poly":
                if (term.power === -1) return [{ kind: "lnAbsX", coeff: term.coeff }];
                {
                    const newPower = term.power + 1;
                    const coeff = Number.isInteger(newPower)
                    ? fracDivInt(term.coeff, newPower)
                    : coeffToDecimal(term.coeff) / newPower;
                    return [{ kind: "poly", coeff, power: newPower }];
                }
            default:
                throw new Error("ATURAN INTEGRAL TIDAK DITEMUKAN");
        }
    }

    function integrateShapeTerms(fTerms) {
        const out = [];
        fTerms.forEach((t) => out.push(...integrateShapeTerm(t)));
        return out;
    }

    function needsExplicitMul(kind) {
        return kind === "expBase" || kind === "xlnx";
    }

    function shapeToString(term) {
        switch (term.kind) {
            case "poly":
                if (term.power === 1) return "x";
                if (term.power === 0) return "1";
                return "x^" + fmtNum(term.power);
            case "sin": return "sin(x)";
            case "cos": return "cos(x)";
            case "tan": return "tan(x)";
            case "exp": return "e^x";
            case "expBase": return term.base + "^x";
            case "lnAbsX": return "ln|x|";
            case "lnAbsCos": return "ln|cos(x)|";
            case "xlnx": return "x*ln|x|";
            default: return "?";
        }
    }

    function shapeTermsToDisplay(terms, withC) {
        let out = "";
        terms.forEach((term, i) => {
            const { sign, abs } = coeffSignAndAbs(term.coeff);
            const sign2 = sign < 0 ? "-" : "+";
            const mag = formatCoeffMagnitude(abs);
            const shape = shapeToString(term);
            const magText = mag.isFrac ? "(" + mag.text + ")" : mag.text;
            let prefix;
            if (mag.isOne) {
                prefix = "";
            } else if (needsExplicitMul(term.kind)) {
                prefix = magText + "*";
            } else {
                prefix = magText;
            }
            const body = prefix + shape;
            out += i === 0 ? (sign2 === "-" ? "-" : "") + body : " " + sign2 + " " + body;
        });
        if (withC) out += (terms.length ? " + " : "") + "C";
        return out;
    }

    function evalShapeTerm(term, x) {
        const c = coeffToDecimal(term.coeff);
        switch (term.kind) {
            case "poly": return c * Math.pow(x, term.power);
            case "sin": return c * Math.sin(x);
            case "cos": return c * Math.cos(x);
            case "tan": return c * Math.tan(x);
            case "exp": return c * Math.exp(x);
            case "expBase": return c * Math.pow(term.base, x);
            case "lnAbsX": return c * Math.log(Math.abs(x));
            case "lnAbsCos": return c * Math.log(Math.abs(Math.cos(x)));
            case "xlnx": return c * x * Math.log(Math.abs(x));
            default: return NaN;
        }
    }

    function evalShapeTerms(terms, x) {
        let total = 0;
        for (const t of terms) {
            const v = evalShapeTerm(t, x);
            if (!isFinite(v)) return NaN;
            total += v;
        }
        return total;
    }

    function integrateExpression(rawExpr) {
        const fTerms = parseExpression(rawExpr);
        const capTerms = integrateShapeTerms(fTerms);
        const display = shapeTermsToDisplay(capTerms, true);
        return { fTerms, capTerms, display };
    }

    const state = {
        history: [], 
        boundA: 0,
        boundB: 1,
    };

    const el = {
        exprInput: document.getElementById("exprInput"),
 resultPanel: document.getElementById("resultPanel"),
 resultDisplay: document.getElementById("resultDisplay"),
 stepNote: document.getElementById("stepNote"),
 levelBadge: document.getElementById("levelBadge"),
 expBar: document.getElementById("expBar"),
 historyPanel: document.getElementById("historyPanel"),
 historyList: document.getElementById("historyList"),
 definitePanel: document.getElementById("definitePanel"),
 boundA: document.getElementById("boundA"),
 boundB: document.getElementById("boundB"),
 definiteSteps: document.getElementById("definiteSteps"),
 definiteResult: document.getElementById("definiteResult"),
    };

    function escapeHtml(s) {
        return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function currentEntry() {
        return state.history[state.history.length - 1] || null;
    }

    function renderIndefinite() {
        if (state.history.length === 0) {
            el.resultPanel.style.display = "none";
            el.historyPanel.style.display = "none";
            el.definitePanel.style.display = "none";
            return;
        }
        const last = currentEntry();

        el.resultPanel.style.display = "";
        el.historyPanel.style.display = "";
        el.definitePanel.style.display = "";

        el.levelBadge.textContent = "LV." + state.history.length;
        el.stepNote.textContent = "∫ " + last.input + " dx  =";
        el.resultDisplay.classList.remove("error");
        el.resultDisplay.textContent = last.display;
        el.expBar.style.width = Math.min(100, state.history.length * 20) + "%";

        el.historyList.innerHTML = "";
        state.history.forEach((h, idx) => {
            const div = document.createElement("div");
            div.className = "history-item";
            div.innerHTML =
            '<span class="h-step">STEP ' + (idx + 1) + " — ∫...dx</span>" +
            '<span class="h-expr">' + escapeHtml(h.input) + "</span>" +
            '<span class="h-arrow">&#8594;</span>' +
            '<span class="h-result">' + escapeHtml(h.display) + "</span>";
            el.historyList.appendChild(div);
        });
        el.historyList.scrollTop = el.historyList.scrollHeight;

        el.definiteSteps.innerHTML = "";
        el.definiteResult.textContent = "";
    }

    function showError(msg) {
        el.resultPanel.style.display = "";
        el.resultDisplay.classList.add("error");
        el.resultDisplay.textContent = "⚠ GAME OVER: " + msg;
        el.stepNote.textContent = state.history.length ? "LANJUTKAN DARI STEP " + state.history.length : "";
        beepError();
    }

    function doIntegrateFromText(inputExpr) {
        try {
            const { fTerms, capTerms, display } = integrateExpression(inputExpr);
            state.history.push({ input: inputExpr, display, fTerms, capTerms });
            renderIndefinite();
            beepSuccess();
        } catch (err) {
            showError(err.message || "EKSPRESI TIDAK VALID");
        }
    }

    function doIntegrateAgain() {
        const prev = currentEntry();
        if (!prev) return;
        try {
            const fTerms = prev.capTerms;
            const capTerms = integrateShapeTerms(fTerms);
            const display = shapeTermsToDisplay(capTerms, true);
            state.history.push({ input: prev.display.replace(/\s*\+\s*C\s*$/, ""), display, fTerms, capTerms });
            renderIndefinite();
            beepSuccess();
        } catch (err) {
            showError(err.message || "TIDAK BISA DIINTEGRALKAN LAGI");
        }
    }

    function computeDefinite() {
        const entry = currentEntry();
        if (!entry) return;

        const a = parseFloat(el.boundA.value);
        const b = parseFloat(el.boundB.value);
        if (isNaN(a) || isNaN(b)) {
            el.definiteResult.innerHTML = '<span class="def-error">⚠ BATAS a DAN b HARUS BERUPA ANGKA</span>';
            el.definiteSteps.innerHTML = "";
            beepError();
            return;
        }
        state.boundA = a;
        state.boundB = b;

        const valA = evalShapeTerms(entry.capTerms, a);
        const valB = evalShapeTerms(entry.capTerms, b);

        if (!isFinite(valA) || !isFinite(valB)) {
            el.definiteResult.innerHTML =
            '<span class="def-error">⚠ FUNGSI TIDAK TERDEFINISI DI BATAS INI (misalnya ln(0) atau pembagian nol)</span>';
            el.definiteSteps.innerHTML = "";
            beepError();
            return;
        }

        const F = shapeTermsToDisplay(entry.capTerms, false) || "0";
        const value = valB - valA;

        el.definiteSteps.innerHTML =
        '<div class="def-line">∫<sub>' + fmtNum(a) + "</sub><sup>" + fmtNum(b) + "</sup> (" + escapeHtml(entry.input) + ") dx</div>" +
        '<div class="def-line">= [ ' + escapeHtml(F) + " ]<sub>" + fmtNum(a) + "</sub><sup>" + fmtNum(b) + "</sup></div>" +
        '<div class="def-line">= (' + formatDecimalMaybeFraction(valB) + ") - (" + formatDecimalMaybeFraction(valA) + ")</div>";

        el.definiteResult.innerHTML = '<span class="def-value">= ' + formatDecimalMaybeFraction(value) + "</span>";

        beepBoss();
    }

    function insertAtCursor(input, text) {
        input.focus();
        const start = input.selectionStart ?? input.value.length;
        const end = input.selectionEnd ?? input.value.length;
        const val = input.value;
        input.value = val.slice(0, start) + text + val.slice(end);
        const pos = start + text.length;
        input.setSelectionRange(pos, pos);
    }

    const TOKENS = ["x", "x^", "+", "-", "*", "/", "(", ")", "sin(x)", "cos(x)", "tan(x)", "e^x", "ln(x)", "^2", "^3"];
    const PRESETS = ["2x", "3x^2 + 2x", "sin(x)", "cos(x)", "e^x", "1/x", "5x^4 - 3x^2 + 7", "2^x", "ln(x)"];

    function buildTokenButtons() {
        const quickWrap = document.getElementById("quickButtons");
        TOKENS.forEach((tok) => {
            const b = document.createElement("button");
            b.type = "button";
            b.className = "tok-btn";
            b.textContent = tok;
            b.addEventListener("click", () => { insertAtCursor(el.exprInput, tok); beepClick(); });
            quickWrap.appendChild(b);
        });

        const presetWrap = document.getElementById("presetButtons");
        PRESETS.forEach((p) => {
            const b = document.createElement("button");
            b.type = "button";
            b.className = "preset-btn";
            b.textContent = p;
            b.addEventListener("click", () => { el.exprInput.value = p; el.exprInput.focus(); beepClick(); });
            presetWrap.appendChild(b);
        });
    }

    function wireEvents() {
        document.getElementById("calcBtn").addEventListener("click", () => {
            const v = el.exprInput.value.trim();
            if (!v) { showError("MASUKKAN FUNGSI DULU, PLAYER!"); return; }
            beepClick();
            doIntegrateFromText(v);
        });

        el.exprInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") document.getElementById("calcBtn").click();
        });

            document.getElementById("integrateAgainBtn").addEventListener("click", () => {
                if (state.history.length === 0) return;
                beepClick();
                doIntegrateAgain();
            });

            document.getElementById("undoBtn").addEventListener("click", () => {
                if (state.history.length === 0) return;
                beepClick();
                state.history.pop();
                renderIndefinite();
            });

            document.getElementById("resetBtn").addEventListener("click", () => {
                beepClick();
                state.history = [];
                el.exprInput.value = "";
                renderIndefinite();
            });

            document.getElementById("copyBtn").addEventListener("click", () => {
                if (state.history.length === 0) return;
                const last = currentEntry();
                navigator.clipboard.writeText(last.display).then(() => {
                    const btn = document.getElementById("copyBtn");
                    const old = btn.textContent;
                    btn.textContent = "✔ TERSALIN!";
                    setTimeout(() => (btn.textContent = old), 1200);
                }).catch(() => {});
                beepClick();
            });

            document.getElementById("muteBtn").addEventListener("click", function () {
                soundOn = !soundOn;
                this.textContent = soundOn ? "🔊 SUARA: ON" : "🔇 SUARA: OFF";
            });

            document.getElementById("computeDefiniteBtn").addEventListener("click", () => {
                beepClick();
                computeDefinite();
            });

            [el.boundA, el.boundB].forEach((input) => {
                input.addEventListener("keydown", (e) => {
                    if (e.key === "Enter") document.getElementById("computeDefiniteBtn").click();
                });
            });
    }

    buildTokenButtons();
    wireEvents();
    renderIndefinite();
})();
