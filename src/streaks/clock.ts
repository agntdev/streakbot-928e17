/** The one clock seam used by all streak calculations. */
let source: () => number = () => Date.now();

export function now(): number {
  return source();
}

/** Test hook. Production code always uses the system clock. */
export function setClockForTests(clock: (() => number) | undefined): void {
  source = clock ?? (() => Date.now());
}
