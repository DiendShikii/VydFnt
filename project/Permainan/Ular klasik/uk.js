(function () {
    "use strict";

    const COLS = 20;
    const ROWS = 20;
    const START_LENGTH = 3;
    const BASE_SPEED_MS = 140;
    const MIN_SPEED_MS = 70;
    const SPEED_STEP = 3;
    const HS_KEY = "vydfnt_snake_highscore";

    const startScreen = document.getElementById("start-screen");
    const gameScreen = document.getElementById("game-screen");
    const overScreen = document.getElementById("gameover-screen");
    const canvas = document.getElementById("board");
    const ctx = canvas.getContext("2d");
    const scoreEl = document.getElementById("score");
    const hsEl = document.getElementById("highscore");
    const hsStartEl = document.getElementById("highscore-start");
    const finalScoreEl = document.getElementById("final-score");
    const finalHsEl = document.getElementById("final-highscore");
    const newBadge = document.getElementById("new-badge");
    const btnStart = document.getElementById("btn-start");
    const btnRestart = document.getElementById("btn-restart");
    const btnMenu = document.getElementById("btn-menu");
    const pauseHint = document.getElementById("pause-hint");
    const btnPause = document.getElementById("btn-pause");
    const btnResume = document.getElementById("btn-resume");

    let cellSize = 0;
    let snake = [];
    let dir = { x: 1, y: 0 };
    let queuedDir = { x: 1, y: 0 };
    let food = { x: 0, y: 0 };
    let score = 0;
    let highScore = Number(localStorage.getItem(HS_KEY)) || 0;
    let speed = BASE_SPEED_MS;
    let acc = 0;
    let lastTime = 0;
    let running = false;
    let paused = false;
    let rafId = null;

    hsStartEl.textContent = highScore;
    hsEl.textContent = highScore;

    function resizeCanvas() {
        const wrap = canvas.parentElement;
        const size = Math.min(wrap.clientWidth, wrap.clientHeight);
        const dpr = window.devicePixelRatio || 1;
        canvas.style.width = size + "px";
        canvas.style.height = size + "px";
        canvas.width = Math.floor(size * dpr);
        canvas.height = Math.floor(size * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        cellSize = size / COLS;
        if (running) draw();
    }
    window.addEventListener("resize", resizeCanvas);

    function resetGame() {
        const midX = Math.floor(COLS / 2);
        const midY = Math.floor(ROWS / 2);
        snake = [];
        for (let i = 0; i < START_LENGTH; i++) {
            snake.push({ x: midX - i, y: midY });
        }
        dir = { x: 1, y: 0 };
        queuedDir = { x: 1, y: 0 };
        score = 0;
        speed = BASE_SPEED_MS;
        acc = 0;
        scoreEl.textContent = "0";
        placeFood();
    }

    function placeFood() {
        let candidate;
        let attempts = 0;
        do {
            candidate = {
                x: Math.floor(Math.random() * COLS),
 y: Math.floor(Math.random() * ROWS),
            };
            attempts++;
        } while (
            snake.some((s) => s.x === candidate.x && s.y === candidate.y) &&
            attempts < 500
        );
        food = candidate;
    }

    function setDirection(nx, ny) {
        if (snake.length > 1 && dir.x === -nx && dir.y === -ny) return;
        queuedDir = { x: nx, y: ny };
    }

    window.addEventListener("keydown", (e) => {
        const k = e.key.toLowerCase();
        if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", " "].includes(k)) {
            e.preventDefault();
        }
        if (k === " " || k === "p") {
            if (running) togglePause();
            return;
        }
        if (!running || paused) return;
        if (k === "arrowup" || k === "w") setDirection(0, -1);
        else if (k === "arrowdown" || k === "s") setDirection(0, 1);
        else if (k === "arrowleft" || k === "a") setDirection(-1, 0);
        else if (k === "arrowright" || k === "d") setDirection(1, 0);
    });

        function togglePause() {
            if (!running) return;
            paused = !paused;
            pauseHint.classList.toggle("hidden", !paused);
            btnPause.textContent = paused ? "►" : "❙❙";
            btnPause.title = paused ? "Lanjut" : "Pause";
            if (!paused) lastTime = performance.now();
        }

        btnPause.addEventListener("click", togglePause);
        btnResume.addEventListener("click", (e) => {
            e.stopPropagation();
            togglePause();
        });

        let touchStartX = 0;
        let touchStartY = 0;

        canvas.addEventListener(
            "touchstart",
            (e) => {
                const t = e.changedTouches[0];
                touchStartX = t.clientX;
                touchStartY = t.clientY;
            },
            { passive: true }
        );

        canvas.addEventListener(
            "touchend",
            (e) => {
                if (!running || paused) return;
                const t = e.changedTouches[0];
                const dx = t.clientX - touchStartX;
                const dy = t.clientY - touchStartY;
                const dist = Math.hypot(dx, dy);
                const SWIPE_THRESHOLD = 24;

                if (dist > SWIPE_THRESHOLD) {
                    if (Math.abs(dx) > Math.abs(dy)) {
                        setDirection(dx > 0 ? 1 : -1, 0);
                    } else {
                        setDirection(0, dy > 0 ? 1 : -1);
                    }
                } else {
                    const rect = canvas.getBoundingClientRect();
                    const cx = rect.left + rect.width / 2;
                    const cy = rect.top + rect.height / 2;
                    const rx = t.clientX - cx;
                    const ry = t.clientY - cy;
                    if (Math.abs(rx) > Math.abs(ry)) {
                        setDirection(rx > 0 ? 1 : -1, 0);
                    } else {
                        setDirection(0, ry > 0 ? 1 : -1);
                    }
                }
            },
            { passive: true }
        );

        function update() {
            dir = queuedDir;
            const head = snake[0];
            const newHead = { x: head.x + dir.x, y: head.y + dir.y };

            if (newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS) {
                return gameOver();
            }
            if (snake.some((s) => s.x === newHead.x && s.y === newHead.y)) {
                return gameOver();
            }

            snake.unshift(newHead);

            if (newHead.x === food.x && newHead.y === food.y) {
                score += 10;
                scoreEl.textContent = String(score);
                speed = Math.max(MIN_SPEED_MS, BASE_SPEED_MS - Math.floor(score / 10) * SPEED_STEP);
                placeFood();
            } else {
                snake.pop();
            }
        }

        function draw() {
            const size = COLS * cellSize;
            ctx.clearRect(0, 0, size, size);

            ctx.strokeStyle = "rgba(255,255,255,0.035)";
            ctx.lineWidth = 1;
            for (let i = 1; i < COLS; i++) {
                ctx.beginPath();
                ctx.moveTo(i * cellSize, 0);
                ctx.lineTo(i * cellSize, size);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, i * cellSize);
                ctx.lineTo(size, i * cellSize);
                ctx.stroke();
            }

            const fx = food.x * cellSize + cellSize / 2;
            const fy = food.y * cellSize + cellSize / 2;
            const pulse = 1 + 0.12 * Math.sin(Date.now() / 180);
            ctx.save();
            ctx.shadowColor = "#ff2e97";
            ctx.shadowBlur = 16;
            ctx.fillStyle = "#ff2e97";
            ctx.beginPath();
            ctx.arc(fx, fy, (cellSize / 2.6) * pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            snake.forEach((seg, i) => {
                const isHead = i === 0;
                const px = seg.x * cellSize;
                const py = seg.y * cellSize;
                const pad = isHead ? 1 : 2;
                ctx.save();
                ctx.shadowColor = isHead ? "#7dffce" : "#0aff9d";
                ctx.shadowBlur = isHead ? 14 : 6;
                ctx.fillStyle = isHead ? "#7dffce" : "#0aff9d";
                const r = 5;
                const x = px + pad;
                const y = py + pad;
                const w = cellSize - pad * 2;
                const h = cellSize - pad * 2;
                roundRect(ctx, x, y, w, h, r);
                ctx.fill();
                ctx.restore();
            });
        }

        function roundRect(c, x, y, w, h, r) {
            c.beginPath();
            c.moveTo(x + r, y);
            c.arcTo(x + w, y, x + w, y + h, r);
            c.arcTo(x + w, y + h, x, y + h, r);
            c.arcTo(x, y + h, x, y, r);
            c.arcTo(x, y, x + w, y, r);
            c.closePath();
        }

        function loop(time) {
            if (!running) return;
            if (!paused) {
                const dt = time - lastTime;
                lastTime = time;
                acc += dt;
                if (acc >= speed) {
                    acc = 0;
                    update();
                }
                draw();
            } else {
                lastTime = time;
            }
            rafId = requestAnimationFrame(loop);
        }

        function gameOver() {
            running = false;
            if (rafId) cancelAnimationFrame(rafId);

            let isNew = false;
            if (score > highScore) {
                highScore = score;
                localStorage.setItem(HS_KEY, String(highScore));
                isNew = true;
            }

            finalScoreEl.textContent = String(score);
            finalHsEl.textContent = String(highScore);
            newBadge.classList.toggle("hidden", !isNew);
            hsEl.textContent = String(highScore);
            hsStartEl.textContent = String(highScore);

            gameScreen.classList.remove("active");
            overScreen.classList.add("active");
        }

        function startGame() {
            resetGame();
            startScreen.classList.remove("active");
            overScreen.classList.remove("active");
            gameScreen.classList.add("active");
            resizeCanvas();
            running = true;
            paused = false;
            pauseHint.classList.add("hidden");
            btnPause.textContent = "❙❙";
            btnPause.title = "Pause";
            lastTime = performance.now();
            acc = 0;
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(loop);
        }

        document.addEventListener("visibilitychange", () => {
            if (document.hidden && running && !paused) {
                paused = true;
                pauseHint.classList.remove("hidden");
                btnPause.textContent = "►";
                btnPause.title = "Lanjut";
            }
        });

        btnStart.addEventListener("click", startGame);
        btnRestart.addEventListener("click", startGame);
        btnMenu.addEventListener("click", () => {
            overScreen.classList.remove("active");
            startScreen.classList.add("active");
        });

        resizeCanvas();
})();
