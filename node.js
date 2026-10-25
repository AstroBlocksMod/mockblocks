/*
 * Node entry point. Rendering builds the SVG with DOM calls and measures
 * label text on a canvas, so this sets up a jsdom window. jsdom picks up the
 * `canvas` package by itself; it measures text through Pango, which finds the
 * same font faces (such as Helvetica Neue Medium) that a browser would.
 */
import fs from "fs"
import { JSDOM } from "jsdom"
import init from "./index.js"

const { window } = new JSDOM()
const mockblocks = init(window)
export default mockblocks

// Locale codes are file names in `locales/`, such as "de" or "zh-cn".
export function loadLocale(code) {
  if (!/^[a-z]+(-[a-z]+)*$/i.test(code)) {
    throw new Error(`Unknown language: '${code}'`)
  }
  if (mockblocks.allLanguages[code]) {
    return
  }
  const url = new URL(`./locales/${code}.json`, import.meta.url)
  let json
  try {
    json = fs.readFileSync(url, "utf8")
  } catch {
    throw new Error(`Unknown language: '${code}'`)
  }
  mockblocks.loadLanguages({ [code]: JSON.parse(json) })
}

/* Turn mockblocks text into a standalone SVG document string.
 *
 *  toSVG("when flag clicked\nmove (10) steps", { style: "scratch3" })
 */
export function toSVG(code, options) {
  options = {
    style: "scratch3",
    scale: 1,
    languages: ["en"],
    ...options,
  }
  options.languages.forEach(code => {
    if (code !== "en") {
      loadLocale(code)
    }
  })

  const doc = mockblocks.parse(code, { languages: options.languages })
  const view = mockblocks.newView(doc, {
    style: options.style,
    scale: options.scale,
  })
  const svg = view.render()
  svg.classList.add(`mockblocks-style-${options.style}`)
  return view.exportSVGString()
}
