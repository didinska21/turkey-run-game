export function mulberry32(seed) {
  let word = seed >>> 0;
  return () => {
    word = (word + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(word ^ (word >>> 15), 1 | word);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}
export const clamp = (number, low, high) => Math.max(low, Math.min(high, number));
export const lerp = (from, to, amount) => from + (to - from) * amount;
export const between = (rng, low, high) => low + rng() * (high - low);
export const choose = (rng, values) => values[Math.floor(rng() * values.length)];
export function seedFrom(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric >>> 0 : 7;
}
// A stateless hash keeps decorative rain and stars out of the gameplay RNG stream.
export function noise(index, seed = 0) {
  let x = Math.imul(index ^ seed ^ 0x45d9f3b, 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}
