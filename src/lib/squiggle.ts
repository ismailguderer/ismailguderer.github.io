// Builds a synthetic nanopore-style current trace: piecewise-constant
// "events" (one per k-mer) with Gaussian noise, like raw ONT signal.
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function squigglePath(width = 1200, height = 140, seed = 7): string {
  const rand = mulberry32(seed);
  const gauss = () => {
    const u = 1 - rand(), v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  const step = 2;
  const mid = height / 2;
  const pts: string[] = [];
  let x = 0;
  let level = 0;
  // open pore at the start, then the read enters
  const openPore = 90;
  while (x <= width) {
    let dwell: number;
    if (x < openPore) {
      level = -height * 0.36;
      dwell = openPore;
    } else {
      level = (rand() - 0.5) * height * 0.62;
      dwell = 8 + Math.floor(rand() * 26);
    }
    for (let i = 0; i < dwell && x <= width; i += step, x += step) {
      const y = mid + level + gauss() * height * 0.025;
      pts.push(`${x},${y.toFixed(1)}`);
    }
  }
  return 'M' + pts.join('L');
}
