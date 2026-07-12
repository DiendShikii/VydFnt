function round(num, decimals = 4) {
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}
function fmt(num) {
  const r = round(num, 4);
  return Number(r.toFixed(4)).toString().replace('.', ',');
}
function fmtResult(num) {
  return fmt(num);
}

const shapeIconPaths = {
  persegi: 'M20,18 L82,15 L85,80 L18,83 Z',
  persegiPanjang: 'M10,30 L90,25 L92,70 L8,75 Z',
  segitiga: 'M50,12 L88,85 L12,82 Z',
  jajarGenjang: 'M25,20 L90,18 L75,80 L10,82 Z',
  layangLayang: 'M50,8 L78,42 L50,92 L25,42 Z',
  belahKetupat: 'M50,10 L88,50 L50,90 L12,50 Z',
  trapesium: 'M25,20 L75,20 L92,80 L8,80 Z',
  lingkaran: 'M50,10 C75,10 90,30 88,52 C86,75 68,90 48,90 C28,90 12,73 12,50 C12,28 27,10 50,10 Z'
};

const shapesData = {
  persegi: {
    name: 'Persegi',
    desc: 'Bangun datar dengan 4 sisi sama panjang dan 4 sudut siku-siku.',
    modes: [
      {
        id: 'sisi', metric: 'luas', label: 'Sisi → Luas & Keliling',
        inputs: [{ id: 's', label: 'Sisi (s)', type: 'panjang' }],
        calculate(v) {
          const luas = v.s * v.s, keliling = 4 * v.s;
          return [
            { label: 'Luas', formula: `L = s × s = ${fmt(v.s)} × ${fmt(v.s)}`, value: luas, unitType: 'luas' },
            { label: 'Keliling', formula: `K = 4 × s = 4 × ${fmt(v.s)}`, value: keliling, unitType: 'panjang' }
          ];
        }
      },
      {
        id: 'luas-ke-sisi', metric: 'luas', label: 'Luas → Sisi',
        inputs: [{ id: 'luas', label: 'Luas (L)', type: 'luas' }],
        calculate(v) {
          const s = Math.sqrt(v.luas), keliling = 4 * s;
          return [
            { label: 'Sisi', formula: `s = √L = √${fmt(v.luas)}`, value: s, unitType: 'panjang' },
            { label: 'Keliling', formula: `K = 4 × s = 4 × ${fmt(s)}`, value: keliling, unitType: 'panjang' }
          ];
        }
      },
      {
        id: 'keliling-ke-sisi', metric: 'keliling', label: 'Keliling → Sisi',
        inputs: [{ id: 'keliling', label: 'Keliling (K)', type: 'panjang' }],
        calculate(v) {
          const s = v.keliling / 4, luas = s * s;
          return [
            { label: 'Sisi', formula: `s = K ÷ 4 = ${fmt(v.keliling)} ÷ 4`, value: s, unitType: 'panjang' },
            { label: 'Luas', formula: `L = s × s = ${fmt(s)} × ${fmt(s)}`, value: luas, unitType: 'luas' }
          ];
        }
      }
    ]
  },

  persegiPanjang: {
    name: 'Persegi Panjang',
    desc: 'Bangun datar dengan 2 pasang sisi sejajar sama panjang dan 4 sudut siku-siku.',
    modes: [
      {
        id: 'pl', metric: 'luas', label: 'Panjang & Lebar → Luas & Keliling',
        inputs: [{ id: 'p', label: 'Panjang (p)', type: 'panjang' }, { id: 'l', label: 'Lebar (l)', type: 'panjang' }],
        calculate(v) {
          const luas = v.p * v.l, keliling = 2 * (v.p + v.l);
          return [
            { label: 'Luas', formula: `L = p × l = ${fmt(v.p)} × ${fmt(v.l)}`, value: luas, unitType: 'luas' },
            { label: 'Keliling', formula: `K = 2 × (p + l) = 2 × (${fmt(v.p)} + ${fmt(v.l)})`, value: keliling, unitType: 'panjang' }
          ];
        }
      },
      {
        id: 'luas-p-ke-l', metric: 'luas', label: 'Luas & Panjang → Lebar',
        inputs: [{ id: 'luas', label: 'Luas (L)', type: 'luas' }, { id: 'p', label: 'Panjang (p)', type: 'panjang' }],
        calculate(v) {
          const l = v.luas / v.p, keliling = 2 * (v.p + l);
          return [
            { label: 'Lebar', formula: `l = L ÷ p = ${fmt(v.luas)} ÷ ${fmt(v.p)}`, value: l, unitType: 'panjang' },
            { label: 'Keliling', formula: `K = 2 × (p + l) = 2 × (${fmt(v.p)} + ${fmt(l)})`, value: keliling, unitType: 'panjang' }
          ];
        }
      },
      {
        id: 'keliling-p-ke-l', metric: 'keliling', label: 'Keliling & Panjang → Lebar',
        inputs: [{ id: 'keliling', label: 'Keliling (K)', type: 'panjang' }, { id: 'p', label: 'Panjang (p)', type: 'panjang' }],
        calculate(v) {
          const l = v.keliling / 2 - v.p, luas = v.p * l;
          return [
            { label: 'Lebar', formula: `l = (K ÷ 2) − p = (${fmt(v.keliling)} ÷ 2) − ${fmt(v.p)}`, value: l, unitType: 'panjang' },
            { label: 'Luas', formula: `L = p × l = ${fmt(v.p)} × ${fmt(l)}`, value: luas, unitType: 'luas' }
          ];
        }
      }
    ]
  },

  segitiga: {
    name: 'Segitiga',
    desc: 'Bangun datar dengan 3 sisi dan 3 sudut.',
    modes: [
      {
        id: 'at-ke-luas', metric: 'luas', label: 'Alas & Tinggi → Luas',
        inputs: [{ id: 'a', label: 'Alas (a)', type: 'panjang' }, { id: 't', label: 'Tinggi (t)', type: 'panjang' }],
        calculate(v) {
          const luas = 0.5 * v.a * v.t;
          return [{ label: 'Luas', formula: `L = ½ × a × t = ½ × ${fmt(v.a)} × ${fmt(v.t)}`, value: luas, unitType: 'luas' }];
        }
      },
      {
        id: 'luas-a-ke-t', metric: 'luas', label: 'Luas & Alas → Tinggi',
        inputs: [{ id: 'luas', label: 'Luas (L)', type: 'luas' }, { id: 'a', label: 'Alas (a)', type: 'panjang' }],
        calculate(v) {
          const t = (2 * v.luas) / v.a;
          return [{ label: 'Tinggi', formula: `t = (2 × L) ÷ a = (2 × ${fmt(v.luas)}) ÷ ${fmt(v.a)}`, value: t, unitType: 'panjang' }];
        }
      },
      {
        id: 'luas-t-ke-a', metric: 'luas', label: 'Luas & Tinggi → Alas',
        inputs: [{ id: 'luas', label: 'Luas (L)', type: 'luas' }, { id: 't', label: 'Tinggi (t)', type: 'panjang' }],
        calculate(v) {
          const a = (2 * v.luas) / v.t;
          return [{ label: 'Alas', formula: `a = (2 × L) ÷ t = (2 × ${fmt(v.luas)}) ÷ ${fmt(v.t)}`, value: a, unitType: 'panjang' }];
        }
      },
      {
        id: '3sisi-ke-keliling', metric: 'keliling', label: '3 Sisi → Keliling',
        inputs: [{ id: 'a', label: 'Sisi a', type: 'panjang' }, { id: 'b', label: 'Sisi b', type: 'panjang' }, { id: 'c', label: 'Sisi c', type: 'panjang' }],
        calculate(v) {
          const keliling = v.a + v.b + v.c;
          return [{ label: 'Keliling', formula: `K = a + b + c = ${fmt(v.a)} + ${fmt(v.b)} + ${fmt(v.c)}`, value: keliling, unitType: 'panjang' }];
        }
      },
      {
        id: 'keliling-2sisi-ke-sisi', metric: 'keliling', label: 'Keliling & 2 Sisi → Sisi ke-3',
        inputs: [{ id: 'keliling', label: 'Keliling (K)', type: 'panjang' }, { id: 'a', label: 'Sisi a', type: 'panjang' }, { id: 'b', label: 'Sisi b', type: 'panjang' }],
        calculate(v) {
          const c = v.keliling - v.a - v.b;
          return [{ label: 'Sisi c', formula: `c = K − a − b = ${fmt(v.keliling)} − ${fmt(v.a)} − ${fmt(v.b)}`, value: c, unitType: 'panjang' }];
        }
      }
    ]
  },

  jajarGenjang: {
    name: 'Jajar Genjang',
    desc: 'Bangun datar dengan 2 pasang sisi sejajar sama panjang, tanpa sudut siku-siku.',
    modes: [
      {
        id: 'at-ke-luas', metric: 'luas', label: 'Alas & Tinggi → Luas',
        inputs: [{ id: 'a', label: 'Alas (a)', type: 'panjang' }, { id: 't', label: 'Tinggi (t)', type: 'panjang' }],
        calculate(v) {
          const luas = v.a * v.t;
          return [{ label: 'Luas', formula: `L = a × t = ${fmt(v.a)} × ${fmt(v.t)}`, value: luas, unitType: 'luas' }];
        }
      },
      {
        id: 'luas-a-ke-t', metric: 'luas', label: 'Luas & Alas → Tinggi',
        inputs: [{ id: 'luas', label: 'Luas (L)', type: 'luas' }, { id: 'a', label: 'Alas (a)', type: 'panjang' }],
        calculate(v) {
          const t = v.luas / v.a;
          return [{ label: 'Tinggi', formula: `t = L ÷ a = ${fmt(v.luas)} ÷ ${fmt(v.a)}`, value: t, unitType: 'panjang' }];
        }
      },
      {
        id: 'luas-t-ke-a', metric: 'luas', label: 'Luas & Tinggi → Alas',
        inputs: [{ id: 'luas', label: 'Luas (L)', type: 'luas' }, { id: 't', label: 'Tinggi (t)', type: 'panjang' }],
        calculate(v) {
          const a = v.luas / v.t;
          return [{ label: 'Alas', formula: `a = L ÷ t = ${fmt(v.luas)} ÷ ${fmt(v.t)}`, value: a, unitType: 'panjang' }];
        }
      },
      {
        id: 'as-ke-keliling', metric: 'keliling', label: 'Alas & Sisi Miring → Keliling',
        inputs: [{ id: 'a', label: 'Alas (a)', type: 'panjang' }, { id: 'b', label: 'Sisi Miring (b)', type: 'panjang' }],
        calculate(v) {
          const keliling = 2 * (v.a + v.b);
          return [{ label: 'Keliling', formula: `K = 2 × (a + b) = 2 × (${fmt(v.a)} + ${fmt(v.b)})`, value: keliling, unitType: 'panjang' }];
        }
      },
      {
        id: 'keliling-a-ke-b', metric: 'keliling', label: 'Keliling & Alas → Sisi Miring',
        inputs: [{ id: 'keliling', label: 'Keliling (K)', type: 'panjang' }, { id: 'a', label: 'Alas (a)', type: 'panjang' }],
        calculate(v) {
          const b = v.keliling / 2 - v.a;
          return [{ label: 'Sisi Miring', formula: `b = (K ÷ 2) − a = (${fmt(v.keliling)} ÷ 2) − ${fmt(v.a)}`, value: b, unitType: 'panjang' }];
        }
      }
    ]
  },

  layangLayang: {
    name: 'Layang-Layang',
    desc: 'Bangun datar dengan 2 pasang sisi berdekatan sama panjang.',
    modes: [
      {
        id: 'd-ke-luas', metric: 'luas', label: 'Diagonal 1 & 2 → Luas',
        inputs: [{ id: 'd1', label: 'Diagonal 1 (d1)', type: 'panjang' }, { id: 'd2', label: 'Diagonal 2 (d2)', type: 'panjang' }],
        calculate(v) {
          const luas = 0.5 * v.d1 * v.d2;
          return [{ label: 'Luas', formula: `L = ½ × d1 × d2 = ½ × ${fmt(v.d1)} × ${fmt(v.d2)}`, value: luas, unitType: 'luas' }];
        }
      },
      {
        id: 'luas-d1-ke-d2', metric: 'luas', label: 'Luas & Diagonal 1 → Diagonal 2',
        inputs: [{ id: 'luas', label: 'Luas (L)', type: 'luas' }, { id: 'd1', label: 'Diagonal 1 (d1)', type: 'panjang' }],
        calculate(v) {
          const d2 = (2 * v.luas) / v.d1;
          return [{ label: 'Diagonal 2', formula: `d2 = (2 × L) ÷ d1 = (2 × ${fmt(v.luas)}) ÷ ${fmt(v.d1)}`, value: d2, unitType: 'panjang' }];
        }
      },
      {
        id: 'sisi-ke-keliling', metric: 'keliling', label: '2 Pasang Sisi → Keliling',
        inputs: [{ id: 's1', label: 'Sisi Pendek (s1)', type: 'panjang' }, { id: 's2', label: 'Sisi Panjang (s2)', type: 'panjang' }],
        calculate(v) {
          const keliling = 2 * (v.s1 + v.s2);
          return [{ label: 'Keliling', formula: `K = 2 × (s1 + s2) = 2 × (${fmt(v.s1)} + ${fmt(v.s2)})`, value: keliling, unitType: 'panjang' }];
        }
      },
      {
        id: 'keliling-s1-ke-s2', metric: 'keliling', label: 'Keliling & Sisi Pendek → Sisi Panjang',
        inputs: [{ id: 'keliling', label: 'Keliling (K)', type: 'panjang' }, { id: 's1', label: 'Sisi Pendek (s1)', type: 'panjang' }],
        calculate(v) {
          const s2 = v.keliling / 2 - v.s1;
          return [{ label: 'Sisi Panjang', formula: `s2 = (K ÷ 2) − s1 = (${fmt(v.keliling)} ÷ 2) − ${fmt(v.s1)}`, value: s2, unitType: 'panjang' }];
        }
      }
    ]
  },

  belahKetupat: {
    name: 'Belah Ketupat',
    desc: 'Bangun datar dengan 4 sisi sama panjang dan 2 pasang sudut berhadapan sama besar.',
    modes: [
      {
        id: 'd-ke-luas', metric: 'luas', label: 'Diagonal 1 & 2 → Luas',
        inputs: [{ id: 'd1', label: 'Diagonal 1 (d1)', type: 'panjang' }, { id: 'd2', label: 'Diagonal 2 (d2)', type: 'panjang' }],
        calculate(v) {
          const luas = 0.5 * v.d1 * v.d2;
          return [{ label: 'Luas', formula: `L = ½ × d1 × d2 = ½ × ${fmt(v.d1)} × ${fmt(v.d2)}`, value: luas, unitType: 'luas' }];
        }
      },
      {
        id: 'luas-d1-ke-d2', metric: 'luas', label: 'Luas & Diagonal 1 → Diagonal 2',
        inputs: [{ id: 'luas', label: 'Luas (L)', type: 'luas' }, { id: 'd1', label: 'Diagonal 1 (d1)', type: 'panjang' }],
        calculate(v) {
          const d2 = (2 * v.luas) / v.d1;
          return [{ label: 'Diagonal 2', formula: `d2 = (2 × L) ÷ d1 = (2 × ${fmt(v.luas)}) ÷ ${fmt(v.d1)}`, value: d2, unitType: 'panjang' }];
        }
      },
      {
        id: 'sisi-ke-keliling', metric: 'keliling', label: 'Sisi → Keliling',
        inputs: [{ id: 's', label: 'Sisi (s)', type: 'panjang' }],
        calculate(v) {
          const keliling = 4 * v.s;
          return [{ label: 'Keliling', formula: `K = 4 × s = 4 × ${fmt(v.s)}`, value: keliling, unitType: 'panjang' }];
        }
      },
      {
        id: 'keliling-ke-sisi', metric: 'keliling', label: 'Keliling → Sisi',
        inputs: [{ id: 'keliling', label: 'Keliling (K)', type: 'panjang' }],
        calculate(v) {
          const s = v.keliling / 4;
          return [{ label: 'Sisi', formula: `s = K ÷ 4 = ${fmt(v.keliling)} ÷ 4`, value: s, unitType: 'panjang' }];
        }
      }
    ]
  },

  trapesium: {
    name: 'Trapesium',
    desc: 'Bangun datar dengan sepasang sisi sejajar yang panjangnya berbeda.',
    modes: [
      {
        id: 'abt-ke-luas', metric: 'luas', label: 'Sisi Sejajar & Tinggi → Luas',
        inputs: [{ id: 'a', label: 'Sisi Sejajar a', type: 'panjang' }, { id: 'b', label: 'Sisi Sejajar b', type: 'panjang' }, { id: 't', label: 'Tinggi (t)', type: 'panjang' }],
        calculate(v) {
          const luas = 0.5 * (v.a + v.b) * v.t;
          return [{ label: 'Luas', formula: `L = ½ × (a + b) × t = ½ × (${fmt(v.a)} + ${fmt(v.b)}) × ${fmt(v.t)}`, value: luas, unitType: 'luas' }];
        }
      },
      {
        id: 'luas-at-ke-b', metric: 'luas', label: 'Luas, Sisi a & Tinggi → Sisi b',
        inputs: [{ id: 'luas', label: 'Luas (L)', type: 'luas' }, { id: 'a', label: 'Sisi Sejajar a', type: 'panjang' }, { id: 't', label: 'Tinggi (t)', type: 'panjang' }],
        calculate(v) {
          const b = (2 * v.luas) / v.t - v.a;
          return [{ label: 'Sisi b', formula: `b = (2 × L ÷ t) − a = (2 × ${fmt(v.luas)} ÷ ${fmt(v.t)}) − ${fmt(v.a)}`, value: b, unitType: 'panjang' }];
        }
      },
      {
        id: 'luas-ab-ke-t', metric: 'luas', label: 'Luas & Sisi Sejajar a, b → Tinggi',
        inputs: [{ id: 'luas', label: 'Luas (L)', type: 'luas' }, { id: 'a', label: 'Sisi Sejajar a', type: 'panjang' }, { id: 'b', label: 'Sisi Sejajar b', type: 'panjang' }],
        calculate(v) {
          const t = (2 * v.luas) / (v.a + v.b);
          return [{ label: 'Tinggi', formula: `t = (2 × L) ÷ (a + b) = (2 × ${fmt(v.luas)}) ÷ (${fmt(v.a)} + ${fmt(v.b)})`, value: t, unitType: 'panjang' }];
        }
      },
      {
        id: '4sisi-ke-keliling', metric: 'keliling', label: '4 Sisi → Keliling',
        inputs: [{ id: 'a', label: 'Sisi a', type: 'panjang' }, { id: 'b', label: 'Sisi b', type: 'panjang' }, { id: 'c', label: 'Sisi c', type: 'panjang' }, { id: 'd', label: 'Sisi d', type: 'panjang' }],
        calculate(v) {
          const keliling = v.a + v.b + v.c + v.d;
          return [{ label: 'Keliling', formula: `K = a + b + c + d = ${fmt(v.a)} + ${fmt(v.b)} + ${fmt(v.c)} + ${fmt(v.d)}`, value: keliling, unitType: 'panjang' }];
        }
      },
      {
        id: 'keliling-3sisi-ke-sisi', metric: 'keliling', label: 'Keliling & 3 Sisi → Sisi ke-4',
        inputs: [{ id: 'keliling', label: 'Keliling (K)', type: 'panjang' }, { id: 'a', label: 'Sisi a', type: 'panjang' }, { id: 'b', label: 'Sisi b', type: 'panjang' }, { id: 'c', label: 'Sisi c', type: 'panjang' }],
        calculate(v) {
          const d = v.keliling - v.a - v.b - v.c;
          return [{ label: 'Sisi d', formula: `d = K − a − b − c = ${fmt(v.keliling)} − ${fmt(v.a)} − ${fmt(v.b)} − ${fmt(v.c)}`, value: d, unitType: 'panjang' }];
        }
      }
    ]
  },

  lingkaran: {
    name: 'Lingkaran',
    desc: 'Bangun datar bulat sempurna dengan semua titik berjarak sama dari pusat.',
    modes: [
      {
        id: 'r-ke-luas-keliling', metric: 'luas', label: 'Jari-jari → Luas & Keliling',
        inputs: [{ id: 'r', label: 'Jari-jari (r)', type: 'panjang' }],
        calculate(v) {
          const luas = Math.PI * v.r * v.r, keliling = 2 * Math.PI * v.r;
          return [
            { label: 'Luas', formula: `L = π × r² = π × ${fmt(v.r)}²`, value: luas, unitType: 'luas' },
            { label: 'Keliling', formula: `K = 2 × π × r = 2 × π × ${fmt(v.r)}`, value: keliling, unitType: 'panjang' }
          ];
        }
      },
      {
        id: 'd-ke-luas-keliling', metric: 'luas', label: 'Diameter → Luas & Keliling',
        inputs: [{ id: 'd', label: 'Diameter (d)', type: 'panjang' }],
        calculate(v) {
          const r = v.d / 2, luas = Math.PI * r * r, keliling = Math.PI * v.d;
          return [
            { label: 'Jari-jari', formula: `r = d ÷ 2 = ${fmt(v.d)} ÷ 2`, value: r, unitType: 'panjang' },
            { label: 'Luas', formula: `L = π × r² = π × ${fmt(r)}²`, value: luas, unitType: 'luas' },
            { label: 'Keliling', formula: `K = π × d = π × ${fmt(v.d)}`, value: keliling, unitType: 'panjang' }
          ];
        }
      },
      {
        id: 'luas-ke-r', metric: 'luas', label: 'Luas → Jari-jari',
        inputs: [{ id: 'luas', label: 'Luas (L)', type: 'luas' }],
        calculate(v) {
          const r = Math.sqrt(v.luas / Math.PI), keliling = 2 * Math.PI * r;
          return [
            { label: 'Jari-jari', formula: `r = √(L ÷ π) = √(${fmt(v.luas)} ÷ π)`, value: r, unitType: 'panjang' },
            { label: 'Keliling', formula: `K = 2 × π × r = 2 × π × ${fmt(r)}`, value: keliling, unitType: 'panjang' }
          ];
        }
      },
      {
        id: 'keliling-ke-r', metric: 'keliling', label: 'Keliling → Jari-jari',
        inputs: [{ id: 'keliling', label: 'Keliling (K)', type: 'panjang' }],
        calculate(v) {
          const r = v.keliling / (2 * Math.PI), luas = Math.PI * r * r;
          return [
            { label: 'Jari-jari', formula: `r = K ÷ (2 × π) = ${fmt(v.keliling)} ÷ (2 × π)`, value: r, unitType: 'panjang' },
            { label: 'Luas', formula: `L = π × r² = π × ${fmt(r)}²`, value: luas, unitType: 'luas' }
          ];
        }
      }
    ]
  }
};

const state = {
  shape: null,
  mode: null,
  unit: 'cm',
  lastSteps: null
};

const HISTORY_KEY = 'bangunDatarHistory';
const UNIT_KEY = 'bangunDatarUnit';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const shapeGrid = $('#shapeGrid');
const modeList = $('#modeList');
const inputFields = $('#inputFields');
const inputForm = $('#inputForm');
const workSteps = $('#workSteps');
const formHint = $('#formHint');
const stepTabs = $$('.step-tab');

function goToStep(n) {
  $$('.nb-section').forEach((sec) => {
    sec.classList.toggle('is-hidden', Number(sec.dataset.stepPanel) !== n);
  });
  stepTabs.forEach((tab) => {
    const t = Number(tab.dataset.step);
    tab.classList.toggle('is-active', t === n);
    tab.classList.toggle('is-done', t < n);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

$$('.back-link').forEach((btn) => {
  btn.addEventListener('click', () => goToStep(Number(btn.dataset.back)));
});

shapeGrid.addEventListener('click', (e) => {
  const card = e.target.closest('.shape-card');
  if (!card) return;
  const key = card.dataset.shape;
  state.shape = key;
  renderShapeStep(key);
  goToStep(2);
});

function renderShapeStep(key) {
  const data = shapesData[key];
  $('#shapeTitle').textContent = data.name;
  $('#shapeDesc').textContent = data.desc;
  $('#shapeMiniIcon').innerHTML = `<svg viewBox="0 0 100 100"><path d="${shapeIconPaths[key]}" fill="var(--highlight)" fill-opacity="0.35" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  modeList.innerHTML = '';
  data.modes.forEach((mode) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'mode-item';
    item.dataset.modeId = mode.id;
    item.innerHTML = `<span>${mode.label}</span><span class="tag ${mode.metric}">${mode.metric === 'luas' ? 'Luas' : 'Keliling'}</span>`;
    item.addEventListener('click', () => {
      state.mode = mode;
      renderInputStep();
      goToStep(3);
    });
    modeList.appendChild(item);
  });
}

function renderInputStep() {
  const mode = state.mode;
  $('#modeTitle').textContent = `${shapesData[state.shape].name} — ${mode.label}`;
  inputFields.innerHTML = '';
  formHint.hidden = true;

  mode.inputs.forEach((field) => {
    const wrap = document.createElement('div');
    wrap.className = 'field';
    const unitLabel = field.type === 'luas' ? `${state.unit}²` : state.unit;
    wrap.innerHTML = `
      <label for="f_${field.id}">${field.label}</label>
      <div class="field-input-wrap">
        <input type="number" inputmode="decimal" step="any" min="0" id="f_${field.id}" data-key="${field.id}" placeholder="0" required>
        <span class="unit-suffix">${unitLabel}</span>
      </div>
    `;
    inputFields.appendChild(wrap);
  });

  const firstInput = inputFields.querySelector('input');
  if (firstInput) setTimeout(() => firstInput.focus(), 50);
}

$('#fillExampleBtn').addEventListener('click', () => {
  inputFields.querySelectorAll('input').forEach((inp) => {
    const sample = Math.floor(Math.random() * 18) + 3;
    inp.value = sample;
  });
});

inputForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const mode = state.mode;
  const values = {};
  let valid = true;

  inputFields.querySelectorAll('input').forEach((inp) => {
    const num = parseFloat(inp.value.replace(',', '.'));
    if (isNaN(num) || num < 0) valid = false;
    values[inp.dataset.key] = num;
  });

  if (!valid) {
    formHint.textContent = 'Isi semua kotak dengan angka positif ya.';
    formHint.hidden = false;
    return;
  }

  let steps;
  try {
    steps = mode.calculate(values);
  } catch (err) {
    formHint.textContent = 'Waduh, ada yang salah hitung. Coba periksa lagi angkanya.';
    formHint.hidden = false;
    return;
  }

  const hasNegative = steps.some((s) => !isFinite(s.value) || s.value < 0);
  if (hasNegative) {
    formHint.textContent = 'Hasil hitungan negatif atau tidak valid — coba periksa lagi angka yang kamu tulis ya.';
    formHint.hidden = false;
    return;
  }

  formHint.hidden = true;
  state.lastSteps = steps;
  renderResultStep(steps, values);
  saveToHistory(steps, values);
  goToStep(4);
});

function unitSuffix(unitType) {
  return unitType === 'luas' ? `${state.unit}²` : state.unit;
}

function renderResultStep(steps) {
  $('#resultShapeTitle').textContent = shapesData[state.shape].name;
  $('#resultModeLabel').textContent = state.mode.label;
  workSteps.innerHTML = '';

  steps.forEach((s) => {
    const div = document.createElement('div');
    div.className = 'work-step';
    div.innerHTML = `
      <div class="ws-label">${s.label}</div>
      <div class="ws-formula">${s.formula}</div>
      <div class="ws-result">= ${fmtResult(s.value)} ${unitSuffix(s.unitType)}</div>
    `;
    workSteps.appendChild(div);
  });

  const stamp = $('#resultStamp');
  stamp.style.animation = 'none';
  void stamp.offsetWidth;
  stamp.style.animation = '';
}

$('#calcAgainBtn').addEventListener('click', () => {
  goToStep(3);
});

$('#copyResultBtn').addEventListener('click', () => {
  if (!state.lastSteps) return;
  const text = `${shapesData[state.shape].name} — ${state.mode.label}\n` +
    state.lastSteps.map((s) => `${s.label}: ${s.formula} = ${fmtResult(s.value)} ${unitSuffix(s.unitType)}`).join('\n');
  navigator.clipboard?.writeText(text).then(() => {
    const btn = $('#copyResultBtn');
    const original = btn.textContent;
    btn.textContent = '✓ Tersalin!';
    setTimeout(() => { btn.textContent = original; }, 1500);
  }).catch(() => {});
});

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch { return []; }
}
function setHistory(list) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 15)));
}

function saveToHistory(steps, values) {
  const list = getHistory();
  const entry = {
    id: Date.now(),
    shapeKey: state.shape,
    shapeName: shapesData[state.shape].name,
    modeLabel: state.mode.label,
    unit: state.unit,
    resultText: steps.map((s) => `${s.label}: ${fmtResult(s.value)} ${unitSuffix(s.unitType)}`).join(' · ')
  };
  list.unshift(entry);
  setHistory(list);
  renderHistory();
}

function renderHistory() {
  const list = getHistory();
  const historyList = $('#historyList');
  const historyEmpty = $('#historyEmpty');
  const clearBtn = $('#clearHistoryBtn');
  const badge = $('#historyBadge');

  historyList.innerHTML = '';
  if (list.length === 0) {
    historyEmpty.hidden = false;
    clearBtn.hidden = true;
    badge.hidden = true;
  } else {
    historyEmpty.hidden = true;
    clearBtn.hidden = false;
    badge.hidden = false;
    badge.textContent = list.length;

    list.forEach((entry) => {
      const card = document.createElement('div');
      card.className = 'history-card';
      card.innerHTML = `
        <button class="hist-del" title="Hapus catatan ini">✕</button>
        <h4>${entry.shapeName}</h4>
        <p>${entry.modeLabel}</p>
        <p>${entry.resultText}</p>
      `;
      card.querySelector('.hist-del').addEventListener('click', (ev) => {
        ev.stopPropagation();
        setHistory(getHistory().filter((h) => h.id !== entry.id));
        renderHistory();
      });
      card.addEventListener('click', () => {
        state.shape = entry.shapeKey;
        const modeObj = shapesData[entry.shapeKey].modes.find((m) => m.label === entry.modeLabel);
        if (modeObj) {
          state.mode = modeObj;
          renderShapeStep(entry.shapeKey);
          renderInputStep();
          goToStep(3);
          closeHistory();
        }
      });
      historyList.appendChild(card);
    });
  }
}

$('#clearHistoryBtn').addEventListener('click', () => {
  setHistory([]);
  renderHistory();
});

function openHistory() {
  $('#historyPanel').classList.add('is-open');
  $('#historyOverlay').classList.add('is-open');
}
function closeHistory() {
  $('#historyPanel').classList.remove('is-open');
  $('#historyOverlay').classList.remove('is-open');
}
$('#historyToggle').addEventListener('click', openHistory);
$('#historyClose').addEventListener('click', closeHistory);
$('#historyOverlay').addEventListener('click', closeHistory);

const unitSelect = $('#unitSelect');
unitSelect.addEventListener('change', () => {
  state.unit = unitSelect.value;
  localStorage.setItem(UNIT_KEY, state.unit);
  if (!$('#step3').classList.contains('is-hidden')) renderInputStep();
});

(function init() {
  const savedUnit = localStorage.getItem(UNIT_KEY);
  if (savedUnit) {
    state.unit = savedUnit;
    unitSelect.value = savedUnit;
  }

  renderHistory();
  goToStep(1);
})();
