(function(){
    "use strict";
    var game = new Chess();
    var currentMode = null;
    var pendingMode = null;
    var aiColor = null;
    var humanColor = null;
    var boardFlipped = false;
var selectedSquare = null;
var legalTargets = [];
var lastMove = null;
var pendingPromotion = null;
var boardLocked = false;

var MODE_LABELS = {
    'easy': 'Mode: Easy',
    'medium': 'Mode: Medium',
    'hard': 'Mode: Hard',
    'two-player': 'Mode: 2 Pemain'
};
var MODE_DEPTH = { 'medium': 2, 'hard': 3 };

function showScreen(id){
    document.querySelectorAll('.screen').forEach(function(s){ s.classList.remove('active'); });
    document.getElementById(id).classList.add('active');
}

document.getElementById('btn-start').addEventListener('click', function(){
    showScreen('screen-mode');
});
document.getElementById('btn-mode-back').addEventListener('click', function(){
    showScreen('screen-start');
});
document.getElementById('btn-color-back').addEventListener('click', function(){
    showScreen('screen-mode');
});
document.getElementById('btn-menu').addEventListener('click', function(){
    showScreen('screen-start');
});
document.getElementById('btn-gameover-menu').addEventListener('click', function(){
    hideModal('modal-gameover');
    showScreen('screen-start');
});

document.querySelectorAll('#screen-mode .mode-card').forEach(function(card){
    card.addEventListener('click', function(){
        var mode = card.getAttribute('data-mode');
        if(mode === 'two-player'){
            startGame(mode, null);
        } else {
            pendingMode = mode;
            showScreen('screen-color');
        }
    });
});

document.querySelectorAll('#screen-color .mode-card').forEach(function(card){
    card.addEventListener('click', function(){
        var color = card.getAttribute('data-color');
        startGame(pendingMode, color);
    });
});

document.getElementById('btn-restart').addEventListener('click', function(){
    if(currentMode) startGame(currentMode);
});
document.getElementById('btn-play-again').addEventListener('click', function(){
    hideModal('modal-gameover');
    if(currentMode) startGame(currentMode);
});
document.getElementById('btn-undo').addEventListener('click', function(){
    if(boardLocked) return;
    if(aiColor){
        game.undo();
        game.undo();
    } else {
        game.undo();
    }
    selectedSquare = null; legalTargets = [];
    lastMove = null;
    renderAll();
});

function startGame(mode, color){
    currentMode = mode;
    game = new Chess();
    selectedSquare = null; legalTargets = []; lastMove = null;
    boardLocked = false;

    if(mode === 'two-player'){
        aiColor = null;
        humanColor = null;
        boardFlipped = false;
    } else {
        humanColor = color === 'b' ? 'b' : 'w';
        aiColor = humanColor === 'w' ? 'b' : 'w';
        boardFlipped = (humanColor === 'b');
    }

    var tagText = MODE_LABELS[mode] || 'Mode';
    if(mode !== 'two-player'){
        tagText += ' \u00b7 Anda ' + (humanColor==='w' ? 'Putih' : 'Hitam');
    }
    document.getElementById('mode-tag').textContent = tagText;
    document.getElementById('thinking-indicator').classList.add('hidden');
    hideModal('modal-gameover');
    showScreen('screen-game');
    buildBoardSkeleton();
    renderAll();

    if(mode !== 'two-player' && aiColor === 'w'){
        scheduleAIMove();
    }
}

var PIECE_UNICODE = {
    w: { p:'\u2659', n:'\u2658', b:'\u2657', r:'\u2656', q:'\u2655', k:'\u2654' },
    b: { p:'\u265F', n:'\u265E', b:'\u265D', r:'\u265C', q:'\u265B', k:'\u265A' }
};
var FILES = ['a','b','c','d','e','f','g','h'];

function buildBoardSkeleton(){
    var boardEl = document.getElementById('board');
    boardEl.innerHTML = '';
    for(var r=0;r<8;r++){
        for(var c=0;c<8;c++){
            var file = boardFlipped ? FILES[7-c] : FILES[c];
            var rank = boardFlipped ? (r+1) : (8-r);
            var square = file + rank;
            var sq = document.createElement('div');
            sq.className = 'sq ' + (((r+c)%2===0) ? 'light':'dark');
            sq.setAttribute('data-square', square);
            if(c===0){
                var rankLabel = document.createElement('span');
                rankLabel.className='coord rank';
                rankLabel.textContent = rank;
                sq.appendChild(rankLabel);
            }
            if(r===7){
                var fileLabel = document.createElement('span');
                fileLabel.className='coord file';
                fileLabel.textContent = file;
                sq.appendChild(fileLabel);
            }
            sq.addEventListener('click', onSquareClick);
            boardEl.appendChild(sq);
        }
    }
}

function renderAll(){
    renderBoard();
    renderCaptured();
    renderTurn();
    renderMovesList();
    checkGameEnd();
}

function renderBoard(){
    var boardState = game.board();
    var kingInCheckSquare = null;
    if(game.in_check()){
        kingInCheckSquare = findKingSquare(game.turn());
    }

    document.querySelectorAll('.sq').forEach(function(sqEl){
        var square = sqEl.getAttribute('data-square');
        var file = square[0], rank = parseInt(square[1]);
        var row = 8-rank, col = FILES.indexOf(file);
        var piece = boardState[row][col];

        Array.prototype.slice.call(sqEl.querySelectorAll('.piece,.dot,.ring')).forEach(function(n){ n.remove(); });
        sqEl.classList.remove('selected','last-from','last-to','king-check');

        if(piece){
            var span = document.createElement('span');
            span.className = 'piece ' + (piece.color==='w'?'white':'black');
            span.textContent = PIECE_UNICODE[piece.color][piece.type];
            sqEl.appendChild(span);
        }

        if(selectedSquare === square) sqEl.classList.add('selected');
        if(lastMove && lastMove.from === square) sqEl.classList.add('last-from');
        if(lastMove && lastMove.to === square) sqEl.classList.add('last-to');
        if(kingInCheckSquare === square) sqEl.classList.add('king-check');

        var target = legalTargets.find(function(m){ return m.to === square; });
        if(target){
            var marker = document.createElement('div');
            marker.className = target.captured ? 'ring' : 'dot';
            sqEl.appendChild(marker);
        }
    });
}

function findKingSquare(color){
    var boardState = game.board();
    for(var r=0;r<8;r++){
        for(var c=0;c<8;c++){
            var p = boardState[r][c];
            if(p && p.type==='k' && p.color===color){
                return FILES[c] + (8-r);
            }
        }
    }
    return null;
}

function renderCaptured(){
    var history = game.history({verbose:true});
    var capturedByWhite = [];
var capturedByBlack = [];
history.forEach(function(m){
    if(m.captured){
        var symbol = PIECE_UNICODE[m.color==='w'?'b':'w'][m.captured];
        if(m.color==='w') capturedByWhite.push(symbol);
        else capturedByBlack.push(symbol);
    }
});
document.getElementById('captured-white').innerHTML = capturedByBlack.map(function(s){return '<span>'+s+'</span>';}).join('');
document.getElementById('captured-black').innerHTML = capturedByWhite.map(function(s){return '<span>'+s+'</span>';}).join('');
}

function renderTurn(){
    var turn = game.turn();
    var dot = document.getElementById('turn-dot');
    var text = document.getElementById('turn-text');
    dot.className = 'turn-dot ' + turn;
    var label = turn==='w' ? 'Putih' : 'Hitam';
    if(currentMode !== 'two-player'){
        label = (turn===aiColor) ? ('AI (' + (aiColor==='w'?'Putih':'Hitam') + ')') : 'Giliran Anda';
    } else {
        label = 'Giliran ' + label;
    }
    text.textContent = label;

    var status = document.getElementById('status-line');
    if(game.in_checkmate()){
        status.textContent = 'Skakmat!';
        status.className = 'status-line check';
    } else if(game.in_check()){
        status.textContent = 'Skak!';
        status.className = 'status-line check';
    } else if(game.in_stalemate()){
        status.textContent = 'Stalemate — remis.';
        status.className = 'status-line';
    } else if(game.in_draw()){
        status.textContent = 'Remis.';
        status.className = 'status-line';
    } else {
        status.textContent = '';
        status.className = 'status-line';
    }
}

function renderMovesList(){
    var history = game.history();
    var wrap = document.getElementById('moves-list');
    var html = '';
    for(var i=0;i<history.length;i+=2){
        var num = (i/2)+1;
        html += '<div class="mv-num">'+num+'.</div><div>'+history[i]+'</div><div>'+(history[i+1]||'')+'</div>';
    }
    wrap.innerHTML = html;
    wrap.scrollTop = wrap.scrollHeight;
}

function onSquareClick(e){
    if(boardLocked) return;
    var square = e.currentTarget.getAttribute('data-square');

    var target = legalTargets.find(function(m){ return m.to === square; });
    if(selectedSquare && target){
        attemptMove(selectedSquare, square, target);
        return;
    }

    var piece = game.get(square);
    if(piece && piece.color === game.turn() && isHumanTurn()){
        selectedSquare = square;
        legalTargets = game.moves({ square: square, verbose:true });
        renderBoard();
    } else {
        selectedSquare = null;
        legalTargets = [];
        renderBoard();
    }
}

function isHumanTurn(){
    if(currentMode === 'two-player') return true;
    return game.turn() !== aiColor;
}

function attemptMove(from, to, moveInfo){
    var needsPromotion = moveInfo.flags.indexOf('p') !== -1;
    if(needsPromotion){
        pendingPromotion = { from: from, to: to };
        showModal('modal-promotion');
        return;
    }
    doMove({ from: from, to: to });
}

function doMove(moveObj){
    var result = game.move(moveObj);
    if(!result) return;
    lastMove = { from: result.from, to: result.to };
    selectedSquare = null; legalTargets = [];
    renderAll();

    if(checkGameEnd()) return;

    if(currentMode !== 'two-player' && game.turn() === aiColor){
        scheduleAIMove();
    }
}

document.querySelectorAll('.promo-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
        var piece = btn.getAttribute('data-piece');
        hideModal('modal-promotion');
        if(pendingPromotion){
            doMove({ from: pendingPromotion.from, to: pendingPromotion.to, promotion: piece });
            pendingPromotion = null;
        }
    });
});

function checkGameEnd(){
    if(!game.game_over()) return false;
    var title, desc;
    if(game.in_checkmate()){
        var winner = game.turn()==='w' ? 'Hitam' : 'Putih';
        title = 'Skakmat!';
        desc = winner + ' menang. Papan telah bicara.';
    } else if(game.in_stalemate()){
        title = 'Stalemate';
        desc = 'Tidak ada langkah legal tersisa. Permainan remis.';
    } else if(game.in_threefold_repetition()){
        title = 'Remis';
        desc = 'Posisi berulang tiga kali. Permainan remis.';
    } else if(game.insufficient_material()){
        title = 'Remis';
        desc = 'Materi tidak cukup untuk skakmat. Permainan remis.';
    } else {
        title = 'Remis';
        desc = 'Permainan berakhir seri (aturan 50 langkah).';
    }
    document.getElementById('gameover-title').textContent = title;
    document.getElementById('gameover-desc').textContent = desc;
    showModal('modal-gameover');
    return true;
}

function showModal(id){ document.getElementById(id).classList.remove('hidden'); }
function hideModal(id){ document.getElementById(id).classList.add('hidden'); }

var PIECE_VALUE = { p:100, n:320, b:330, r:500, q:900, k:20000 };

var PST_P = [
    0,0,0,0,0,0,0,0,
    50,50,50,50,50,50,50,50,
    10,10,20,30,30,20,10,10,
    5,5,10,25,25,10,5,5,
    0,0,0,20,20,0,0,0,
    5,-5,-10,0,0,-10,-5,5,
    5,10,10,-20,-20,10,10,5,
    0,0,0,0,0,0,0,0
];
var PST_N = [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,0,0,0,0,-20,-40,
    -30,0,10,15,15,10,0,-30,
    -30,5,15,20,20,15,5,-30,
    -30,0,15,20,20,15,0,-30,
    -30,5,10,15,15,10,5,-30,
    -40,-20,0,5,5,0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50
];
var PST_B = [
    -20,-10,-10,-10,-10,-10,-10,-20,
    -10,0,0,0,0,0,0,-10,
    -10,0,5,10,10,5,0,-10,
    -10,5,5,10,10,5,5,-10,
    -10,0,10,10,10,10,0,-10,
    -10,10,10,10,10,10,10,-10,
    -10,5,0,0,0,0,5,-10,
    -20,-10,-10,-10,-10,-10,-10,-20
];
var PST_R = [
    0,0,0,0,0,0,0,0,
    5,10,10,10,10,10,10,5,
    -5,0,0,0,0,0,0,-5,
    -5,0,0,0,0,0,0,-5,
    -5,0,0,0,0,0,0,-5,
    -5,0,0,0,0,0,0,-5,
    -5,0,0,0,0,0,0,-5,
    0,0,0,5,5,0,0,0
];
var PST_Q = [
    -20,-10,-10,-5,-5,-10,-10,-20,
    -10,0,0,0,0,0,0,-10,
    -10,0,5,5,5,5,0,-10,
    -5,0,5,5,5,5,0,-5,
    0,0,5,5,5,5,0,-5,
    -10,5,5,5,5,5,0,-10,
    -10,0,5,0,0,0,0,-10,
    -20,-10,-10,-5,-5,-10,-10,-20
];
var PST_K = [
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -20,-30,-30,-40,-40,-30,-30,-20,
    -10,-20,-20,-20,-20,-20,-20,-10,
    20,20,0,0,0,0,20,20,
    20,30,10,0,0,10,30,20
];
var PST = { p:PST_P, n:PST_N, b:PST_B, r:PST_R, q:PST_Q, k:PST_K };

function squareIndexRC(r,c){ return r*8+c; }

function evaluateBoard(g){
    var boardState = g.board();
    var score = 0;
    for(var r=0;r<8;r++){
        for(var c=0;c<8;c++){
            var piece = boardState[r][c];
            if(!piece) continue;
            var idx = squareIndexRC(r,c);
            var pstIdx = piece.color==='w' ? idx : (idx ^ 56);
            var val = PIECE_VALUE[piece.type] + PST[piece.type][pstIdx];
            score += piece.color==='w' ? val : -val;
        }
    }
    return score;
}

function orderedMoves(g){
    var moves = g.moves({ verbose:true });
    moves.sort(function(a,b){
        var av = a.captured ? (PIECE_VALUE[a.captured]||0) : -1;
        var bv = b.captured ? (PIECE_VALUE[b.captured]||0) : -1;
        return bv - av;
    });
    return moves;
}

function minimax(g, depth, alpha, beta, maximizingWhite){
    if(depth===0 || g.game_over()){
        return evaluateBoard(g) + (Math.random()*2-1);
    }
    var moves = orderedMoves(g);
    if(maximizingWhite){
        var maxEval = -Infinity;
        for(var i=0;i<moves.length;i++){
            g.move(moves[i]);
            var ev = minimax(g, depth-1, alpha, beta, false);
            g.undo();
            if(ev>maxEval) maxEval = ev;
            if(ev>alpha) alpha = ev;
            if(beta<=alpha) break;
        }
        return maxEval;
    } else {
        var minEval = Infinity;
        for(var j=0;j<moves.length;j++){
            g.move(moves[j]);
            var ev2 = minimax(g, depth-1, alpha, beta, true);
            g.undo();
            if(ev2<minEval) minEval = ev2;
            if(ev2<beta) beta = ev2;
            if(beta<=alpha) break;
        }
        return minEval;
    }
}

function getBestMove(g, depth, colorToMove){
    var moves = orderedMoves(g);
    if(moves.length===0) return null;
    var bestMove = moves[0];
    if(colorToMove==='w'){
        var bestVal = -Infinity;
        for(var i=0;i<moves.length;i++){
            g.move(moves[i]);
            var val = minimax(g, depth-1, -Infinity, Infinity, false);
            g.undo();
            if(val>bestVal){ bestVal=val; bestMove=moves[i]; }
        }
    } else {
        var bestVal2 = Infinity;
        for(var j=0;j<moves.length;j++){
            g.move(moves[j]);
            var val2 = minimax(g, depth-1, -Infinity, Infinity, true);
            g.undo();
            if(val2<bestVal2){ bestVal2=val2; bestMove=moves[j]; }
        }
    }
    return bestMove;
}

function getEasyMove(g){
    var moves = g.moves({ verbose:true });
    if(moves.length===0) return null;
    var captures = moves.filter(function(m){ return m.captured; });
    if(captures.length>0 && Math.random()<0.35){
        return captures[Math.floor(Math.random()*captures.length)];
    }
    return moves[Math.floor(Math.random()*moves.length)];
}

function scheduleAIMove(){
    boardLocked = true;
    document.getElementById('thinking-indicator').classList.remove('hidden');
    setTimeout(function(){
        var move;
        if(currentMode === 'easy'){
            move = getEasyMove(game);
        } else {
            var depth = MODE_DEPTH[currentMode] || 2;
            move = getBestMove(game, depth, aiColor);
        }
        document.getElementById('thinking-indicator').classList.add('hidden');
        boardLocked = false;
        if(move){
            var result = game.move({ from: move.from, to: move.to, promotion: move.promotion || 'q' });
            if(result){
                lastMove = { from: result.from, to: result.to };
            }
        }
        renderAll();
        checkGameEnd();
    }, 260);
}

})();
