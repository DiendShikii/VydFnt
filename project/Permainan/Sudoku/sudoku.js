(function(){
  "use strict";

  const MODES = {
    easy:   { label:"Easy",        clues:41 },
    medium: { label:"Medium",      clues:32 },
    hard:   { label:"Hard",        clues:25 },
    bayern: { label:"Bayern 2020", clues:18 }
  };

  const screens = {
    start: document.getElementById('screen-start'),
    modes: document.getElementById('screen-modes'),
    loading: document.getElementById('screen-loading'),
    game: document.getElementById('screen-game')
  };
  function showScreen(name){
    Object.values(screens).forEach(s=>s.classList.remove('active'));
    screens[name].classList.add('active');
  }

  (function buildPreview(){
    const g = document.getElementById('preview-grid');
    const sample = "53 7    6  195   98    6 8   6   34  8 3  17   2   6 6    28    419  5    8  79";
    for(let i=0;i<81;i++){
      const d = document.createElement('div');
      const ch = sample[i];
      d.textContent = (ch && ch !== ' ') ? ch : '';
      g.appendChild(d);
    }
  })();

  function shuffle(arr){
    for(let i=arr.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [arr[i],arr[j]]=[arr[j],arr[i]];
    }
    return arr;
  }

  const boxIndex = (r,c)=> Math.floor(r/3)*3 + Math.floor(c/3);

  function generateFullBoard(){
    const grid = Array.from({length:9}, ()=>Array(9).fill(0));
    const rows = Array(9).fill(0), cols = Array(9).fill(0), boxes = Array(9).fill(0);

    function fill(pos){
      if(pos === 81) return true;
      const r = Math.floor(pos/9), c = pos % 9;
      const b = boxIndex(r,c);
      const nums = shuffle([1,2,3,4,5,6,7,8,9]);
      for(const n of nums){
        const bit = 1 << n;
        if(rows[r] & bit) continue;
        if(cols[c] & bit) continue;
        if(boxes[b] & bit) continue;
        grid[r][c] = n;
        rows[r]|=bit; cols[c]|=bit; boxes[b]|=bit;
        if(fill(pos+1)) return true;
        grid[r][c] = 0;
        rows[r]&=~bit; cols[c]&=~bit; boxes[b]&=~bit;
      }
      return false;
    }
    fill(0);
    return grid;
  }

  function countSolutions(grid, limit){
    const rows = Array(9).fill(0), cols = Array(9).fill(0), boxes = Array(9).fill(0);
    const cells = [];
    for(let r=0;r<9;r++) for(let c=0;c<9;c++){
      if(grid[r][c] !== 0){
        const bit = 1 << grid[r][c];
        rows[r]|=bit; cols[c]|=bit; boxes[boxIndex(r,c)]|=bit;
      } else {
        cells.push([r,c]);
      }
    }
    let count = 0;
    function solve(idx){
      if(count >= limit) return;
      if(idx === cells.length){ count++; return; }
      const [r,c] = cells[idx];
      const b = boxIndex(r,c);
      const used = rows[r] | cols[c] | boxes[b];
      for(let n=1;n<=9;n++){
        const bit = 1 << n;
        if(used & bit) continue;
        rows[r]|=bit; cols[c]|=bit; boxes[b]|=bit;
        solve(idx+1);
        rows[r]&=~bit; cols[c]&=~bit; boxes[b]&=~bit;
        if(count >= limit) return;
      }
    }
    solve(0);
    return count;
  }

  function digRounds(fullBoard, clueTarget, maxRounds){
    const puzzle = fullBoard.map(row=>row.slice());
    const maxRemove = 81 - clueTarget;
    let removedTotal = 0;

    for(let round=0; round<maxRounds; round++){
      let positions = [];
      for(let r=0;r<9;r++) for(let c=0;c<9;c++) if(puzzle[r][c]!==0) positions.push([r,c]);
      positions = shuffle(positions);
      let removedThisRound = 0;

      for(const [r,c] of positions){
        if(removedTotal >= maxRemove) break;
        const backup = puzzle[r][c];
        puzzle[r][c] = 0;
        const solCount = countSolutions(puzzle, 2);
        if(solCount === 1){
          removedTotal++; removedThisRound++;
        } else {
          puzzle[r][c] = backup;
        }
      }
      if(removedTotal >= maxRemove) break;
      if(removedThisRound === 0) break;
    }

    let clueCount = 0;
    puzzle.forEach(row=>row.forEach(v=>{ if(v!==0) clueCount++; }));
    return { puzzle, clueCount };
  }

  function makePuzzle(clueTarget, timeBudgetMs){
    const t0 = Date.now();
    let best = null;
    do{
      const full = generateFullBoard();
      const res = digRounds(full, clueTarget, 6);
      if(!best || res.clueCount < best.clueCount){
        best = { puzzle: res.puzzle, clueCount: res.clueCount, solution: full };
      }
    } while(best.clueCount > clueTarget && (Date.now() - t0) < timeBudgetMs);
    return best;
  }

  const DIG_BUDGET_MS = { easy:400, medium:700, hard:1500, bayern:3800 };

  let solutionBoard = null;
  let puzzleBoard = null;
  let userBoard = null;
  let fixedMask = null;
  let selected = null;
  let currentModeKey = 'easy';
  let timerHandle = null;
  let elapsed = 0;
  let mistakes = 0;
  let gameActive = false;

  function storageKey(modeKey){ return 'sudoku_stempel_best_' + modeKey; }

  function getBest(modeKey){
    try{
      const v = localStorage.getItem(storageKey(modeKey));
      return v ? parseInt(v,10) : null;
    }catch(e){ return null; }
  }
  function setBestIfBetter(modeKey, seconds){
    const cur = getBest(modeKey);
    if(cur === null || seconds < cur){
      try{ localStorage.setItem(storageKey(modeKey), String(seconds)); }catch(e){}
      return true;
    }
    return false;
  }
  function fmtTime(totalSec){
    const m = Math.floor(totalSec/60).toString().padStart(2,'0');
    const s = Math.floor(totalSec%60).toString().padStart(2,'0');
    return m+':'+s;
  }
  function refreshBestLabels(){
    document.querySelectorAll('[data-best]').forEach(el=>{
      const key = el.getAttribute('data-best');
      const best = getBest(key);
      el.textContent = 'Rekor tercepat: ' + (best !== null ? fmtTime(best) : '—');
    });
  }

  const boardEl = document.getElementById('board');
  const cellEls = [];
  for(let r=0;r<9;r++){
    for(let c=0;c<9;c++){
      const d = document.createElement('div');
      d.className = 'cell';
      d.dataset.r = r; d.dataset.c = c;
      d.addEventListener('click', ()=> selectCell(r,c));
      boardEl.appendChild(d);
      cellEls.push(d);
    }
  }
  function cellEl(r,c){ return cellEls[r*9+c]; }

  const numpadEl = document.getElementById('numpad');
  for(let n=1;n<=9;n++){
    const b = document.createElement('button');
    b.className = 'num-btn';
    b.textContent = n;
    b.addEventListener('click', ()=> placeNumber(n));
    numpadEl.appendChild(b);
  }
  const eraseBtn = document.createElement('button');
  eraseBtn.className = 'num-btn erase';
  eraseBtn.textContent = 'Hapus';
  eraseBtn.addEventListener('click', ()=> placeNumber(0));
  numpadEl.appendChild(eraseBtn);

  document.addEventListener('keydown', (e)=>{
    if(!gameActive || !selected) return;
    if(e.key >= '1' && e.key <= '9') placeNumber(parseInt(e.key,10));
    if(e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') placeNumber(0);
    const {r,c} = selected;
    if(e.key === 'ArrowUp' && r>0) selectCell(r-1,c);
    if(e.key === 'ArrowDown' && r<8) selectCell(r+1,c);
    if(e.key === 'ArrowLeft' && c>0) selectCell(r,c-1);
    if(e.key === 'ArrowRight' && c<8) selectCell(r,c+1);
  });

  function selectCell(r,c){
    selected = {r,c};
    renderHighlights();
  }

  function renderHighlights(){
    cellEls.forEach(el=>{
      el.classList.remove('selected','peer','same-num');
    });
    if(!selected) return;
    const {r,c} = selected;
    const b = boxIndex(r,c);
    const val = userBoard[r][c];
    for(let i=0;i<9;i++){
      for(let j=0;j<9;j++){
        if(i===r && j===c) continue;
        if(i===r || j===c || boxIndex(i,j)===b){
          cellEl(i,j).classList.add('peer');
        }
        if(val !== 0 && userBoard[i][j] === val){
          cellEl(i,j).classList.add('same-num');
        }
      }
    }
    cellEl(r,c).classList.add('selected');
  }

  function isWrong(r,c,val){
    if(val === 0) return false;
    return val !== solutionBoard[r][c];
  }

  function placeNumber(n){
    if(!gameActive || !selected) return;
    const {r,c} = selected;
    if(fixedMask[r][c]) return;
    userBoard[r][c] = n;
    if(n !== 0 && isWrong(r,c,n)) mistakes++;
    renderBoard();
    renderHighlights();
    updateMistakesNote();
    checkWin();
  }

  function updateMistakesNote(){
    const note = document.getElementById('mistakes-note');
    note.textContent = mistakes > 0 ? ('Kesalahan terdeteksi: ' + mistakes + 'x sepanjang permainan') : '';
  }

  function renderBoard(){
    for(let r=0;r<9;r++){
      for(let c=0;c<9;c++){
        const el = cellEl(r,c);
        const val = userBoard[r][c];
        el.textContent = val === 0 ? '' : val;
        el.classList.toggle('fixed', !!fixedMask[r][c]);
        el.classList.toggle('filled-user', !fixedMask[r][c] && val !== 0);
        el.classList.toggle('conflict', !fixedMask[r][c] && val !== 0 && isWrong(r,c,val));
      }
    }
  }

  function boardFull(){
    for(let r=0;r<9;r++) for(let c=0;c<9;c++) if(userBoard[r][c]===0) return false;
    return true;
  }
  function boardCorrect(){
    for(let r=0;r<9;r++) for(let c=0;c<9;c++) if(userBoard[r][c] !== solutionBoard[r][c]) return false;
    return true;
  }

  function checkWin(){
    if(boardFull() && boardCorrect()){
      endGame(true);
    }
  }

  function startTimer(){
    elapsed = 0;
    updateTimerDisplay();
    clearInterval(timerHandle);
    timerHandle = setInterval(()=>{
      elapsed++;
      updateTimerDisplay();
    }, 1000);
  }
  function stopTimer(){ clearInterval(timerHandle); }
  function updateTimerDisplay(){
    document.getElementById('timer').textContent = fmtTime(elapsed);
  }

  function beginNewGame(modeKey){
    currentModeKey = modeKey;
    showScreen('loading');
    mistakes = 0;
    setTimeout(()=>{
      const budget = DIG_BUDGET_MS[modeKey] || 800;
      const result = makePuzzle(MODES[modeKey].clues, budget);
      solutionBoard = result.solution;
      puzzleBoard = result.puzzle;
      userBoard = result.puzzle.map(row=>row.slice());
      fixedMask = result.puzzle.map(row=>row.map(v=> v!==0));
      selected = null;
      gameActive = true;

      const modeTagEl = document.getElementById('game-mode-tag');
      modeTagEl.textContent = MODES[modeKey].label;
      modeTagEl.className = 'mode-tag tag-' + modeKey;
      const best = getBest(modeKey);
      document.getElementById('game-best-note').textContent = 'Rekor: ' + (best!==null ? fmtTime(best) : '—');
      document.getElementById('mistakes-note').textContent = '';

      renderBoard();
      renderHighlights();
      startTimer();
      showScreen('game');
    }, 30);
  }

  function endGame(won){
    gameActive = false;
    stopTimer();
    if(won){
      const isRecord = setBestIfBetter(currentModeKey, elapsed);
      document.getElementById('win-title').textContent = 'Papan Terpecahkan';
      document.getElementById('win-time').textContent = fmtTime(elapsed);
      document.getElementById('win-record').textContent = isRecord ? '🏆 Rekor baru untuk mode ' + MODES[currentModeKey].label + '!' : '';
      document.getElementById('win-overlay').classList.add('active');
      refreshBestLabels();
    }
  }

  document.getElementById('btn-start').addEventListener('click', ()=>{
    refreshBestLabels();
    showScreen('modes');
  });
  document.getElementById('btn-back-to-start').addEventListener('click', ()=> showScreen('start'));

  document.querySelectorAll('.mode-card').forEach(card=>{
    card.addEventListener('click', ()=>{
      const mode = card.getAttribute('data-mode');
      beginNewGame(mode);
    });
  });

  document.getElementById('btn-restart').addEventListener('click', ()=>{
    beginNewGame(currentModeKey);
  });
  document.getElementById('btn-menu').addEventListener('click', ()=>{
    gameActive = false;
    stopTimer();
    refreshBestLabels();
    showScreen('modes');
  });

  document.getElementById('win-again').addEventListener('click', ()=>{
    document.getElementById('win-overlay').classList.remove('active');
    beginNewGame(currentModeKey);
  });
  document.getElementById('win-menu').addEventListener('click', ()=>{
    document.getElementById('win-overlay').classList.remove('active');
    refreshBestLabels();
    showScreen('modes');
  });

  refreshBestLabels();
})();
