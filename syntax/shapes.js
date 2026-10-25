// Block shapes are described by features instead of a fixed list of names:
//
//   top      "notch" | "hat" | "cat" | "define" | "define-cat"
//   bottom   "puzzle" | "flat"           (flat is a cap, nothing fits below)
//   mouth    boolean                      (takes a body, closed with `end`)
//   output   null | "round" | "hex"       (reporter or boolean)
//   ring     boolean                      (round block holding another block)
//   outline  boolean                      (the inner outline of a define hat)
//   role     null | "else" | "end"        (parser keywords, never rendered)
//
// Any combination can be used, so a hat with a mouth is `{ top: "hat",
// mouth: true }`. Shapes have a canonical name made of words, such as
// "hat c" or "c cap", and the words can be used wherever a shape name is
// expected. Packs can register their own names with `shapes: { name: def }`.

export const tops = ["notch", "hat", "cat", "define", "define-cat"]
export const bottoms = ["puzzle", "flat"]
export const outputs = ["round", "hex"]

const defaults = {
  top: "notch",
  bottom: "puzzle",
  mouth: false,
  output: null,
  ring: false,
  outline: false,
  role: null,
}

export const shapes = Object.create(null)

export function canonicalName(shape) {
  if (shape.outline) {
    return "outline"
  }
  if (shape.ring) {
    return "ring"
  }
  if (shape.output === "round") {
    return "reporter"
  }
  if (shape.output === "hex") {
    return "boolean"
  }
  if (shape.role === "else") {
    return "celse"
  }
  if (shape.role === "end") {
    return "cend"
  }
  const words = []
  if (shape.top !== "notch") {
    words.push(shape.top)
  }
  if (shape.mouth) {
    words.push("c")
  }
  if (shape.bottom === "flat") {
    words.push("cap")
  }
  return words.length ? words.join(" ") : "stack"
}

export function normalizeShape(def) {
  if (!def || typeof def !== "object") {
    throw new Error(`Invalid shape: ${JSON.stringify(def)}`)
  }
  // A shape that was normalized before carries its name; that is fine.
  const { name: _name, ...rest } = def
  def = rest
  for (const key of Object.keys(def)) {
    if (!(key in defaults)) {
      throw new Error(`Unknown shape feature '${key}'`)
    }
  }
  const shape = { ...defaults, ...def }
  if (!tops.includes(shape.top)) {
    throw new Error(`Unknown shape top '${shape.top}'`)
  }
  if (!bottoms.includes(shape.bottom)) {
    throw new Error(`Unknown shape bottom '${shape.bottom}'`)
  }
  if (shape.output != null && !outputs.includes(shape.output)) {
    throw new Error(`Unknown shape output '${shape.output}'`)
  }
  if (shape.ring) {
    shape.output = "round"
  }
  if (shape.output || shape.outline) {
    // Only commands have a top, a bottom and a mouth.
    shape.top = "notch"
    shape.bottom = "puzzle"
    shape.mouth = false
  }
  shape.name = canonicalName(shape)
  return Object.freeze(shape)
}

// Apply one word of a shape description, such as "hat" or "cap", to a shape.
// Returns null if the word is not a shape word.
export function applyShapeWord(shape, word) {
  switch (word) {
    case "stack":
      return { ...defaults }
    case "hat":
    case "define":
      return { ...shape, top: word, output: null, ring: false }
    case "cat":
      return {
        ...shape,
        top: shape.top === "define" ? "define-cat" : "cat",
        output: null,
        ring: false,
      }
    case "define-cat":
      return { ...shape, top: word, output: null, ring: false }
    case "c":
      return { ...shape, mouth: true, output: null, ring: false }
    case "cap":
      return { ...shape, bottom: "flat", output: null, ring: false }
    case "reporter":
      return { ...defaults, output: "round" }
    case "boolean":
      return { ...defaults, output: "hex" }
    case "ring":
      return { ...defaults, output: "round", ring: true }
    default:
      return null
  }
}

export function isShapeWord(word) {
  return applyShapeWord(defaults, word) != null
}

// Build a shape from words such as "hat c cap", starting from `base`.
export function shapeFromWords(words, base) {
  let shape = base ? { ...base } : { ...defaults }
  for (const word of words) {
    const next = applyShapeWord(shape, word)
    if (!next) {
      throw new Error(`Unknown shape '${words.join(" ")}'`)
    }
    shape = next
  }
  return normalizeShape(shape)
}

export function addShape(name, def) {
  if (name in shapes) {
    throw new Error(`Shape '${name}' is already registered`)
  }
  shapes[name] = normalizeShape(def)
  return shapes[name]
}

// Look a shape up by name. The name may be a registered name or a list of
// shape words; a shape described by words is remembered under that name.
export function resolveShape(name) {
  if (name == null) {
    return shapes.stack
  }
  if (typeof name === "object") {
    return normalizeShape(name)
  }
  if (name in shapes) {
    return shapes[name]
  }
  const shape = shapeFromWords(name.split(/ +/).filter(x => x))
  shapes[name] = shape
  return shape
}

// The name to store for a shape given as a name or as a feature object.
export function shapeName(nameOrDef) {
  if (nameOrDef == null) {
    return "stack"
  }
  if (typeof nameOrDef === "object") {
    const shape = normalizeShape(nameOrDef)
    if (!(shape.name in shapes)) {
      shapes[shape.name] = shape
    }
    return shape.name
  }
  resolveShape(nameOrDef)
  return nameOrDef
}

// The names scratchblocks used, kept so that existing block definitions and
// `info.shape` values keep working.
const builtin = {
  stack: {},
  cap: { bottom: "flat" },
  hat: { top: "hat" },
  cat: { top: "cat" },
  define: { top: "define" },
  "define-hat": { top: "define" },
  "define-cat": { top: "define-cat" },
  c: { mouth: true },
  "c-block": { mouth: true },
  "c-block cap": { mouth: true, bottom: "flat" },
  celse: { role: "else" },
  cend: { role: "end" },
  reporter: { output: "round" },
  boolean: { output: "hex" },
  ring: { ring: true },
  outline: { outline: true },
}
for (const name of Object.keys(builtin)) {
  addShape(name, builtin[name])
}
