/** «30%» из 0.3. */
export function percent(value: number): string {
  return Math.round(value * 100) + '%';
}
