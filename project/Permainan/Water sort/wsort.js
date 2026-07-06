(function(){
    "use strict";

    const LIQUID_COLORS = [
        'linear-gradient(160deg,#ff8a9b,#e8384f)',
 'linear-gradient(160deg,#ffd166,#f4a300)',
 'linear-gradient(160deg,#6ee7b7,#10b981)',
 'linear-gradient(160deg,#7db8ff,#2563eb)',
 'linear-gradient(160deg,#d4bbff,#7c3aed)',
 'linear-gradient(160deg,#ffb0dc,#db2777)',
 'linear-gradient(160deg,#7ff0e0,#0d9488)',
 'linear-gradient(160deg,#ffe28a,#ca8a04)',
 'linear-gradient(160deg,#b7c4ff,#3b48d1)',
 'linear-gradient(160deg,#ffc2a8,#e5622a)',
 'linear-gradient(160deg,#c9f27a,#6f9a1c)',
 'linear-gradient(160deg,#e0c9ff,#8b3fd6)'
    ];

    const TOTAL_LEVELS = 50;
    const MODE_INFO = {
        easy:   { label:'Easy',   baseColors:3, maxColors:6,  baseEmpty:3, reduceEmptyAfter:null },
        medium: { label:'Medium', baseColors:5, maxColors:9,  baseEmpty:2, reduceEmptyAfter:null },
        hard:   { label:'Hard',   baseColors:7, maxColors:12, baseEmpty:2, reduceEmptyAfter:40 }
    };
    const CAPACITY = 4;

    function getLevelConfig(modeKey, level){
        const cfg = MODE_INFO[modeKey];
        const t = (level - 1) / (TOTAL_LEVELS - 1);
        const colors = Math.min(cfg.maxColors, Math.round(cfg.baseColors + t * (cfg.maxColors - cfg.baseColors)));
        let emptyTubes = cfg.baseEmpty;
        if(cfg.reduceEmptyAfter && level > cfg.reduceEmptyAfter){
            emptyTubes = Math.max(1, cfg.baseEmpty - 1);
        }
        return { colors: colors, capacity: CAPACITY, emptyTubes: emptyTubes };
    }

    // Shape per mode: { unlocked: number, best: { "3": 42, "7": 88, ... } }
    let saves = {
        easy:   { unlocked: 1, best: {} },
        medium: { unlocked: 1, best: {} },
        hard:   { unlocked: 1, best: {} }
    };
    let savesLoaded = false;

    function loadSave(modeKey){
        try{
            const raw = localStorage.getItem('watersort-save:' + modeKey);
            if(raw){
                const parsed = JSON.parse(raw);
                return { unlocked: parsed.unlocked || 1, best: parsed.best || {} };
            }
        }catch(e){ /* no save yet, or read error — fall back to defaults */ }
        return { unlocked: 1, best: {} };
    }

    function persistSave(modeKey){
        try{
            localStorage.setItem('watersort-save:' + modeKey, JSON.stringify(saves[modeKey]));
        }catch(e){
            console.error('Gagal menyimpan progres:', e);
        }
    }

    function ensureSavesLoaded(){
        if(savesLoaded) return;
        saves.easy = loadSave('easy');
        saves.medium = loadSave('medium');
        saves.hard = loadSave('hard');
        savesLoaded = true;
    }

    function resetModeProgress(modeKey){
        saves[modeKey] = { unlocked: 1, best: {} };
        try{
            localStorage.removeItem('watersort-save:' + modeKey);
        }catch(e){ /* ignore */ }
    }

    let state = {
        modeKey:null,
        level:1,
        capacity:CAPACITY,
        tubes:[],
        selected:null,
        moves:0,
        seconds:0,
        timerId:null,
        won:false
    };

    const screens = {
        start: document.getElementById('screen-start'),
 mode: document.getElementById('screen-mode'),
 levels: document.getElementById('screen-levels'),
 game: document.getElementById('screen-game')
    };
    const board = document.getElementById('board');
    const modalWin = document.getElementById('modal-win');
    const btnStart = document.getElementById('btn-start');

    function showScreen(name){
        Object.values(screens).forEach(s=>s.classList.remove('active'));
        screens[name].classList.add('active');
    }

    function spawnBubbles(){
        const field = document.getElementById('bubble-field');
        const count = 22;
        for(let i=0;i<count;i++){
            const b = document.createElement('div');
            b.className = 'bubble';
            const size = 6 + Math.random()*22;
            b.style.width = size+'px';
            b.style.height = size+'px';
            b.style.left = (Math.random()*100)+'vw';
            const dur = 9 + Math.random()*14;
            b.style.animationDuration = dur+'s';
            b.style.animationDelay = (-Math.random()*dur)+'s';
            field.appendChild(b);
        }
    }
    spawnBubbles();

    function generateLevel(modeKey, level){
        const cfg = getLevelConfig(modeKey, level);
        const capacity = cfg.capacity;
        let units = [];
        for(let c=0;c<cfg.colors;c++){
            for(let k=0;k<capacity;k++) units.push(c);
        }
        for(let i=units.length-1;i>0;i--){
            const j = Math.floor(Math.random()*(i+1));
            [units[i], units[j]] = [units[j], units[i]];
        }
        let tubes = [];
        for(let i=0;i<cfg.colors;i++){
            tubes.push(units.slice(i*capacity, (i+1)*capacity));
        }
        for(let i=0;i<cfg.emptyTubes;i++) tubes.push([]);
        return tubes;
    }

    function startTimer(){
        stopTimer();
        state.seconds = 0;
        updateHudTime();
        state.timerId = setInterval(()=>{ state.seconds++; updateHudTime(); }, 1000);
    }
    function stopTimer(){ if(state.timerId){ clearInterval(state.timerId); state.timerId = null; } }
    function formatTime(sec){
        const m = Math.floor(sec/60).toString().padStart(2,'0');
        const s = (sec%60).toString().padStart(2,'0');
        return m+':'+s;
    }
    function updateHudTime(){ document.getElementById('hud-time').textContent = formatTime(state.seconds); }

    function fastestInMode(modeKey){
        const best = saves[modeKey].best;
        const values = Object.values(best);
        if(values.length === 0) return null;
        return Math.min(...values);
    }

    function refreshModeCards(){
        ['easy','medium','hard'].forEach(modeKey=>{
            const completed = Object.keys(saves[modeKey].best).length;
            const pct = Math.round((completed / TOTAL_LEVELS) * 100);
            document.getElementById('progress-'+modeKey).style.width = pct + '%';
            document.getElementById('progress-label-'+modeKey).textContent = completed + '/' + TOTAL_LEVELS + ' selesai';
            const fastest = fastestInMode(modeKey);
            document.getElementById('best-'+modeKey).textContent = fastest !== null ? formatTime(fastest) : '--:--';
        });
    }

    function renderLevelGrid(modeKey){
        const grid = document.getElementById('level-grid');
        grid.innerHTML = '';
        const save = saves[modeKey];
        const completed = Object.keys(save.best).length;

        document.getElementById('level-mode-eyebrow').textContent = MODE_INFO[modeKey].label + ' Mode';
        document.getElementById('level-mode-title').textContent = 'Pilih Level';
        document.getElementById('level-mode-sub').textContent = completed + '/' + TOTAL_LEVELS + ' level selesai';

        for(let lvl=1; lvl<=TOTAL_LEVELS; lvl++){
            const btn = document.createElement('button');
            const locked = lvl > save.unlocked;
            const isCompleted = save.best[lvl] !== undefined;
            btn.className = 'level-btn' + (locked ? ' locked' : '') + (isCompleted ? ' completed' : '') + (lvl === save.unlocked && !isCompleted ? ' current' : '');
            btn.disabled = locked;

            if(locked){
                btn.innerHTML = '<span class="lock-icon">🔒</span>';
            } else {
                let html = '<span>'+lvl+'</span>';
                if(isCompleted){ html += '<span class="lvl-time">'+formatTime(save.best[lvl])+'</span>'; }
                btn.innerHTML = html;
                btn.addEventListener('click', ()=> startGame(modeKey, lvl));
            }
            grid.appendChild(btn);
        }
    }

    function startGame(modeKey, level){
        state.modeKey = modeKey;
        state.level = level;
        state.capacity = CAPACITY;
        state.tubes = generateLevel(modeKey, level);
        state.selected = null;
        state.moves = 0;
        state.won = false;

        document.getElementById('hud-mode').textContent = MODE_INFO[modeKey].label + ' • Level ' + level;
        document.getElementById('hud-moves').textContent = '0';
        const best = saves[modeKey].best[level];
        document.getElementById('hud-best').textContent = best !== undefined ? formatTime(best) : '--:--';

        renderBoard();
        startTimer();
        showScreen('game');
    }

    function restartGame(){ startGame(state.modeKey, state.level); }

    function renderBoard(){
        board.innerHTML = '';
        board.classList.toggle('compact', state.tubes.length > 9);

        state.tubes.forEach((tube, idx)=>{
            const slot = document.createElement('div');
            slot.className = 'tube-slot';

            const tubeEl = document.createElement('div');
            tubeEl.className = 'tube';
            tubeEl.dataset.index = idx;
            if(idx === state.selected) tubeEl.classList.add('selected');
            if(isTubeSolved(tube)) tubeEl.classList.add('solved');

            const rim = document.createElement('div');
            rim.className = 'tube-rim';
            tubeEl.appendChild(rim);

            const emptyCount = state.capacity - tube.length;
            for(let e=0;e<emptyCount;e++){
                const seg = document.createElement('div');
                seg.className = 'segment';
                tubeEl.appendChild(seg);
            }
            for(let i=tube.length-1;i>=0;i--){
                const seg = document.createElement('div');
                seg.className = 'segment liquid';
                if(i === tube.length-1) seg.classList.add('surface');
                seg.style.background = LIQUID_COLORS[tube[i] % LIQUID_COLORS.length];
                tubeEl.appendChild(seg);
            }

            tubeEl.addEventListener('click', ()=> handleTubeClick(idx));
            slot.appendChild(tubeEl);

            const label = document.createElement('div');
            label.className = 'tube-label';
            label.textContent = '#'+(idx+1);
            slot.appendChild(label);

            board.appendChild(slot);
        });
    }

    function isTubeSolved(tube){
        if(tube.length === 0) return true;
        if(tube.length !== state.capacity) return false;
        return tube.every(c => c === tube[0]);
    }

    function canPour(from,to){
        if(from === to) return false;
        const fromTube = state.tubes[from];
        const toTube = state.tubes[to];
        if(fromTube.length === 0) return false;
        if(toTube.length >= state.capacity) return false;
        if(toTube.length === 0) return true;
        return fromTube[fromTube.length-1] === toTube[toTube.length-1];
    }

    function pourAmount(from,to){
        const fromTube = state.tubes[from];
        const toTube = state.tubes[to];
        const topColor = fromTube[fromTube.length-1];
        let count = 0;
        for(let i=fromTube.length-1;i>=0;i--){
            if(fromTube[i] === topColor) count++; else break;
        }
        const space = state.capacity - toTube.length;
        return Math.min(count, space);
    }

    function doPour(from,to){
        const amt = pourAmount(from,to);
        for(let i=0;i<amt;i++){
            const color = state.tubes[from].pop();
            state.tubes[to].push(color);
        }
        state.moves++;
        document.getElementById('hud-moves').textContent = state.moves;
    }

    function handleTubeClick(idx){
        if(state.won) return;

        if(state.selected === null){
            if(state.tubes[idx].length === 0) return;
            state.selected = idx;
            renderBoard();
            return;
        }

        if(state.selected === idx){
            state.selected = null;
            renderBoard();
            return;
        }

        if(canPour(state.selected, idx)){
            const fromIdx = state.selected;
            state.selected = null;
            doPour(fromIdx, idx);
            renderBoard();
            animatePour(fromIdx, idx);
            checkWin();
        } else {
            if(state.tubes[idx].length === 0){
                state.selected = null;
                renderBoard();
            } else {
                state.selected = idx;
                renderBoard();
            }
        }
    }

    function animatePour(fromIdx, toIdx){
        const tubes = board.querySelectorAll('.tube');
        const fromEl = tubes[fromIdx];
        const toEl = tubes[toIdx];
        if(fromEl){
            fromEl.classList.add('pouring');
            fromEl.addEventListener('animationend', ()=> fromEl.classList.remove('pouring'), {once:true});
        }
        if(toEl){
            toEl.classList.add('receiving');
            toEl.addEventListener('animationend', ()=> toEl.classList.remove('receiving'), {once:true});
        }
    }

    function checkWin(){
        const solved = state.tubes.every(t => t.length === 0 || (t.length === state.capacity && t.every(c=>c===t[0])));
        if(!solved) return;
        state.won = true;
        stopTimer();

        const modeKey = state.modeKey;
        const level = state.level;
        const save = saves[modeKey];
        const prevBest = save.best[level];
        const isNewBest = prevBest === undefined || state.seconds < prevBest;
        if(isNewBest) save.best[level] = state.seconds;
        if(level >= save.unlocked && level < TOTAL_LEVELS) save.unlocked = level + 1;

        persistSave(modeKey);

        const hasNext = level < TOTAL_LEVELS;
        document.getElementById('win-title').textContent = hasNext ? 'Level ' + level + ' Selesai!' : 'Semua Level Tuntas!';
        document.getElementById('win-sub').textContent = hasNext
        ? 'Semua warna berhasil disortir dengan rapi.'
        : 'Kamu menyelesaikan seluruh 50 level mode ' + MODE_INFO[modeKey].label + '!';
        document.getElementById('win-time').textContent = formatTime(state.seconds);
        document.getElementById('win-moves').textContent = state.moves;
        document.getElementById('win-best-flag').style.display = isNewBest ? 'inline-block' : 'none';

        const nextBtn = document.getElementById('btn-next-level');
        nextBtn.style.display = hasNext ? 'inline-block' : 'none';

        setTimeout(()=> modalWin.classList.add('active'), 350);
    }

    btnStart.addEventListener('click', ()=>{
        ensureSavesLoaded();
        refreshModeCards();
        showScreen('mode');
    });

    document.getElementById('btn-back-start').addEventListener('click', ()=> showScreen('start'));

    document.querySelectorAll('.mode-card').forEach(card=>{
        card.addEventListener('click', ()=>{
            const modeKey = card.dataset.mode;
            renderLevelGrid(modeKey);
            state.modeKey = modeKey;
            showScreen('levels');
        });
    });

    document.getElementById('btn-back-modes').addEventListener('click', ()=>{
        refreshModeCards();
        showScreen('mode');
    });

    document.getElementById('btn-reset-progress').addEventListener('click', ()=>{
        const modeKey = state.modeKey;
        const ok = confirm('Reset semua progres dan rekor untuk mode ' + MODE_INFO[modeKey].label + '? Tindakan ini tidak bisa dibatalkan.');
        if(!ok) return;
        resetModeProgress(modeKey);
        renderLevelGrid(modeKey);
    });

    document.getElementById('btn-restart').addEventListener('click', ()=>{
        stopTimer();
        restartGame();
    });

    document.getElementById('btn-menu').addEventListener('click', ()=>{
        stopTimer();
        renderLevelGrid(state.modeKey);
        showScreen('levels');
    });

    document.getElementById('btn-next-level').addEventListener('click', ()=>{
        modalWin.classList.remove('active');
        const nextLevel = state.level + 1;
        startGame(state.modeKey, nextLevel);
    });

    document.getElementById('btn-win-levels').addEventListener('click', ()=>{
        modalWin.classList.remove('active');
        renderLevelGrid(state.modeKey);
        showScreen('levels');
    });

    document.getElementById('btn-win-menu').addEventListener('click', ()=>{
        modalWin.classList.remove('active');
        refreshModeCards();
        showScreen('mode');
    });

})();
