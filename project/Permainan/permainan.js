(function () {
    const board = document.getElementById('previewChess');
    const piecesTop    = ['♜','♞','♝','♛','♚','♝','♞','♜'];
    const piecesBottom = ['♖','♘','♗','♕','♔','♗','♘','♖'];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const cell = document.createElement('div');
            cell.className = (r + c) % 2 === 0 ? 'light' : 'dark';
            if (r === 0) { cell.classList.add('piece','black-p'); cell.textContent = piecesTop[c]; }
            else if (r === 1) { cell.classList.add('piece','black-p'); cell.textContent = '♟'; }
            else if (r === 6) { cell.classList.add('piece','white-p'); cell.textContent = '♙'; }
            else if (r === 7) { cell.classList.add('piece','white-p'); cell.textContent = piecesBottom[c]; }
            board.appendChild(cell);
        }
    }
})();

(function () {
    const board = document.getElementById('previewSudoku');
    const sample = [
        [5,3,0,0,7,0,0,0,0],
        [6,0,0,1,9,5,0,0,0],
        [0,9,8,0,0,0,0,6,0],
        [8,0,0,0,6,0,0,0,3],
        [4,0,0,8,0,3,0,0,1],
        [7,0,0,0,2,0,0,0,6],
        [0,6,0,0,0,0,2,8,0],
        [0,0,0,4,1,9,0,0,5],
        [0,0,0,0,8,0,0,7,9]
    ];
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const cell = document.createElement('div');
            if (c === 2 || c === 5) cell.classList.add('thick-r');
            if (r === 2 || r === 5) cell.classList.add('thick-b');
            if (sample[r][c] !== 0) { cell.classList.add('filled'); cell.textContent = sample[r][c]; }
            board.appendChild(cell);
        }
    }
})();

(function () {
    const board = document.getElementById('previewSnake');
    const COLS = 12, ROWS = 12;
    const snakeBody = [
        { r: 6, c: 2 },
        { r: 6, c: 3 },
        { r: 6, c: 4 },
        { r: 6, c: 5 },
        { r: 7, c: 5 },
        { r: 8, c: 5 },
        { r: 8, c: 6 },
    ];
    const food = { r: 3, c: 9 };
    const cells = [];
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = document.createElement('div');
            cells.push(cell);
            board.appendChild(cell);
        }
    }
    snakeBody.forEach((pos, i) => {
        const idx = pos.r * COLS + pos.c;
        cells[idx].classList.add(i === 0 ? 'sn-head' : 'sn-body');
    });
    cells[food.r * COLS + food.c].classList.add('sn-food');
})();
