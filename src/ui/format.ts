/** «30%» из 0.3. */
export function percent(value: number): string {
  return Math.round(value * 100) + '%';
}

/** «1 ход», «2 хода», «5 ходов». */
export function turns(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return n + ' ход';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return n + ' хода';
  return n + ' ходов';
}
