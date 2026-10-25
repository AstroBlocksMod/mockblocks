import {
  parse,
  registerPack,
  registeredPacks,
  categories,
  blocksById,
} from "../syntax/index.js"
import makeCssContent from "../scratch3/css.js"
import { deriveShades, shiftLightness } from "../syntax/color.js"

function parseScript(code) {
  const doc = parse(code)
  expect(doc.scripts.length).toBe(1)
  return doc.scripts[0]
}

function parseBlock(code) {
  const script = parseScript(code)
  expect(script.blocks.length).toBe(1)
  return script.blocks[0]
}

const rockets = {
  name: "rockets",
  categories: {
    rocket: { color: "#4c6ef5" },
    moon: {
      primary: "#111111",
      secondary: "#222222",
      tertiary: "#333333",
      highContrast: { primary: "#aaaaaa" },
    },
    mars: "#c0392b",
  },
  blocks: [
    {
      id: "rockets.launch",
      spec: "launch %1",
      inputs: ["%s"],
      shape: "stack",
      category: "rocket",
    },
    {
      id: "rockets.whenLanded",
      spec: "when landed on %1",
      inputs: ["%s"],
      shape: "hat",
      category: "moon",
    },
    {
      spec: "fuel level",
      shape: "reporter",
      category: "rocket",
    },
    {
      spec: "repeat orbit %1",
      inputs: ["%n"],
      shape: "c-block",
      category: "rocket",
      hasLoopArrow: true,
    },
    {
      spec: "self destruct",
      shape: "cap",
      category: "mars",
    },
  ],
  aliases: {
    "lift off %1": "rockets.launch",
  },
}

describe("registerPack", () => {
  beforeAll(() => {
    registerPack(rockets)
  })

  test("records the pack", () => {
    expect(registeredPacks.scratch).toBeDefined()
    expect(registeredPacks.rockets).toBe(rockets)
  })

  test("stack blocks are recognized", () => {
    const b = parseBlock("launch [now]")
    expect(b.info).toMatchObject({
      id: "rockets.launch",
      category: "rocket",
      shape: "stack",
      categoryIsDefault: true,
    })
    expect(b.stringify()).toBe("launch [now]")
  })

  test("hat blocks start a script", () => {
    const s = parseScript("when landed on [moon]\nlaunch [again]")
    expect(s.blocks.length).toBe(2)
    expect(s.blocks[0].isHat).toBe(true)
    expect(s.blocks[0].info.category).toBe("moon")
  })

  test("blocks without an id get one from the pack name", () => {
    const b = parseBlock("(fuel level)")
    expect(b.info).toMatchObject({
      id: "rockets:fuel level",
      category: "rocket",
      shape: "reporter",
    })
    expect(blocksById["rockets:fuel level"].pack).toBe("rockets")
  })

  test("c blocks take a body", () => {
    const code = "repeat orbit (3)\n  launch [x]\nend"
    const b = parseBlock(code)
    expect(b.hasScript).toBe(true)
    expect(b.info.hasLoopArrow).toBe(true)
    expect(b.stringify()).toBe(code)
  })

  test("cap blocks end a script", () => {
    const s = parseScript("launch [x]\nself destruct")
    expect(s.isFinal).toBe(true)
    expect(s.blocks[1].info.category).toBe("mars")
  })

  test("aliases", () => {
    expect(parseBlock("lift off [now]").info.id).toBe("rockets.launch")
  })

  test("new categories work as overrides", () => {
    const code = "say [hi] :: rocket"
    const b = parseBlock(code)
    expect(b.info).toMatchObject({
      category: "rocket",
      categoryIsDefault: false,
    })
    expect(b.stringify()).toBe(code)
  })

  test("rejects a second pack with the same name", () => {
    expect(() => registerPack({ name: "rockets" })).toThrow(
      /already registered/,
    )
  })

  test("rejects duplicate block ids without registering anything", () => {
    expect(() =>
      registerPack({
        name: "dupes",
        categories: { dupe: "#123456" },
        blocks: [{ id: "rockets.launch", spec: "again", category: "dupe" }],
      }),
    ).toThrow(/Duplicate ID/)
    expect(registeredPacks.dupes).toBeUndefined()
    expect(categories.dupe).toBeUndefined()
  })

  test("rejects unknown categories and shapes", () => {
    expect(() =>
      registerPack({
        name: "bad-category",
        blocks: [{ spec: "x", category: "nope" }],
      }),
    ).toThrow(/Unknown category/)
    expect(() =>
      registerPack({
        name: "bad-shape",
        blocks: [{ spec: "x", category: "motion", shape: "blob" }],
      }),
    ).toThrow(/Unknown shape/)
    expect(() =>
      registerPack({
        name: "bad-name",
        categories: { "no spaces": "#123456" },
      }),
    ).toThrow(/Invalid category name/)
  })
})

describe("category colors", () => {
  test("a single color gets darker secondary and tertiary shades", () => {
    const shades = deriveShades("#4c6ef5")
    expect(shades.primary).toBe("#4c6ef5")
    expect(shades.secondary).toBe(shiftLightness("#4c6ef5", -10))
    expect(shades.tertiary).toBe(shiftLightness("#4c6ef5", -15))
    expect(categories.rocket.colors).toEqual(shades)
  })

  test("short hex colors are expanded", () => {
    expect(deriveShades("#abc").primary).toBe("#aabbcc")
  })

  test("explicit shades are kept", () => {
    expect(categories.moon.colors).toEqual({
      primary: "#111111",
      secondary: "#222222",
      tertiary: "#333333",
    })
    expect(categories.moon.highContrast.primary).toBe("#aaaaaa")
    expect(categories.moon.highContrast.tertiary).toBe("#333333")
  })

  test("a string is shorthand for a color", () => {
    expect(categories.mars.colors.primary).toBe("#c0392b")
  })

  test("the built-in colors are unchanged", () => {
    expect(categories.motion.colors).toEqual({
      primary: "#4c97ff",
      secondary: "#4280d7",
      tertiary: "#3373cc",
    })
    expect(categories.motion.highContrast.primary).toBe("#80b5ff")
  })

  test("css includes registered categories in both themes", () => {
    const css = makeCssContent()
    expect(css).toContain("svg .sb3-rocket {")
    expect(css).toContain(`fill: ${categories.rocket.colors.primary};`)
    expect(css).toContain(
      "svg.mockblocks-style-scratch3-high-contrast .sb3-rocket {",
    )
    expect(css).toContain("svg .sb3-custom-arg {")
  })
})
