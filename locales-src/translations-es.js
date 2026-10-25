import languages from "../locales/forums.js"
export default function init(mockblocks) {
  mockblocks.loadLanguages(languages)
}
init.languages = languages
