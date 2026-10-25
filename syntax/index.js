export { parse } from "./syntax.js"

export {
  Label,
  Icon,
  Input,
  Block,
  Comment,
  Glow,
  Script,
  Document,
} from "./model.js"

export {
  allLanguages,
  loadLanguages,
  registerPack,
  allBlocks,
  blocksById,
} from "./blocks.js"

export {
  categories,
  registeredPacks,
  onChange as onRegistryChange,
} from "./registry.js"

export {
  shapes,
  resolveShape,
  normalizeShape,
  shapeFromWords,
  canonicalName,
  isShapeWord,
} from "./shapes.js"

export { deriveShades, deriveHighContrastShades } from "./color.js"

export { extensions, aliasExtensions } from "./extensions.js"

export { default as scratchPack } from "./packs/scratch.js"
export { default as jscratchPack } from "./packs/jscratch.js"
