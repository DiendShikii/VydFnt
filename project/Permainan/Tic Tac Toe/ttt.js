(function () {
    "use strict";

    const screens = {
        start: document.getElementById('screen-start'),
 mode: document.getElementById('screen-mode'),
 game: document.getElementById('screen-game'),
    };

    function showScreen(name) {
        Object.values(screens).forEach(s => s.classList.remove('active'));
        screens[name].classList.add('active');
    }

    document.getElementById('btn-start').addEventListener('click', () => showScreen('mode'));
    document.getElementById('btn-back-1').addEventListener('click', () => showScreen('start'));
    document.getElementById('btn-back-2').addEventListener('click', () => showScreen('mode'));

    const WIN_LINES = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6],
    ];

    const MODE_LABELS = {
        easy: 'Easy',
        medium: 'Medium',
        hard: 'Hard',
        duo: '2 Pemain',
    };

    let board = Array(9).fill(null);
    let mode = 'easy';
    const human = 'X';
    const ai = 'O';
    let current = 'X';
    let gameOver = false;
    let scores = { X: 0, O: 0, D: 0 };

    const boardEl = document.getElementById('board');
    const turnEl = document.getElementById('turn-indicator');
    const modeBadge = document.getElementById('mode-badge');
    const scoreXEl = document.getElementById('score-x');
    const scoreOEl = document.getElementById('score-o');
    const scoreDEl = document.getElementById('score-d');

    function isDuoMode() {
        return mode === 'duo';
    }

    function buildBoard() {
        boardEl.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            const btn = document.createElement('button');
            btn.className = 'cell';
            btn.setAttribute('data-index', i);
            btn.addEventListener('click', onCellClick);
            boardEl.appendChild(btn);
        }
    }

    function markSVG(mark) {
        if (mark === 'X') {
            return `<svg viewBox="0 0 100 100">
            <path class="stroke" pathLength="1" d="M22,22 L78,78" stroke="var(--x-color)"/>
            <path class="stroke" pathLength="1" d="M78,22 L22,78" stroke="var(--x-color)" style="animation-delay:.12s"/>
            </svg>`;
        }
        return `<svg viewBox="0 0 100 100">
        <circle class="stroke" pathLength="1" cx="50" cy="50" r="32" stroke="var(--o-color)"/>
        </svg>`;
    }

    function startGame(selectedMode) {
        mode = selectedMode;
        modeBadge.textContent = MODE_LABELS[mode];
        board = Array(9).fill(null);
        current = 'X';
        gameOver = false;
        buildBoard();
        updateTurnLabel();
        showScreen('game');
    }

    document.querySelectorAll('.mode-card').forEach(card => {
        card.addEventListener('click', () => startGame(card.getAttribute('data-mode')));
    });

    document.getElementById('btn-restart').addEventListener('click', () => {
        board = Array(9).fill(null);
        current = 'X';
        gameOver = false;
        buildBoard();
        updateTurnLabel();
    });

    function updateTurnLabel() {
        if (gameOver) return;

        if (isDuoMode()) {
            turnEl.textContent = `Giliran pemain ${current}`;
            return;
        }

        turnEl.textContent = current === human ? 'Giliranmu (X)' : 'Giliran lawan (O)...';
    }

    function onCellClick(e) {
        const idx = parseInt(e.currentTarget.getAttribute('data-index'), 10);
        if (gameOver || board[idx]) return;

        if (isDuoMode()) {
            placeMark(idx, current);
            if (checkEnd()) return;
            current = current === 'X' ? 'O' : 'X';
            updateTurnLabel();
            return;
        }

        if (current !== human) return;
        placeMark(idx, human);
        if (checkEnd()) return;
        current = ai;
        updateTurnLabel();
        setTimeout(aiMove, 420);
    }

    function placeMark(idx, mark) {
        board[idx] = mark;
        const cell = boardEl.children[idx];
        cell.classList.add('filled');
        cell.innerHTML = markSVG(mark);
    }

    function emptyIndices(b) {
        const out = [];
        for (let i = 0; i < 9; i++) if (!b[i]) out.push(i);
        return out;
    }

    function checkWin(b, mark) {
        return WIN_LINES.some(line => line.every(i => b[i] === mark));
    }

    function getWinLine(b, mark) {
        return WIN_LINES.find(line => line.every(i => b[i] === mark));
    }

    function checkEnd() {
        if (checkWin(board, 'X')) {
            endGame('X');
            return true;
        }
        if (checkWin(board, 'O')) {
            endGame('O');
            return true;
        }
        if (emptyIndices(board).length === 0) {
            endGame(null);
            return true;
        }
        return false;
    }

    function endGame(winner) {
        gameOver = true;

        if (winner) {
            const line = getWinLine(board, winner);
            line.forEach(i => boardEl.children[i].classList.add('win'));
            scores[winner]++;

            if (isDuoMode()) {
                turnEl.textContent = `Pemain ${winner} menang! 🎉`;
            } else {
                turnEl.textContent = winner === human ? 'Kamu menang! 🎉' : 'Lawan menang. Coba lagi!';
            }
        } else {
            scores.D++;
            turnEl.textContent = 'Seri! Papan penuh.';
        }

        scoreXEl.textContent = scores.X;
        scoreOEl.textContent = scores.O;
        scoreDEl.textContent = scores.D;
    }

    function aiMove() {
        if (gameOver) return;
        const empties = emptyIndices(board);
        let choice;

        if (mode === 'easy') {
            choice = empties[Math.floor(Math.random() * empties.length)];
        } else if (mode === 'medium') {
            choice = Math.random() < 0.5 ? bestMove() : empties[Math.floor(Math.random() * empties.length)];
        } else {
            choice = bestMove();
        }

        placeMark(choice, ai);
        if (checkEnd()) return;
        current = human;
        updateTurnLabel();
    }

    function bestMove() {
        const result = minimax(board.slice(), ai);
        return result.index;
    }

    function minimax(b, player) {
        const empties = emptyIndices(b);

        if (checkWin(b, human)) return { score: -10 };
        if (checkWin(b, ai)) return { score: 10 };
        if (empties.length === 0) return { score: 0 };

        const moves = [];
        for (const i of empties) {
            const move = { index: i };
            b[i] = player;
            const result = minimax(b, player === ai ? human : ai);
            move.score = result.score;
            b[i] = null;
            moves.push(move);
        }

        let bestM;
        if (player === ai) {
            let bestScore = -Infinity;
            for (const m of moves) if (m.score > bestScore) { bestScore = m.score; bestM = m; }
        } else {
            let bestScore = Infinity;
            for (const m of moves) if (m.score < bestScore) { bestScore = m.score; bestM = m; }
        }
        return bestM;
    }

    buildBoard();
})();
