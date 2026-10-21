// Generates src/data/squiggle.json: the hidden word for the hero trace.
//
//   node scripts/squiggle-model.mjs HELLO
//
// 1. Reverse-translates the word (one-letter amino acid codes; O = Pyl/TAG,
//    U = Sec/TGA) into DNA, choosing among synonymous codons.
// 2. Adds flanking bases so every event has full 9-mer context.
// 3. Searches codon + flank choices that maximise the smallest current step
//    between neighbouring events, so every boundary is visible.
// Levels come from ONT's R10.4.1 e8.2 400 bps 9-mer table (nanoporetech/kmer_models).
// The base at 9-mer index 6 dominates the level, so event i = seq[i-6 .. i+2].
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const TABLE_URL =
  'https://raw.githubusercontent.com/nanoporetech/kmer_models/master/dna_r10.4.1_e8.2_400bps/9mer_levels_v1.txt';
const K = 9, POS = 6, LEFT = POS + 1, RIGHT = K - POS - 1; // flank lengths
const ITER = 60000;

const CODONS = {
  A: ['GCT', 'GCC', 'GCA', 'GCG'], R: ['CGT', 'CGC', 'CGA', 'CGG', 'AGA', 'AGG'],
  N: ['AAT', 'AAC'], D: ['GAT', 'GAC'], C: ['TGT', 'TGC'], Q: ['CAA', 'CAG'],
  E: ['GAA', 'GAG'], G: ['GGT', 'GGC', 'GGA', 'GGG'], H: ['CAT', 'CAC'],
  I: ['ATT', 'ATC', 'ATA'], L: ['TTA', 'TTG', 'CTT', 'CTC', 'CTA', 'CTG'],
  K: ['AAA', 'AAG'], M: ['ATG'], F: ['TTT', 'TTC'], P: ['CCT', 'CCC', 'CCA', 'CCG'],
  S: ['TCT', 'TCC', 'TCA', 'TCG', 'AGT', 'AGC'], T: ['ACT', 'ACC', 'ACA', 'ACG'],
  W: ['TGG'], Y: ['TAT', 'TAC'], V: ['GTT', 'GTC', 'GTA', 'GTG'],
  O: ['TAG'], U: ['TGA'], // pyrrolysine, selenocysteine (recoded stops)
};
CODONS.B = [...CODONS.D, ...CODONS.N];
CODONS.Z = [...CODONS.E, ...CODONS.Q];
CODONS.J = [...CODONS.I, ...CODONS.L];
CODONS.X = Object.values(CODONS).flat();

const word = (process.argv[2] || 'HI').toUpperCase();
const bad = [...word].filter((c) => !CODONS[c]);
if (bad.length) {
  console.error(`No codon for: ${bad.join(', ')}`);
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const tableArg = process.argv.indexOf('--table');
let text;
if (tableArg > 0) text = readFileSync(process.argv[tableArg + 1], 'utf8');
else {
  console.log('Downloading k-mer table...');
  const res = await fetch(TABLE_URL);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  text = await res.text();
}
const level = new Map();
for (const line of text.split('\n')) {
  const [k, v] = line.split('\t');
  if (k) level.set(k, +v);
}

let seed = 12345;
const rand = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32);
const pick = (a) => a[Math.floor(rand() * a.length)];
const base = () => pick('ACGT');

// events: the last left-flank base (unlabelled), then every coding base
function score(c) {
  const seq = c.left + c.codons.join('') + c.right;
  const lv = [];
  for (let i = POS; i < seq.length - RIGHT; i++) lv.push(level.get(seq.slice(i - POS, i + RIGHT + 1)));
  let min = Infinity;
  for (let i = 1; i < lv.length; i++) min = Math.min(min, Math.abs(lv[i] - lv[i - 1]));
  return { min, lv, seq };
}
const random = () => ({
  left: Array.from({ length: LEFT }, base).join(''),
  right: Array.from({ length: RIGHT }, base).join(''),
  codons: [...word].map((aa) => pick(CODONS[aa])),
});
const mutate = (c) => {
  const n = { ...c, codons: [...c.codons] };
  const r = rand();
  if (r < 0.4) { const i = Math.floor(rand() * word.length); n.codons[i] = pick(CODONS[word[i]]); }
  else if (r < 0.8) { const i = Math.floor(rand() * LEFT); n.left = n.left.slice(0, i) + base() + n.left.slice(i + 1); }
  else { const i = Math.floor(rand() * RIGHT); n.right = n.right.slice(0, i) + base() + n.right.slice(i + 1); }
  return n;
};

let best = random(), bestS = score(best);
for (let t = 0; t < ITER; t++) {
  const c = t % 3 ? mutate(best) : random();
  const s = score(c);
  if (s.min > bestS.min) { best = c; bestS = s; }
}

const dna = best.codons.join('');
const events = bestS.lv.map((lvl, i) => ({
  base: bestS.seq[LEFT - 1 + i],
  kmer: bestS.seq.slice(LEFT - 1 + i - POS, LEFT + i + RIGHT),
  level: +lvl.toFixed(3),
  label: i > 0,
}));
const out = {
  word, dna, left: best.left, right: best.right,
  minStep: +bestS.min.toFixed(3),
  source: 'nanoporetech/kmer_models dna_r10.4.1_e8.2_400bps/9mer_levels_v1.txt',
  events,
};
const target = join(here, '..', 'src', 'data', 'squiggle.json');
writeFileSync(target, JSON.stringify(out, null, 2) + '\n');
console.log(`${word} -> ${dna}  (flanks ${best.left}|${best.right}, min step ${out.minStep})`);
console.log(`Wrote ${target}`);
