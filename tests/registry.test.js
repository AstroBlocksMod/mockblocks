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

  test("blocks without an id get one from the pack name and shape", () => {
    const b = parseBlock("(fuel level)")
    expect(b.info).toMatchObject({
      id: "rockets:reporter:fuel level",
      category: "rocket",
      shape: "reporter",
    })
    expect(blocksById["rockets:reporter:fuel level"].pack).toBe("rockets")
  })

  test("the same text can be a stack block and a reporter", () => {
    registerPack({
      name: "twins",
      category: "motion",
      blocks: [{ spec: "spin %1" }, { spec: "spin %1", shape: "reporter" }],
    })
    expect(parseBlock("spin (3)").info.id).toBe("twins:stack:spin _")
    expect(parseBlock("(spin (3))").info.id).toBe("twins:reporter:spin _")
  })

  test("the same text and shape twice needs explicit ids", () => {
    expect(() =>
      registerPack({
        name: "triplets",
        category: "motion",
        blocks: [{ spec: "hop %1" }, { spec: "hop %2" }],
      }),
    ).toThrow(/need their own ids/)
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

  test("rejects arguments that are not inputs of the spec", () => {
    for (const args of [[3], "1", [0], ["2"]]) {
      expect(() =>
        registerPack({
          name: "bad-arguments",
          blocks: [
            {
              spec: "when %1 with %2",
              category: "events",
              shape: "hat",
              arguments: args,
            },
          ],
        }),
      ).toThrow(/Invalid arguments/)
    }
    expect(() =>
      registerPack({
        name: "bad-argument-category",
        blocks: [
          {
            spec: "when %1 with %2",
            category: "events",
            shape: "hat",
            arguments: [2],
            argumentCategory: "nope",
          },
        ],
      }),
    ).toThrow(/Unknown argument category/)
    expect(registeredPacks["bad-arguments"]).toBeUndefined()
    expect(registeredPacks["bad-argument-category"]).toBeUndefined()
  })

  describe("block arguments", () => {
    beforeAll(() => {
      registerPack({
        name: "scopes",
        blocks: [
          {
            id: "scopes.with",
            spec: "with %1",
            shape: "hat c",
            category: "events",
            arguments: [1],
          },
          {
            id: "scopes.lambda",
            spec: "lambda %1 %2",
            shape: "reporter",
            category: "operators",
            arguments: [1],
          },
          {
            id: "scopes.get",
            spec: "when I get %1 with %2",
            shape: "hat",
            category: "sensing",
            arguments: [2],
          },
        ],
        aliases: { "with %2 when I get %1": "scopes.get" },
      })
    })

    const categoriesOf = (script, name) => {
      const found = []
      const walk = x => {
        if (x.isScript) {
          x.blocks.forEach(walk)
        } else if (x.isBlock) {
          if (x.isReporter && x.children.map(c => c.value).join(" ") === name) {
            found.push(x.info.category)
          }
          x.children.forEach(walk)
        }
      }
      walk(script)
      return found
    }

    test("an inner argument hides an outer one inside a body", () => {
      const s = parseScript(`with (x)
  say (lambda (x) (x))
  say (x)
end`)
      expect(categoriesOf(s, "x")).toEqual([
        "events",
        "operators",
        "operators",
        "events",
      ])
    })

    test("an alias with its inputs in another order", () => {
      const s = parseScript(`with (value) when I get [thing]
say (value)`)
      expect(s.blocks[0].info.id).toBe("scopes.get")
      expect(categoriesOf(s, "value")).toEqual(["sensing", "sensing"])
      expect(categoriesOf(s, "thing")).toEqual([])
    })
  })

  test.each(["hat", "cap", "loop", "reset", "gray", "pen", "wedo2"])(
    "rejects the override keyword '%s' as a category name",
    name => {
      expect(() =>
        registerPack({ name: `kw-${name}`, categories: { [name]: "#123456" } }),
      ).toThrow(/override keyword or extension/)
      expect(categories[name]).toBeUndefined()
    },
  )

  test.each([
    "label",
    "input-color",
    "literal-number",
    "comment",
    "comment-line",
    "diff",
    "extension-line",
    "motion-alt",
    "rocket-dark",
  ])("rejects '%s', which the renderer already uses", name => {
    expect(() =>
      registerPack({ name: `css-${name}`, categories: { [name]: "#123456" } }),
    ).toThrow(/used by the renderer/)
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

  test("css is cached until a pack is registered", () => {
    const before = makeCssContent()
    expect(makeCssContent()).toBe(before)
    registerPack({ name: "late", categories: { late: "#00aa55" } })
    const after = makeCssContent()
    expect(after).not.toBe(before)
    expect(after).toContain("svg .sb3-late {")
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
