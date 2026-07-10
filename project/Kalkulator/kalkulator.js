(function () {
    const wrap = document.getElementById('previewKalkulator');
    if (!wrap) return;

    const screen = document.createElement('div');
    screen.className = 'pk-screen';
    screen.textContent = '482';
    wrap.appendChild(screen);

    const keys = document.createElement('div');
    keys.className = 'pk-keys';
    const keyLabels = ['7','8','9','÷','4','5','6','×','1','2','3','−','0','.','=','+'];
    const opKeys = ['÷','×','−','+','='];
    keyLabels.forEach(label => {
        const key = document.createElement('div');
        key.textContent = label;
        if (opKeys.includes(label)) key.classList.add('pk-op');
        keys.appendChild(key);
    });
    wrap.appendChild(keys);
})();

(function () {
    const wrap = document.getElementById('previewBarisan');
    if (!wrap) return;

    // Barisan aritmatika sederhana: 2, 5, 8, 11, 14, ...
    const terms = ['2', '5', '8', '11', '14', '...'];
    terms.forEach((term, i) => {
        if (i > 0) {
            const arrow = document.createElement('div');
            arrow.className = 'bs-arrow';
            wrap.appendChild(arrow);
        }
        const dot = document.createElement('div');
        dot.className = 'bs-dot' + (term === '...' ? ' bs-last' : '');
        dot.textContent = term;
        wrap.appendChild(dot);
    });
})();
