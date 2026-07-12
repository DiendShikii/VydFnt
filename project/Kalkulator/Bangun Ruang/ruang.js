const PI = Math.PI;

function fmt(n, decimals = 3) {
    if (n === null || n === undefined || !isFinite(n)) return '—';
    const rounded = Number(n.toFixed(decimals));
    return rounded.toLocaleString('id-ID', { maximumFractionDigits: decimals });
}
function unitLabel(power, base) {
    if (power === 1) return base;
    if (power === 2) return base + '²';
    if (power === 3) return base + '³';
    return base;
}
function solveQuadraticPositive(a, b, c) {
    const disc = b * b - 4 * a * c;
    if (disc < 0) return null;
    const r1 = (-b + Math.sqrt(disc)) / (2 * a);
    const r2 = (-b - Math.sqrt(disc)) / (2 * a);
    const candidates = [r1, r2].filter((v) => v > 0 && isFinite(v));
    if (!candidates.length) return null;
    return Math.min(...candidates);
}

const ICONS = {
    kubus: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round"><path d="M20 32 L50 18 L80 32 L80 68 L50 82 L20 68 Z"/><path d="M20 32 L50 46 L80 32"/><path d="M50 46 L50 82"/></svg>`,
    balok: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round"><path d="M12 38 L46 26 L88 38 L88 66 L46 78 L12 66 Z"/><path d="M12 38 L46 50 L88 38"/><path d="M46 50 L46 78"/></svg>`,
    prisma: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"><path d="M50 14 L86 34 L86 70 L50 90 L14 70 L14 34 Z" opacity="0"/><path d="M28 78 L50 66 L72 78"/><path d="M28 78 L28 38 L50 26 L50 66"/><path d="M50 26 L72 38 L72 78"/><path d="M28 38 L50 50 L72 38"/><path d="M50 50 L50 66"/></svg>`,
    limas: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"><path d="M50 12 L84 66 L50 82 L16 66 Z"/><path d="M50 12 L16 66"/><path d="M50 12 L50 82"/></svg>`,
    kerucut: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"><ellipse cx="50" cy="74" rx="34" ry="12"/><path d="M16 74 L50 14 L84 74"/></svg>`,
    tabung: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"><ellipse cx="50" cy="24" rx="32" ry="11"/><path d="M18 24 L18 76"/><path d="M82 24 L82 76"/><path d="M18 76 Q50 90 82 76"/></svg>`,
    bola: `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"><circle cx="50" cy="50" r="36"/><ellipse cx="50" cy="50" rx="15" ry="36"/><path d="M14 50 Q50 66 86 50"/></svg>`
};

const SHAPES = {
    kubus: {
        label: 'Kubus', accent: ['#8b5cf6', '#4f46e5', '#22d3ee'], desc: 'Enam sisi persegi kongruen',
        groups: {
            volume: { label: 'Volume', power: 3, targets: [
                { id: 'V', pill: 'Volume (dari Sisi)', resultLabel: 'Volume', power: 3,
                    inputs: [{ key: 's', label: 'Sisi (s)', power: 1 }],
                    calc: ({ s }) => s ** 3,
                    steps: ({ s }, r) => [`V = s³`, `V = ${fmt(s)}³`, `V = ${fmt(r)}`] },
                    { id: 's', pill: 'Sisi (dari Volume)', resultLabel: 'Sisi (s)', power: 1,
                        inputs: [{ key: 'V', label: 'Volume (V)', power: 3 }],
                        calc: ({ V }) => Math.cbrt(V),
                        steps: ({ V }, r) => [`s = ³√V`, `s = ³√${fmt(V)}`, `s = ${fmt(r)}`] }
            ]},
            luas: { label: 'Luas Permukaan', power: 2, targets: [
                { id: 'LP', pill: 'Luas Permukaan (dari Sisi)', resultLabel: 'Luas Permukaan', power: 2,
                    inputs: [{ key: 's', label: 'Sisi (s)', power: 1 }],
                    calc: ({ s }) => 6 * s ** 2,
                    steps: ({ s }, r) => [`LP = 6s²`, `LP = 6 × ${fmt(s)}²`, `LP = ${fmt(r)}`] },
                    { id: 's', pill: 'Sisi (dari Luas Permukaan)', resultLabel: 'Sisi (s)', power: 1,
                        inputs: [{ key: 'LP', label: 'Luas Permukaan (LP)', power: 2 }],
                        calc: ({ LP }) => Math.sqrt(LP / 6),
                        steps: ({ LP }, r) => [`s = √(LP / 6)`, `s = √(${fmt(LP)} / 6)`, `s = ${fmt(r)}`] }
            ]}
        }
    },

    balok: {
        label: 'Balok', accent: ['#22d3ee', '#2563eb', '#8b5cf6'], desc: 'Panjang, lebar, tinggi berbeda',
        groups: {
            volume: { label: 'Volume', power: 3, targets: [
                { id: 'V', pill: 'Volume (dari p, l, t)', resultLabel: 'Volume', power: 3,
                    inputs: [{ key: 'p', label: 'Panjang (p)', power: 1 }, { key: 'l', label: 'Lebar (l)', power: 1 }, { key: 't', label: 'Tinggi (t)', power: 1 }],
                    calc: ({ p, l, t }) => p * l * t,
                    steps: ({ p, l, t }, r) => [`V = p × l × t`, `V = ${fmt(p)} × ${fmt(l)} × ${fmt(t)}`, `V = ${fmt(r)}`] },
                    { id: 'p', pill: 'Panjang (dari Volume)', resultLabel: 'Panjang (p)', power: 1,
                        inputs: [{ key: 'l', label: 'Lebar (l)', power: 1 }, { key: 't', label: 'Tinggi (t)', power: 1 }, { key: 'V', label: 'Volume (V)', power: 3 }],
                        calc: ({ l, t, V }) => V / (l * t),
                        steps: ({ l, t, V }, r) => [`p = V / (l × t)`, `p = ${fmt(V)} / (${fmt(l)} × ${fmt(t)})`, `p = ${fmt(r)}`] },
                        { id: 'l', pill: 'Lebar (dari Volume)', resultLabel: 'Lebar (l)', power: 1,
                            inputs: [{ key: 'p', label: 'Panjang (p)', power: 1 }, { key: 't', label: 'Tinggi (t)', power: 1 }, { key: 'V', label: 'Volume (V)', power: 3 }],
                            calc: ({ p, t, V }) => V / (p * t),
                            steps: ({ p, t, V }, r) => [`l = V / (p × t)`, `l = ${fmt(V)} / (${fmt(p)} × ${fmt(t)})`, `l = ${fmt(r)}`] },
                            { id: 't', pill: 'Tinggi (dari Volume)', resultLabel: 'Tinggi (t)', power: 1,
                                inputs: [{ key: 'p', label: 'Panjang (p)', power: 1 }, { key: 'l', label: 'Lebar (l)', power: 1 }, { key: 'V', label: 'Volume (V)', power: 3 }],
                                calc: ({ p, l, V }) => V / (p * l),
                                steps: ({ p, l, V }, r) => [`t = V / (p × l)`, `t = ${fmt(V)} / (${fmt(p)} × ${fmt(l)})`, `t = ${fmt(r)}`] }
            ]},
            luas: { label: 'Luas Permukaan', power: 2, targets: [
                { id: 'LP', pill: 'Luas Permukaan (dari p, l, t)', resultLabel: 'Luas Permukaan', power: 2,
                    inputs: [{ key: 'p', label: 'Panjang (p)', power: 1 }, { key: 'l', label: 'Lebar (l)', power: 1 }, { key: 't', label: 'Tinggi (t)', power: 1 }],
                    calc: ({ p, l, t }) => 2 * (p * l + p * t + l * t),
                    steps: ({ p, l, t }, r) => [`LP = 2(pl + pt + lt)`, `LP = 2(${fmt(p*l)} + ${fmt(p*t)} + ${fmt(l*t)})`, `LP = ${fmt(r)}`] },
                    { id: 'p', pill: 'Panjang (dari Luas)', resultLabel: 'Panjang (p)', power: 1,
                        inputs: [{ key: 'l', label: 'Lebar (l)', power: 1 }, { key: 't', label: 'Tinggi (t)', power: 1 }, { key: 'LP', label: 'Luas Permukaan (LP)', power: 2 }],
                        calc: ({ l, t, LP }) => (LP - 2 * l * t) / (2 * (l + t)),
                        steps: ({ l, t, LP }, r) => [`p = (LP − 2lt) / (2(l + t))`, `p = (${fmt(LP)} − ${fmt(2*l*t)}) / (2 × ${fmt(l+t)})`, `p = ${fmt(r)}`] },
                        { id: 'l', pill: 'Lebar (dari Luas)', resultLabel: 'Lebar (l)', power: 1,
                            inputs: [{ key: 'p', label: 'Panjang (p)', power: 1 }, { key: 't', label: 'Tinggi (t)', power: 1 }, { key: 'LP', label: 'Luas Permukaan (LP)', power: 2 }],
                            calc: ({ p, t, LP }) => (LP - 2 * p * t) / (2 * (p + t)),
                            steps: ({ p, t, LP }, r) => [`l = (LP − 2pt) / (2(p + t))`, `l = (${fmt(LP)} − ${fmt(2*p*t)}) / (2 × ${fmt(p+t)})`, `l = ${fmt(r)}`] },
                            { id: 't', pill: 'Tinggi (dari Luas)', resultLabel: 'Tinggi (t)', power: 1,
                                inputs: [{ key: 'p', label: 'Panjang (p)', power: 1 }, { key: 'l', label: 'Lebar (l)', power: 1 }, { key: 'LP', label: 'Luas Permukaan (LP)', power: 2 }],
                                calc: ({ p, l, LP }) => (LP - 2 * p * l) / (2 * (p + l)),
                                steps: ({ p, l, LP }, r) => [`t = (LP − 2pl) / (2(p + l))`, `t = (${fmt(LP)} − ${fmt(2*p*l)}) / (2 × ${fmt(p+l)})`, `t = ${fmt(r)}`] }
            ]}
        }
    },

    prisma: {
        label: 'Prisma', accent: ['#34d399', '#0d9488', '#22d3ee'], desc: 'Luas alas × tinggi (alas bebas)',
        groups: {
            volume: { label: 'Volume', power: 3, targets: [
                { id: 'V', pill: 'Volume (dari La, t)', resultLabel: 'Volume', power: 3,
                    inputs: [{ key: 'La', label: 'Luas Alas (La)', power: 2 }, { key: 't', label: 'Tinggi (t)', power: 1 }],
                    calc: ({ La, t }) => La * t,
                    steps: ({ La, t }, r) => [`V = La × t`, `V = ${fmt(La)} × ${fmt(t)}`, `V = ${fmt(r)}`] },
                    { id: 'La', pill: 'Luas Alas (dari Volume)', resultLabel: 'Luas Alas (La)', power: 2,
                        inputs: [{ key: 'V', label: 'Volume (V)', power: 3 }, { key: 't', label: 'Tinggi (t)', power: 1 }],
                        calc: ({ V, t }) => V / t,
                        steps: ({ V, t }, r) => [`La = V / t`, `La = ${fmt(V)} / ${fmt(t)}`, `La = ${fmt(r)}`] },
                        { id: 't', pill: 'Tinggi (dari Volume)', resultLabel: 'Tinggi (t)', power: 1,
                            inputs: [{ key: 'V', label: 'Volume (V)', power: 3 }, { key: 'La', label: 'Luas Alas (La)', power: 2 }],
                            calc: ({ V, La }) => V / La,
                            steps: ({ V, La }, r) => [`t = V / La`, `t = ${fmt(V)} / ${fmt(La)}`, `t = ${fmt(r)}`] }
            ]},
            luas: { label: 'Luas Permukaan', power: 2, targets: [
                { id: 'LP', pill: 'Luas Permukaan (dari La, Ka, t)', resultLabel: 'Luas Permukaan', power: 2,
                    inputs: [{ key: 'La', label: 'Luas Alas (La)', power: 2 }, { key: 'Ka', label: 'Keliling Alas (Ka)', power: 1 }, { key: 't', label: 'Tinggi (t)', power: 1 }],
                    calc: ({ La, Ka, t }) => 2 * La + Ka * t,
                    steps: ({ La, Ka, t }, r) => [`LP = 2La + Ka·t`, `LP = 2×${fmt(La)} + ${fmt(Ka)}×${fmt(t)}`, `LP = ${fmt(r)}`] },
                    { id: 'La', pill: 'Luas Alas (dari Luas Permukaan)', resultLabel: 'Luas Alas (La)', power: 2,
                        inputs: [{ key: 'LP', label: 'Luas Permukaan (LP)', power: 2 }, { key: 'Ka', label: 'Keliling Alas (Ka)', power: 1 }, { key: 't', label: 'Tinggi (t)', power: 1 }],
                        calc: ({ LP, Ka, t }) => (LP - Ka * t) / 2,
                        steps: ({ LP, Ka, t }, r) => [`La = (LP − Ka·t) / 2`, `La = (${fmt(LP)} − ${fmt(Ka*t)}) / 2`, `La = ${fmt(r)}`] },
                        { id: 'Ka', pill: 'Keliling Alas (dari Luas Permukaan)', resultLabel: 'Keliling Alas (Ka)', power: 1,
                            inputs: [{ key: 'LP', label: 'Luas Permukaan (LP)', power: 2 }, { key: 'La', label: 'Luas Alas (La)', power: 2 }, { key: 't', label: 'Tinggi (t)', power: 1 }],
                            calc: ({ LP, La, t }) => (LP - 2 * La) / t,
                            steps: ({ LP, La, t }, r) => [`Ka = (LP − 2La) / t`, `Ka = (${fmt(LP)} − ${fmt(2*La)}) / ${fmt(t)}`, `Ka = ${fmt(r)}`] },
                            { id: 't', pill: 'Tinggi (dari Luas Permukaan)', resultLabel: 'Tinggi (t)', power: 1,
                                inputs: [{ key: 'LP', label: 'Luas Permukaan (LP)', power: 2 }, { key: 'La', label: 'Luas Alas (La)', power: 2 }, { key: 'Ka', label: 'Keliling Alas (Ka)', power: 1 }],
                                calc: ({ LP, La, Ka }) => (LP - 2 * La) / Ka,
                                steps: ({ LP, La, Ka }, r) => [`t = (LP − 2La) / Ka`, `t = (${fmt(LP)} − ${fmt(2*La)}) / ${fmt(Ka)}`, `t = ${fmt(r)}`] }
            ]}
        }
    },

    limas: {
        label: 'Limas', accent: ['#fbbf24', '#f97316', '#ec4899'], desc: '⅓ × luas alas × tinggi (alas bebas)',
        groups: {
            volume: { label: 'Volume', power: 3, targets: [
                { id: 'V', pill: 'Volume (dari La, t)', resultLabel: 'Volume', power: 3,
                    inputs: [{ key: 'La', label: 'Luas Alas (La)', power: 2 }, { key: 't', label: 'Tinggi (t)', power: 1 }],
                    calc: ({ La, t }) => (1 / 3) * La * t,
                    steps: ({ La, t }, r) => [`V = ⅓ × La × t`, `V = ⅓ × ${fmt(La)} × ${fmt(t)}`, `V = ${fmt(r)}`] },
                    { id: 'La', pill: 'Luas Alas (dari Volume)', resultLabel: 'Luas Alas (La)', power: 2,
                        inputs: [{ key: 'V', label: 'Volume (V)', power: 3 }, { key: 't', label: 'Tinggi (t)', power: 1 }],
                        calc: ({ V, t }) => (3 * V) / t,
                        steps: ({ V, t }, r) => [`La = 3V / t`, `La = 3×${fmt(V)} / ${fmt(t)}`, `La = ${fmt(r)}`] },
                        { id: 't', pill: 'Tinggi (dari Volume)', resultLabel: 'Tinggi (t)', power: 1,
                            inputs: [{ key: 'V', label: 'Volume (V)', power: 3 }, { key: 'La', label: 'Luas Alas (La)', power: 2 }],
                            calc: ({ V, La }) => (3 * V) / La,
                            steps: ({ V, La }, r) => [`t = 3V / La`, `t = 3×${fmt(V)} / ${fmt(La)}`, `t = ${fmt(r)}`] }
            ]},
            luas: { label: 'Luas Permukaan', power: 2, targets: [
                { id: 'LP', pill: 'Luas Permukaan (dari La, Ka, ts)', resultLabel: 'Luas Permukaan', power: 2,
                    inputs: [{ key: 'La', label: 'Luas Alas (La)', power: 2 }, { key: 'Ka', label: 'Keliling Alas (Ka)', power: 1 }, { key: 'ts', label: 'Tinggi Sisi Tegak (ts)', power: 1 }],
                    calc: ({ La, Ka, ts }) => La + 0.5 * Ka * ts,
                    steps: ({ La, Ka, ts }, r) => [`LP = La + ½·Ka·ts`, `LP = ${fmt(La)} + ½×${fmt(Ka)}×${fmt(ts)}`, `LP = ${fmt(r)}`] },
                    { id: 'La', pill: 'Luas Alas (dari Luas Permukaan)', resultLabel: 'Luas Alas (La)', power: 2,
                        inputs: [{ key: 'LP', label: 'Luas Permukaan (LP)', power: 2 }, { key: 'Ka', label: 'Keliling Alas (Ka)', power: 1 }, { key: 'ts', label: 'Tinggi Sisi Tegak (ts)', power: 1 }],
                        calc: ({ LP, Ka, ts }) => LP - 0.5 * Ka * ts,
                        steps: ({ LP, Ka, ts }, r) => [`La = LP − ½·Ka·ts`, `La = ${fmt(LP)} − ½×${fmt(Ka)}×${fmt(ts)}`, `La = ${fmt(r)}`] },
                        { id: 'Ka', pill: 'Keliling Alas (dari Luas Permukaan)', resultLabel: 'Keliling Alas (Ka)', power: 1,
                            inputs: [{ key: 'LP', label: 'Luas Permukaan (LP)', power: 2 }, { key: 'La', label: 'Luas Alas (La)', power: 2 }, { key: 'ts', label: 'Tinggi Sisi Tegak (ts)', power: 1 }],
                            calc: ({ LP, La, ts }) => (2 * (LP - La)) / ts,
                            steps: ({ LP, La, ts }, r) => [`Ka = 2(LP − La) / ts`, `Ka = 2(${fmt(LP)} − ${fmt(La)}) / ${fmt(ts)}`, `Ka = ${fmt(r)}`] },
                            { id: 'ts', pill: 'Tinggi Sisi Tegak (dari Luas Permukaan)', resultLabel: 'Tinggi Sisi Tegak (ts)', power: 1,
                                inputs: [{ key: 'LP', label: 'Luas Permukaan (LP)', power: 2 }, { key: 'La', label: 'Luas Alas (La)', power: 2 }, { key: 'Ka', label: 'Keliling Alas (Ka)', power: 1 }],
                                calc: ({ LP, La, Ka }) => (2 * (LP - La)) / Ka,
                                steps: ({ LP, La, Ka }, r) => [`ts = 2(LP − La) / Ka`, `ts = 2(${fmt(LP)} − ${fmt(La)}) / ${fmt(Ka)}`, `ts = ${fmt(r)}`] }
            ]}
        }
    },

    kerucut: {
        label: 'Kerucut', accent: ['#f472b6', '#e11d48', '#fbbf24'], desc: 'Alas lingkaran, meruncing ke satu titik',
        helper: {
            title: 'Alat bantu: hitung garis pelukis (s)',
            inputs: [{ key: 'hr', label: 'Jari-jari (r)' }, { key: 'ht', label: 'Tinggi (t)' }],
            compute: ({ hr, ht }) => Math.sqrt(hr ** 2 + ht ** 2),
            resultLabel: 's'
        },
        groups: {
            volume: { label: 'Volume', power: 3, targets: [
                { id: 'V', pill: 'Volume (dari r, t)', resultLabel: 'Volume', power: 3,
                    inputs: [{ key: 'r', label: 'Jari-jari (r)', power: 1 }, { key: 't', label: 'Tinggi (t)', power: 1 }],
                    calc: ({ r, t }) => (1 / 3) * PI * r ** 2 * t,
                    steps: ({ r, t }, res) => [`V = ⅓πr²t`, `V = ⅓ × π × ${fmt(r)}² × ${fmt(t)}`, `V = ${fmt(res)}`] },
                    { id: 'r', pill: 'Jari-jari (dari Volume)', resultLabel: 'Jari-jari (r)', power: 1,
                        inputs: [{ key: 'V', label: 'Volume (V)', power: 3 }, { key: 't', label: 'Tinggi (t)', power: 1 }],
                        calc: ({ V, t }) => Math.sqrt((3 * V) / (PI * t)),
                        steps: ({ V, t }, res) => [`r = √(3V / πt)`, `r = √(3×${fmt(V)} / (π×${fmt(t)}))`, `r = ${fmt(res)}`] },
                        { id: 't', pill: 'Tinggi (dari Volume)', resultLabel: 'Tinggi (t)', power: 1,
                            inputs: [{ key: 'V', label: 'Volume (V)', power: 3 }, { key: 'r', label: 'Jari-jari (r)', power: 1 }],
                            calc: ({ V, r }) => (3 * V) / (PI * r ** 2),
                            steps: ({ V, r }, res) => [`t = 3V / πr²`, `t = 3×${fmt(V)} / (π×${fmt(r)}²)`, `t = ${fmt(res)}`] }
            ]},
            luas: { label: 'Luas Permukaan', power: 2, targets: [
                { id: 'LP', pill: 'Luas Permukaan (dari r, s)', resultLabel: 'Luas Permukaan', power: 2,
                    inputs: [{ key: 'r', label: 'Jari-jari (r)', power: 1 }, { key: 's', label: 'Garis Pelukis (s)', power: 1 }],
                    calc: ({ r, s }) => PI * r * (r + s),
                    steps: ({ r, s }, res) => [`LP = πr(r + s)`, `LP = π × ${fmt(r)} × (${fmt(r)} + ${fmt(s)})`, `LP = ${fmt(res)}`] },
                    { id: 'r', pill: 'Jari-jari (dari Luas Permukaan)', resultLabel: 'Jari-jari (r)', power: 1,
                        inputs: [{ key: 'LP', label: 'Luas Permukaan (LP)', power: 2 }, { key: 's', label: 'Garis Pelukis (s)', power: 1 }],
                        calc: ({ LP, s }) => solveQuadraticPositive(PI, PI * s, -LP),
                        steps: ({ LP, s }, res) => [`πr² + πsr − LP = 0`, `a=π, b=π×${fmt(s)}, c=−${fmt(LP)}`, `r = ${fmt(res)}`] },
                        { id: 's', pill: 'Garis Pelukis (dari Luas Permukaan)', resultLabel: 'Garis Pelukis (s)', power: 1,
                            inputs: [{ key: 'LP', label: 'Luas Permukaan (LP)', power: 2 }, { key: 'r', label: 'Jari-jari (r)', power: 1 }],
                            calc: ({ LP, r }) => (LP - PI * r ** 2) / (PI * r),
                            steps: ({ LP, r }, res) => [`s = (LP − πr²) / πr`, `s = (${fmt(LP)} − ${fmt(PI*r*r)}) / ${fmt(PI*r)}`, `s = ${fmt(res)}`] }
            ]}
        }
    },

    tabung: {
        label: 'Tabung', accent: ['#38bdf8', '#0891b2', '#8b5cf6'], desc: 'Dua alas lingkaran sejajar',
        groups: {
            volume: { label: 'Volume', power: 3, targets: [
                { id: 'V', pill: 'Volume (dari r, t)', resultLabel: 'Volume', power: 3,
                    inputs: [{ key: 'r', label: 'Jari-jari (r)', power: 1 }, { key: 't', label: 'Tinggi (t)', power: 1 }],
                    calc: ({ r, t }) => PI * r ** 2 * t,
                    steps: ({ r, t }, res) => [`V = πr²t`, `V = π × ${fmt(r)}² × ${fmt(t)}`, `V = ${fmt(res)}`] },
                    { id: 'r', pill: 'Jari-jari (dari Volume)', resultLabel: 'Jari-jari (r)', power: 1,
                        inputs: [{ key: 'V', label: 'Volume (V)', power: 3 }, { key: 't', label: 'Tinggi (t)', power: 1 }],
                        calc: ({ V, t }) => Math.sqrt(V / (PI * t)),
                        steps: ({ V, t }, res) => [`r = √(V / πt)`, `r = √(${fmt(V)} / (π×${fmt(t)}))`, `r = ${fmt(res)}`] },
                        { id: 't', pill: 'Tinggi (dari Volume)', resultLabel: 'Tinggi (t)', power: 1,
                            inputs: [{ key: 'V', label: 'Volume (V)', power: 3 }, { key: 'r', label: 'Jari-jari (r)', power: 1 }],
                            calc: ({ V, r }) => V / (PI * r ** 2),
                            steps: ({ V, r }, res) => [`t = V / πr²`, `t = ${fmt(V)} / (π×${fmt(r)}²)`, `t = ${fmt(res)}`] }
            ]},
            luas: { label: 'Luas Permukaan', power: 2, targets: [
                { id: 'LP', pill: 'Luas Permukaan (dari r, t)', resultLabel: 'Luas Permukaan', power: 2,
                    inputs: [{ key: 'r', label: 'Jari-jari (r)', power: 1 }, { key: 't', label: 'Tinggi (t)', power: 1 }],
                    calc: ({ r, t }) => 2 * PI * r * (r + t),
                    steps: ({ r, t }, res) => [`LP = 2πr(r + t)`, `LP = 2π × ${fmt(r)} × (${fmt(r)} + ${fmt(t)})`, `LP = ${fmt(res)}`] },
                    { id: 't', pill: 'Tinggi (dari Luas Permukaan)', resultLabel: 'Tinggi (t)', power: 1,
                        inputs: [{ key: 'LP', label: 'Luas Permukaan (LP)', power: 2 }, { key: 'r', label: 'Jari-jari (r)', power: 1 }],
                        calc: ({ LP, r }) => (LP - 2 * PI * r ** 2) / (2 * PI * r),
                        steps: ({ LP, r }, res) => [`t = (LP − 2πr²) / 2πr`, `t = (${fmt(LP)} − ${fmt(2*PI*r*r)}) / ${fmt(2*PI*r)}`, `t = ${fmt(res)}`] },
                        { id: 'r', pill: 'Jari-jari (dari Luas Permukaan)', resultLabel: 'Jari-jari (r)', power: 1,
                            inputs: [{ key: 'LP', label: 'Luas Permukaan (LP)', power: 2 }, { key: 't', label: 'Tinggi (t)', power: 1 }],
                            calc: ({ LP, t }) => solveQuadraticPositive(2 * PI, 2 * PI * t, -LP),
                            steps: ({ LP, t }, res) => [`2πr² + 2πtr − LP = 0`, `a=2π, b=2π×${fmt(t)}, c=−${fmt(LP)}`, `r = ${fmt(res)}`] }
            ]}
        }
    },

    bola: {
        label: 'Bola', accent: ['#e879f9', '#a21caf', '#38bdf8'], desc: 'Permukaan berjarak sama dari pusat',
        groups: {
            volume: { label: 'Volume', power: 3, targets: [
                { id: 'V', pill: 'Volume (dari r)', resultLabel: 'Volume', power: 3,
                    inputs: [{ key: 'r', label: 'Jari-jari (r)', power: 1 }],
                    calc: ({ r }) => (4 / 3) * PI * r ** 3,
                    steps: ({ r }, res) => [`V = 4/3 × πr³`, `V = 4/3 × π × ${fmt(r)}³`, `V = ${fmt(res)}`] },
                    { id: 'r', pill: 'Jari-jari (dari Volume)', resultLabel: 'Jari-jari (r)', power: 1,
                        inputs: [{ key: 'V', label: 'Volume (V)', power: 3 }],
                        calc: ({ V }) => Math.cbrt((3 * V) / (4 * PI)),
                        steps: ({ V }, res) => [`r = ³√(3V / 4π)`, `r = ³√(3×${fmt(V)} / 4π)`, `r = ${fmt(res)}`] }
            ]},
            luas: { label: 'Luas Permukaan', power: 2, targets: [
                { id: 'LP', pill: 'Luas Permukaan (dari r)', resultLabel: 'Luas Permukaan', power: 2,
                    inputs: [{ key: 'r', label: 'Jari-jari (r)', power: 1 }],
                    calc: ({ r }) => 4 * PI * r ** 2,
                    steps: ({ r }, res) => [`LP = 4πr²`, `LP = 4 × π × ${fmt(r)}²`, `LP = ${fmt(res)}`] },
                    { id: 'r', pill: 'Jari-jari (dari Luas Permukaan)', resultLabel: 'Jari-jari (r)', power: 1,
                        inputs: [{ key: 'LP', label: 'Luas Permukaan (LP)', power: 2 }],
                        calc: ({ LP }) => Math.sqrt(LP / (4 * PI)),
                        steps: ({ LP }, res) => [`r = √(LP / 4π)`, `r = √(${fmt(LP)} / 4π)`, `r = ${fmt(res)}`] }
            ]}
        }
    }
};

const state = {
    shape: 'kubus',
    mode: 'volume',
    targetId: null,
    unit: 'cm'
};

const $ = (id) => document.getElementById(id);
const shapeGrid = $('shapeGrid');
const calcIcon = $('calcIcon');
const calcShapeName = $('calcShapeName');
const calcShapeDesc = $('calcShapeDesc');
const modeTabs = $('modeTabs');
const targetPills = $('targetPills');
const inputGrid = $('inputGrid');
const helperTool = $('helperTool');
const resultPanel = $('resultPanel');
const resultLabel = $('resultLabel');
const resultValue = $('resultValue');
const formulaStrip = $('formulaStrip');
const errorMsg = $('errorMsg');
const unitSelect = $('unitSelect');
const historyList = $('historyList');
const historyCount = $('historyCount');

function buildShapeGrid() {
    shapeGrid.innerHTML = '';
    Object.entries(SHAPES).forEach(([key, cfg]) => {
        const btn = document.createElement('button');
        btn.className = 'shape-card' + (key === state.shape ? ' active' : '');
        btn.style.setProperty('--shape-1', cfg.accent[0]);
        btn.style.setProperty('--shape-2', cfg.accent[1]);
        btn.innerHTML = `<span class="s-icon">${ICONS[key]}</span><span>${cfg.label}</span>`;
        btn.addEventListener('click', () => selectShape(key));
        shapeGrid.appendChild(btn);
    });
}

function applyAccent(cfg) {
    document.body.style.setProperty('--accent-1', cfg.accent[0]);
    document.body.style.setProperty('--accent-2', cfg.accent[1]);
    document.body.style.setProperty('--accent-3', cfg.accent[2]);
}

function selectShape(key) {
    state.shape = key;
    state.mode = 'volume';
    const cfg = SHAPES[key];
    applyAccent(cfg);
    [...shapeGrid.children].forEach((c) => c.classList.remove('active'));
    const idx = Object.keys(SHAPES).indexOf(key);
    shapeGrid.children[idx].classList.add('active');

    calcIcon.innerHTML = ICONS[key];
    calcShapeName.textContent = cfg.label;
    calcShapeDesc.textContent = cfg.desc;

    buildModeTabs();
    setMode('volume');
    hideResult();
}

function buildModeTabs() {
    const cfg = SHAPES[state.shape];
    modeTabs.innerHTML = '';
    Object.entries(cfg.groups).forEach(([gid, g]) => {
        const b = document.createElement('button');
        b.className = 'mode-tab' + (gid === state.mode ? ' active' : '');
        b.textContent = g.label;
        b.addEventListener('click', () => setMode(gid));
        modeTabs.appendChild(b);
    });
}

function setMode(mode) {
    state.mode = mode;
    [...modeTabs.children].forEach((b) => b.classList.remove('active'));
    const cfg = SHAPES[state.shape];
    const gids = Object.keys(cfg.groups);
    modeTabs.children[gids.indexOf(mode)].classList.add('active');

    const group = cfg.groups[mode];
    state.targetId = group.targets[0].id;
    buildTargetPills();
    buildInputs();
    buildHelper();
    hideResult();
}

function buildTargetPills() {
    const group = SHAPES[state.shape].groups[state.mode];
    targetPills.innerHTML = '';
    group.targets.forEach((t) => {
        const p = document.createElement('button');
        p.className = 'pill' + (t.id === state.targetId ? ' active' : '');
        p.textContent = t.pill;
        p.addEventListener('click', () => {
            state.targetId = t.id;
            [...targetPills.children].forEach((c) => c.classList.remove('active'));
            p.classList.add('active');
            buildInputs();
            buildHelper();
            hideResult();
        });
        targetPills.appendChild(p);
    });
}

function currentTarget() {
    const group = SHAPES[state.shape].groups[state.mode];
    return group.targets.find((t) => t.id === state.targetId);
}

function buildInputs() {
    const target = currentTarget();
    inputGrid.innerHTML = '';
    target.inputs.forEach((inp) => {
        const field = document.createElement('div');
        field.className = 'field';
        field.innerHTML = `
        <label>${inp.label} <span class="unit-tag">(${unitLabel(inp.power, state.unit)})</span></label>
        <input type="number" step="any" min="0" data-key="${inp.key}" placeholder="Masukkan nilai" />
        `;
        inputGrid.appendChild(field);
    });
}

function buildHelper() {
    const cfg = SHAPES[state.shape];
    if (!cfg.helper || state.mode !== 'luas') {
        helperTool.classList.remove('show');
        helperTool.innerHTML = '';
        return;
    }
    const h = cfg.helper;
    helperTool.classList.add('show');
    helperTool.innerHTML = `
    <h4>${h.title}</h4>
    <div class="helper-row">
    ${h.inputs.map((i) => `<div class="field"><label>${i.label}</label><input type="number" step="any" min="0" data-hkey="${i.key}" placeholder="0"/></div>`).join('')}
    <div class="helper-result" id="helperResult">${h.resultLabel} = —</div>
    </div>
    `;
    helperTool.querySelectorAll('input').forEach((inp) => {
        inp.addEventListener('input', () => {
            const vals = {};
            helperTool.querySelectorAll('input').forEach((i2) => (vals[i2.dataset.hkey] = parseFloat(i2.value)));
            const ok = Object.values(vals).every((v) => isFinite(v) && v > 0);
            const out = $('helperResult');
            if (ok) {
                const res = h.compute(vals);
                out.innerHTML = `${h.resultLabel} = <b>${fmt(res)} ${state.unit}</b>`;
            } else {
                out.innerHTML = `${h.resultLabel} = —`;
            }
        });
    });
}

function hideResult() {
    resultPanel.hidden = true;
    errorMsg.hidden = true;
}

function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.hidden = false;
    resultPanel.hidden = true;
}

function calculate() {
    const target = currentTarget();
    const inputs = [...inputGrid.querySelectorAll('input')];
    const values = {};
    for (const inp of inputs) {
        const v = parseFloat(inp.value);
        if (!inp.value.trim() || isNaN(v)) {
            showError('Lengkapi semua kolom dengan angka terlebih dahulu.');
            return;
        }
        if (v <= 0) {
            showError('Semua nilai harus lebih besar dari 0.');
            return;
        }
        values[inp.dataset.key] = v;
    }

    let result;
    try {
        result = target.calc(values);
    } catch (e) {
        result = null;
    }

    if (result === null || result === undefined || !isFinite(result) || result <= 0) {
        showError('Nilai yang dimasukkan tidak menghasilkan bentuk geometris yang valid. Periksa kembali angkanya.');
        return;
    }

    errorMsg.hidden = true;
    resultPanel.hidden = false;
    resultLabel.textContent = `${SHAPES[state.shape].label} — ${target.resultLabel}`;
    resultValue.textContent = `${fmt(result)} ${unitLabel(target.power, state.unit)}`;

    formulaStrip.innerHTML = '';
    target.steps(values, result).forEach((s) => {
        const row = document.createElement('div');
        row.className = 'formula-step';
        row.textContent = s;
        formulaStrip.appendChild(row);
    });

    saveHistory(target, values, result);
}

const HISTORY_KEY = 'br_calc_history_v1';

function loadHistory() {
    try {
        return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    } catch (e) {
        return [];
    }
}

function saveHistory(target, values, result) {
    const list = loadHistory();
    list.unshift({
        shape: SHAPES[state.shape].label,
        shapeKey: state.shape,
        group: SHAPES[state.shape].groups[state.mode].label,
        label: target.resultLabel,
        value: result,
        unit: unitLabel(target.power, state.unit),
                 inputsText: target.inputs.map((i) => `${i.key}=${fmt(values[i.key])}`).join(', '),
                 time: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
    });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 30)));
    renderHistory();
}

function renderHistory() {
    const list = loadHistory();
    historyList.innerHTML = '';
    if (!list.length) {
        historyCount.textContent = 'Belum ada riwayat perhitungan.';
        return;
    }
    historyCount.textContent = `${list.length} perhitungan tersimpan`;
    list.forEach((item) => {
        const li = document.createElement('li');
        li.className = 'history-item';
        li.innerHTML = `
        <div class="h-left">
        <span class="h-tag">${item.shape} · ${item.group}</span>
        <span class="h-main">${item.label}</span>
        <span class="h-sub">${item.inputsText} · ${item.time}</span>
        </div>
        <span class="h-value">${fmt(item.value)} ${item.unit}</span>
        `;
        historyList.appendChild(li);
    });
}

$('btnClearHistory').addEventListener('click', () => {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
    showToast('Riwayat berhasil dihapus');
});

function showToast(msg) {
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('show'), 2200);
}

$('btnCopy') && $('btnCopy').addEventListener('click', () => {
    const text = `${resultLabel.textContent}: ${resultValue.textContent}`;
    navigator.clipboard?.writeText(text).then(() => showToast('Hasil disalin ke clipboard'));
});

$('btnHitung').addEventListener('click', calculate);
$('btnReset').addEventListener('click', () => {
    inputGrid.querySelectorAll('input').forEach((i) => (i.value = ''));
    hideResult();
});

unitSelect.addEventListener('change', () => {
    state.unit = unitSelect.value;
    buildInputs();
    buildHelper();
});

const THEME_KEY = 'br_calc_theme_v1';
function initTheme() {
    const saved = localStorage.getItem(THEME_KEY) || 'dark';
    document.body.dataset.theme = saved;
    $('themeToggle').textContent = saved === 'dark' ? '☾' : '☀';
}
$('themeToggle').addEventListener('click', () => {
    const next = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
    document.body.dataset.theme = next;
    localStorage.setItem(THEME_KEY, next);
    $('themeToggle').textContent = next === 'dark' ? '☾' : '☀';
});

function buildOrbitIcons() {
    const orbit = document.querySelector('.hero-orbit');
    if (!orbit) return;
    const keys = Object.keys(ICONS).slice(0, 5);
    keys.forEach((k, i) => {
        const el = document.createElement('div');
        el.className = 'orbit-icon';
        el.style.marginLeft = '-17px';
        el.style.marginTop = '-17px';
        el.innerHTML = ICONS[k];
        el.style.animationDelay = `-${i * 4}s`;
        orbit.appendChild(el);
    });
}

function init() {
    initTheme();
    buildShapeGrid();
    applyAccent(SHAPES[state.shape]);
    calcIcon.innerHTML = ICONS[state.shape];
    calcShapeName.textContent = SHAPES[state.shape].label;
    calcShapeDesc.textContent = SHAPES[state.shape].desc;
    buildModeTabs();
    setMode('volume');
    buildOrbitIcons();
    renderHistory();
}

document.addEventListener('DOMContentLoaded', init);
