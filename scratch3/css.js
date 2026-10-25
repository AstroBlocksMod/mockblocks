import { categories, onChange } from "../syntax/registry.js"

const common = `
.sb3-label {
  font: 500 12pt Helvetica Neue, Helvetica, sans-serif;
}

.sb3-literal-number,
.sb3-literal-string,
.sb3-literal-number-dropdown,
.sb3-literal-dropdown {
  word-spacing: 0;
}

.sb3-diff {
  fill: none;
  stroke: #000;
}
.sb3-diff-ins {
  stroke-width: 2px;
}
.sb3-diff-del {
  stroke-width: 3px;
}
`

// These override colors defined per theme
const commonOverride = `
/* Note: comment colors are different from Scratch. */

.sb3-comment {
  fill: #ffffa5;
  stroke: #d0d1d2;
  stroke-width: 1;
}
.sb3-comment-line {
  fill: #ffff80;
}
/* specificity */
.sb3-comment-label, .sb3-label.sb3-comment-label {
  font: 400 12pt Helvetica Neue, Helvetica, sans-serif;
  fill: #000;
  word-spacing: 0;
}`

const themes = [
  {
    selector: "",
    shades: "colors",
    label: "#fff",
    inputColorStroke: "#fff",
    inputFill: "#fff",
    /* Blockly color: text */
    literal: "#575e75",
  },
  {
    selector: ".mockblocks-style-scratch3-high-contrast",
    shades: "highContrast",
    label: "#000",
    inputColorStroke: "#fff",
    inputFill: "#fff",
    literal: "#000",
  },
]

const categoryRules = (theme, category) => {
  const shades = category[theme.shades]
  return `
svg${theme.selector} .sb3-${category.name} {
  fill: ${shades.primary};
  stroke: ${shades.tertiary};
}
svg${theme.selector} .sb3-${category.name}-alt {
  fill: ${shades.secondary};
}
svg${theme.selector} .sb3-${category.name}-dark {
  fill: ${shades.tertiary};
}
`
}

const themeRules = theme => {
  let css = ""
  for (const name in categories) {
    css += categoryRules(theme, categories[name])
  }
  const extension = categories.extension
  const lineStroke = extension ? extension[theme.shades].secondary : "#0da57a"
  css += `
svg${theme.selector} .sb3-label {
  fill: ${theme.label};
}

svg${theme.selector} .sb3-input-color {
  stroke: ${theme.inputColorStroke};
}

svg${theme.selector} .sb3-input-number,
svg${theme.selector} .sb3-input-string {
  fill: ${theme.inputFill};
}
svg${theme.selector} .sb3-literal-number,
svg${theme.selector} .sb3-literal-string {
  fill: ${theme.literal};
}

svg${theme.selector} .sb3-extension-line {
  stroke: ${lineStroke};
}
`
  return css
}

// Built from the registry and cached until a pack is registered, so that
// categories registered after the page loaded are included.
let cached = null
onChange(() => {
  cached = null
})

export default function makeCssContent() {
  if (cached == null) {
    cached = common + themes.map(themeRules).join("") + commonOverride
  }
  return cached
}
