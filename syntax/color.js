// Helpers for deriving the three shades a block category needs from one color.

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function parseHex(hex) {
  let digits = String(hex).trim().replace(/^#/, "")
  if (digits.length === 3) {
    digits = digits.replace(/./g, c => c + c)
  }
  if (!/^[0-9a-fA-F]{6}$/.test(digits)) {
    throw new Error(`Invalid hex color: ${hex}`)
  }
  const n = parseInt(digits, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function toHex(rgb) {
  const digits = rgb.map(c =>
    clamp(Math.round(c), 0, 255).toString(16).padStart(2, "0"),
  )
  return `#${digits.join("")}`
}

export function rgbToHsl([r, g, b]) {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) {
    return [0, 0, l]
  }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h
  switch (max) {
    case r:
      h = (g - b) / d + (g < b ? 6 : 0)
      break
    case g:
      h = (b - r) / d + 2
      break
    default:
      h = (r - g) / d + 4
  }
  return [h / 6, s, l]
}

export function hslToRgb([h, s, l]) {
  if (s === 0) {
    const v = l * 255
    return [v, v, v]
  }
  const hueToChannel = (p, q, t) => {
    if (t < 0) {
      t += 1
    }
    if (t > 1) {
      t -= 1
    }
    if (t < 1 / 6) {
      return p + (q - p) * 6 * t
    }
    if (t < 1 / 2) {
      return q
    }
    if (t < 2 / 3) {
      return p + (q - p) * (2 / 3 - t) * 6
    }
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return [
    hueToChannel(p, q, h + 1 / 3) * 255,
    hueToChannel(p, q, h) * 255,
    hueToChannel(p, q, h - 1 / 3) * 255,
  ]
}

// Shift the lightness of a color by `delta` percentage points.
export function shiftLightness(hex, delta) {
  const [h, s, l] = rgbToHsl(parseHex(hex))
  return toHex(hslToRgb([h, s, clamp(l + delta / 100, 0, 1)]))
}

// Scratch uses a slightly darker shade for number dropdowns and the define
// outline (secondary), and a darker one again for strokes and empty boolean
// slots (tertiary). These offsets match the built-in palette closely.
export function deriveShades(color) {
  const primary = toHex(parseHex(color))
  return {
    primary,
    secondary: shiftLightness(primary, -10),
    tertiary: shiftLightness(primary, -15),
  }
}

// The high contrast theme lightens the fills so that black text stays
// readable, and keeps the original tertiary for strokes.
export function deriveHighContrastShades(shades) {
  return {
    primary: shiftLightness(shades.primary, 10),
    secondary: shiftLightness(shades.primary, 20),
    tertiary: shades.tertiary,
  }
}
