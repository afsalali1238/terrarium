export const lerp = (a, b, t) => a + (b - a) * t
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v))
export const dist = (x1, y1, x2, y2) => Math.sqrt((x2-x1)**2 + (y2-y1)**2)
export const mapRange = (v, inMin, inMax, outMin, outMax) =>
  outMin + (v - inMin) / (inMax - inMin) * (outMax - outMin)
