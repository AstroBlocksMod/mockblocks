import { extensions, aliasExtensions } from "./extensions.js"
import {
  categories,
  registeredPacks,
  addCategory,
  normalizeCategory,
  notifyChange,
} from "./registry.js"
import {
  addShape,
  normalizeShape,
  resolveShape,
  shapeName,
  isShapeWord,
  packShapeNames,
  checkPackShapeName,
} from "./shapes.js"
import scratchPack from "./packs/scratch.js"

export const aliasCategories = Object.assign(Object.create(null), {
  gray: "grey",
  other: "grey",
})

// Shapes that may be set with `:: shape` overrides.
const overrideShapes = [
  "hat",
  "cap",
  "stack",
  "boolean",
  "reporter",
  "ring",
  "cat",
]

// languages that should be displayed right to left
export const rtlLanguages = ["ar", "ckb", "fa", "he"]

const inputNumberPat = /%([0-9]+)/
export const inputPat = /(%[a-zA-Z0-9](?:\.[a-zA-Z0-9]+)?)/
const inputPatGlobal = new RegExp(inputPat.source, "g")
export const iconPat = /(@[a-zA-Z]+)/
const splitPat = new RegExp(`${inputPat.source}|${iconPat.source}| +`, "g")

export const hexColorPat = /^#(?:[0-9a-fA-F]{3}){1,2}?$/

export function parseInputNumber(part) {
  const m = inputNumberPat.exec(part)
  return m ? +m[1] : 0
}

// used for procDefs
export function parseSpec(spec) {
  const parts = spec.split(splitPat).filter(x => x)
  const inputs = parts.filter(p => inputPat.test(p))
  return {
    spec: spec,
    parts: parts,
    inputs: inputs,
    hash: hashSpec(spec),
  }
}

export function hashSpec(spec) {
  return minifyHash(spec.replace(inputPatGlobal, " _ "))
}

export function minifyHash(hash) {
  return hash
    .replace(/_/g, " _ ")
    .replace(/ +/g, " ")
    .replace(/[,%?:]/g, "")
    .replace(/ß/g, "ss")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(". . .", "...")
    .replace(/^…$/, "...")
    .trim()
    .toLowerCase()
}

export const unicodeIcons = {
  "@greenFlag": "⚑",
  "@turnRight": "↻",
  "@turnLeft": "↺",
  "@addInput": "▸",
  "@delInput": "◂",
}

/*****************************************************************************/

// Every known block, by id, and in registration order.
export const blocksById = Object.create(null)
export const allBlocks = []

// Words that mean something else after `::`. A category with one of these
// names could never be picked with an override, or would hide the keyword.
function isReservedOverrideWord(name) {
  return (
    isShapeWord(name) ||
    packShapeNames.has(name) ||
    name === "loop" ||
    name === "reset" ||
    name in aliasCategories ||
    Object.prototype.hasOwnProperty.call(extensions, name) ||
    Object.prototype.hasOwnProperty.call(aliasExtensions, name)
  )
}

export function isKnownCategory(name) {
  return (
    name in categories ||
    Object.prototype.hasOwnProperty.call(extensions, name) ||
    Object.prototype.hasOwnProperty.call(aliasExtensions, name)
  )
}

function normalizeBlock(def, pack, packCategories, packShapes) {
  if (!def.spec) {
    throw new Error(
      `Missing spec in pack '${pack.name}': ${JSON.stringify(def)}`,
    )
  }
  // A shape is a registered name, a list of shape words such as "hat c", or a
  // feature object.
  const label = def.id || def.selector || def.spec
  let shape
  if (typeof def.shape === "string" && packShapes.has(def.shape)) {
    shape = def.shape
  } else {
    try {
      shape = shapeName(def.shape)
    } catch (e) {
      throw new Error(`${e.message} for block '${label}'`, { cause: e })
    }
  }
  let id = def.id
  if (!id) {
    // Scratch 2 blocks are identified by their selector. Anything else gets an
    // id made from the pack name, the shape and the spec, so a stack block and
    // a reporter with the same text can both be registered.
    id = def.selector
      ? `sb2:${def.selector}`
      : `${pack.name}:${shape}:${hashSpec(def.spec)}`
  }
  const category = def.category || pack.category
  if (!category) {
    throw new Error(`Missing category for block '${id}'`)
  }
  if (
    !isKnownCategory(category) &&
    !aliasCategories[category] &&
    !packCategories.has(category)
  ) {
    throw new Error(`Unknown category '${category}' for block '${id}'`)
  }
  return {
    explicitId: !!(def.id || def.selector),
    id, // Used for Scratch 3 translations
    spec: def.spec, // Used for Scratch 2 translations
    parts: def.spec.split(splitPat).filter(x => x),
    selector: def.selector || `sb3:${id}`, // Used for JSON marshalling
    inputs: def.inputs == null ? [] : def.inputs,
    shape,
    category,
    hasLoopArrow: !!def.hasLoopArrow,
    pack: pack.name,
  }
}

/* Register a pack of blocks.
 *
 *   mockblocks.registerPack({
 *     name: "rockets",
 *     categories: { rocket: { color: "#4c6ef5" } },
 *     shapes: { "launch-hat": { top: "hat", mouth: true } },
 *     blocks: [
 *       { id: "rockets.launch", spec: "launch %1", inputs: ["%s"], shape: "stack", category: "rocket" },
 *       { id: "rockets.countdown", spec: "countdown from %1", inputs: ["%n"], shape: "launch-hat", category: "rocket" },
 *     ],
 *     aliases: { "lift off %1": "rockets.launch" },
 *   })
 *
 * Nothing is registered if any part of the pack is invalid.
 */
export function registerPack(pack) {
  if (!pack || typeof pack.name !== "string" || !pack.name) {
    throw new Error("A pack needs a name")
  }
  if (pack.name in registeredPacks) {
    throw new Error(`Pack '${pack.name}' is already registered`)
  }

  const newCategories = Object.entries(pack.categories || {}).map(
    ([name, def]) => {
      if (name in categories) {
        throw new Error(`Category '${name}' is already registered`)
      }
      if (isReservedOverrideWord(name)) {
        throw new Error(
          `Category name '${name}' is already an override keyword or extension`,
        )
      }
      return normalizeCategory(name, def)
    },
  )
  const packCategories = new Set(newCategories.map(c => c.name))

  const newShapes = Object.entries(pack.shapes || {}).map(([name, def]) => {
    checkPackShapeName(name)
    if (packShapeNames.has(name)) {
      throw new Error(`Shape '${name}' is already registered`)
    }
    // Shape names and category names are both picked with `::`, so they
    // must not overlap.
    if (isKnownCategory(name) || packCategories.has(name)) {
      throw new Error(`Shape name '${name}' is already a category`)
    }
    try {
      return [name, normalizeShape(def)]
    } catch (e) {
      throw new Error(`${e.message} in shape '${name}'`, { cause: e })
    }
  })
  const packShapes = new Set(newShapes.map(([name]) => name))

  const seen = new Set()
  const blocks = (pack.blocks || []).map(def => {
    const { explicitId, ...info } = normalizeBlock(
      def,
      pack,
      packCategories,
      packShapes,
    )
    if (blocksById[info.id] || seen.has(info.id)) {
      throw new Error(
        explicitId
          ? `Duplicate ID: ${info.id}`
          : `Duplicate ID: ${info.id} (two blocks with the same text and shape need their own ids)`,
      )
    }
    seen.add(info.id)
    return info
  })

  const aliases = Object.entries(pack.aliases || {})
  for (const [alias, id] of aliases) {
    if (!blocksById[id] && !seen.has(id)) {
      throw new Error(`Invalid alias '${id}'`)
    }
    if (alias in english.aliases) {
      throw new Error(`Duplicate alias '${alias}'`)
    }
  }

  // Everything checked out, so apply.
  newCategories.forEach(addCategory)
  for (const [name, shape] of newShapes) {
    addShape(name, shape, true)
  }
  for (const info of blocks) {
    blocksById[info.id] = info
    allBlocks.push(info)
    english.commands[info.id] = info.spec
    if (english.blocksByHash) {
      addBlockToLanguage(english, info, info.spec)
    }
  }
  for (const [alias, id] of aliases) {
    english.aliases[alias] = id
    if (english.blocksByHash) {
      addAliasToLanguage(english, alias, id)
    }
  }
  registeredPacks[pack.name] = pack
  notifyChange()
  return pack
}

/*****************************************************************************/

export const allLanguages = {}

function addBlockToLanguage(language, block, nativeSpec) {
  const blocksByHash = language.blocksByHash

  const nativeHash = hashSpec(nativeSpec)
  if (!blocksByHash[nativeHash]) {
    blocksByHash[nativeHash] = []
  }
  blocksByHash[nativeHash].push(block)

  // fallback image replacement, for languages without aliases
  const m = iconPat.exec(block.spec)
  if (m) {
    const image = m[0]
    const hash = nativeHash.replace(hashSpec(image), unicodeIcons[image])
    if (!blocksByHash[hash]) {
      blocksByHash[hash] = []
    }
    blocksByHash[hash].push(block)
  }
}

function addAliasToLanguage(language, alias, blockId) {
  const block = blocksById[blockId]
  if (block === undefined) {
    throw new Error(`Invalid alias '${blockId}'`)
  }
  const aliasHash = hashSpec(alias)
  if (!language.blocksByHash[aliasHash]) {
    language.blocksByHash[aliasHash] = []
  }
  language.blocksByHash[aliasHash].push(block)

  if (!language.nativeAliases[blockId]) {
    language.nativeAliases[blockId] = []
  }
  language.nativeAliases[blockId].push(alias)
}

function loadLanguage(code, language) {
  language.blocksByHash = {}
  language.nativeAliases = {}

  Object.keys(language.commands).forEach(blockId => {
    const block = blocksById[blockId]
    if (!block) {
      throw new Error(`Unknown ID: ${blockId}`)
    }
    addBlockToLanguage(language, block, language.commands[blockId])
  })

  Object.keys(language.aliases).forEach(alias => {
    addAliasToLanguage(language, alias, language.aliases[alias])
  })

  // Some English blocks were renamed between Scratch 2 and Scratch 3. Wire them
  // into language.blocksByHash
  Object.keys(language.renamedBlocks || {}).forEach(alt => {
    const id = language.renamedBlocks[alt]
    if (!blocksById[id]) {
      throw new Error(`Unknown ID: ${id}`)
    }
    const block = blocksById[id]
    const hash = hashSpec(alt)
    if (!english.blocksByHash[hash]) {
      english.blocksByHash[hash] = []
    }
    english.blocksByHash[hash].push(block)
  })

  language.nativeDropdowns = {}
  Object.keys(language.dropdowns).forEach(name => {
    const nativeName = language.dropdowns[name]
    language.nativeDropdowns[nativeName] = name
  })

  language.code = code
  allLanguages[code] = language
}
export function loadLanguages(languages) {
  Object.keys(languages).forEach(code => loadLanguage(code, languages[code]))
}

export const english = {
  aliases: {
    "turn ccw %1 degrees": "MOTION_TURNLEFT",
    "turn left %1 degrees": "MOTION_TURNLEFT",
    "turn cw %1 degrees": "MOTION_TURNRIGHT",
    "turn right %1 degrees": "MOTION_TURNRIGHT",
    "when flag clicked": "EVENT_WHENFLAGCLICKED",
    "when gf clicked": "EVENT_WHENFLAGCLICKED",
    "when green flag clicked": "EVENT_WHENFLAGCLICKED",
  },

  renamedBlocks: {
    "say %1 for %2 secs": "LOOKS_SAYFORSECS",
    "think %1 for %2 secs": "LOOKS_THINKFORSECS",
    "play sound %1": "SOUND_PLAY",
    "wait %1 secs": "CONTROL_WAIT",
    clear: "pen.clear",
  },

  definePrefix: ["define"],
  defineSuffix: [],

  // For ignoring the lt sign in the "when distance < _" block
  ignorelt: ["when distance"],

  // Valid arguments to "of" dropdown, for resolving ambiguous situations
  math: [
    "abs",
    "floor",
    "ceiling",
    "sqrt",
    "sin",
    "cos",
    "tan",
    "asin",
    "acos",
    "atan",
    "ln",
    "log",
    "e ^",
    "10 ^",
  ],

  // Language name is needed for the English locale as well
  name: "English",

  // Valid arguments to "go to" face sensing dropdown, for resolving ambiguous situations
  faceParts: [
    "nose",
    "mouth",
    "left eye",
    "right eye",
    "between eyes",
    "left ear",
    "right ear",
    "top of head",
  ],

  // Valid arguments to "sound effect" dropdown, for resolving ambiguous situations
  soundEffects: ["pitch", "pan left/right"],

  // Valid arguments to "microbit when" dropdown
  microbitWhen: ["moved", "shaken", "jumped"],

  // For detecting the "stop" cap / stack block
  osis: ["other scripts in sprite", "other scripts in stage"],

  dropdowns: {},

  commands: {},
}

// The built-in Scratch blocks are the first pack. Packs registered later are
// wired into the English language as they arrive.
registerPack(scratchPack)
loadLanguages({
  en: english,
})

/*****************************************************************************/

function registerCheck(id, func) {
  if (!blocksById[id]) {
    throw new Error(`Unknown ID: ${id}`)
  }
  blocksById[id].accepts = func
}

function specialCase(id, func) {
  if (!blocksById[id]) {
    throw new Error(`Unknown ID: ${id}`)
  }
  blocksById[id].specialCase = func
}

function disambig(id1, id2, test) {
  registerCheck(id1, (_, children, lang) => {
    return test(children, lang)
  })
  registerCheck(id2, (_, children, lang) => {
    return !test(children, lang)
  })
}

disambig("OPERATORS_MATHOP", "SENSING_OF", (children, lang) => {
  // Operators if math function, otherwise sensing "attribute of" block
  const first = children[0]
  if (!first.isInput) {
    return
  }
  const name = first.value
  return lang.math.includes(name)
})

disambig("SOUND_CHANGEEFFECTBY", "LOOKS_CHANGEEFFECTBY", (children, lang) => {
  // Sound if sound effect, otherwise default to graphic effect
  for (const child of children) {
    if (child.shape === "dropdown") {
      const name = child.value
      for (const effect of lang.soundEffects) {
        if (minifyHash(effect) === minifyHash(name)) {
          return true
        }
      }
    }
  }
  return false
})

disambig("SOUND_SETEFFECTO", "LOOKS_SETEFFECTTO", (children, lang) => {
  // Sound if sound effect, otherwise default to graphic effect
  for (const child of children) {
    if (child.shape === "dropdown") {
      const name = child.value
      for (const effect of lang.soundEffects) {
        if (minifyHash(effect) === minifyHash(name)) {
          return true
        }
      }
    }
  }
  return false
})

disambig("DATA_LENGTHOFLIST", "OPERATORS_LENGTH", (children, _lang) => {
  // List block if dropdown, otherwise operators
  const last = children[children.length - 1]
  if (!last.isInput) {
    return
  }
  return last.shape === "dropdown"
})

disambig("DATA_LISTCONTAINSITEM", "OPERATORS_CONTAINS", (children, _lang) => {
  // List block if dropdown, otherwise operators
  const first = children[0]
  if (!first.isInput) {
    return
  }
  return first.shape === "dropdown"
})

disambig("pen.setColor", "pen.setHue", (children, _lang) => {
  // Color block if color input, otherwise numeric
  const last = children[children.length - 1]
  // If variable, assume color input, since the RGBA hack is common.
  // TODO fix Scratch :P
  return (last.isInput && last.isColor) || last.isBlock
})

disambig("faceSensing.goToPart", "MOTION_GOTO", (children, lang) => {
  // Face sensing if face part, otherwise default to motion block
  for (const child of children) {
    if (child.shape === "dropdown") {
      const name = child.value
      for (const effect of lang.faceParts) {
        if (minifyHash(effect) === minifyHash(name)) {
          return true
        }
      }
    }
  }
  return false
})

disambig("microbit.whenGesture", "gdxfor.whenGesture", (children, lang) => {
  for (const child of children) {
    if (child.shape === "dropdown") {
      const name = child.value
      // Yes, "when shaken" gdxfor block exists. But microbit is more common.
      for (const effect of lang.microbitWhen) {
        if (minifyHash(effect) === minifyHash(name)) {
          return true
        }
      }
    }
  }
  return false
})

// This block does not need disambiguation in English;
// however, many other languages do require that.
disambig("ev3.buttonPressed", "microbit.isButtonPressed", (children, _lang) => {
  for (const child of children) {
    if (child.shape === "dropdown") {
      // EV3 "button pressed" block uses numeric identifier
      // and does not support "any".
      switch (minifyHash(child.value)) {
        case "1":
        case "2":
        case "3":
        case "4":
          return true
        default:
      }
    }
  }
  return false
})

specialCase("CONTROL_STOP", (_, children, lang) => {
  // Cap block unless argument is "other scripts in sprite"
  const last = children[children.length - 1]
  if (!last.isInput) {
    return
  }
  const value = last.value
  if (lang.osis.includes(value)) {
    return { ...blocksById.CONTROL_STOP, shape: "stack" }
  }
})

export function lookupHash(hash, info, children, languages) {
  for (const lang of languages) {
    if (Object.prototype.hasOwnProperty.call(lang.blocksByHash, hash)) {
      const collisions = lang.blocksByHash[hash]
      const parsed = resolveShape(info.shape)
      for (let block of collisions) {
        // A `( )` line only matches round blocks, a `< >` line only booleans.
        const candidate = resolveShape(block.shape)
        if (parsed.output && parsed.output !== candidate.output) {
          continue
        }
        if (collisions.length > 1) {
          // Only check in case of collision;
          // perform "disambiguation"
          if (block.accepts && !block.accepts(info, children, lang)) {
            continue
          }
        }
        if (block.specialCase) {
          block = block.specialCase(info, children, lang) || block
        }
        return { type: block, lang: lang }
      }
    }
  }
}

export function lookupDropdown(name, languages) {
  for (const lang of languages) {
    if (Object.prototype.hasOwnProperty.call(lang.nativeDropdowns, name)) {
      return lang.nativeDropdowns[name]
    }
  }
}

export function applyOverrides(info, overrides) {
  for (const name of overrides) {
    if (hexColorPat.test(name)) {
      info.color = name
      info.category = ""
      info.categoryIsDefault = false
    } else if (
      aliasCategories[name] &&
      isKnownCategory(aliasCategories[name])
    ) {
      info.category = aliasCategories[name]
      info.categoryIsDefault = false
    } else if (isKnownCategory(name)) {
      info.category = name
      info.categoryIsDefault = false
    } else if (name === "cat" && resolveShape(info.shape).top === "define") {
      info.shape = "define-cat"
      info.shapeIsDefault = false
    } else if (overrideShapes.includes(name)) {
      info.shape = name
      info.shapeIsDefault = false
    } else if (name === "loop") {
      info.hasLoopArrow = true
    } else if (name === "+" || name === "-") {
      info.diff = name
    } else if (name === "reset") {
      info.categoryIsDefault = false
      info.isReset = true
    }
  }
}

export function blockName(block) {
  const words = []
  for (const child of block.children) {
    if (!child.isLabel) {
      return
    }
    words.push(child.value)
  }
  return words.join(" ")
}
