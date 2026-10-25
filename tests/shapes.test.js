import {
  parse,
  registerPack,
  shapes,
  resolveShape,
  normalizeShape,
  shapeFromWords,
} from "../syntax/index.js"

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

describe("shape features", () => {
  test("the scratchblocks names resolve to features", () => {
    expect(resolveShape("stack")).toMatchObject({
      top: "notch",
      bottom: "puzzle",
      mouth: false,
      output: null,
      name: "stack",
    })
    expect(resolveShape("c-block")).toMatchObject({ mouth: true, name: "c" })
    expect(resolveShape("c-block cap")).toMatchObject({
      mouth: true,
      bottom: "flat",
      name: "c cap",
    })
    expect(resolveShape("define-hat")).toMatchObject({
      top: "define",
      name: "define",
    })
    expect(resolveShape("reporter")).toMatchObject({
      output: "round",
      ring: false,
    })
    expect(resolveShape("ring")).toMatchObject({ output: "round", ring: true })
    expect(resolveShape("boolean")).toMatchObject({ output: "hex" })
    expect(resolveShape("celse")).toMatchObject({ role: "else" })
  })

  test("shape words build shapes", () => {
    expect(shapeFromWords(["hat", "c"])).toMatchObject({
      top: "hat",
      mouth: true,
      name: "hat c",
    })
    expect(shapeFromWords(["define", "cat", "c", "cap"]).name).toBe(
      "define-cat c cap",
    )
    expect(shapeFromWords(["hat", "reporter"]).name).toBe("reporter")
    expect(() => shapeFromWords(["blob"])).toThrow(/Unknown shape/)
  })

  test("resolving a word list remembers it", () => {
    expect(resolveShape("cat c").name).toBe("cat c")
    expect(shapes["cat c"]).toBeDefined()
  })

  test("feature objects are validated", () => {
    expect(normalizeShape({ top: "hat", mouth: true }).name).toBe("hat c")
    expect(normalizeShape({ ring: true }).output).toBe("round")
    expect(() => normalizeShape({ top: "roof" })).toThrow(/shape top/)
    expect(() => normalizeShape({ sides: 3 })).toThrow(/shape feature/)
  })
})

describe("block flags", () => {
  test("c blocks", () => {
    const b = parseBlock("forever\nend")
    expect(b.hasScript).toBe(true)
    expect(b.isFinal).toBe(true)
    expect(b.hasPuzzle).toBe(false)
    expect(b.isCommand).toBe(true)
  })

  test("hats and caps", () => {
    const hat = parseBlock("when flag clicked")
    expect(hat.isHat).toBe(true)
    expect(hat.hasPuzzle).toBe(true)
    const cap = parseBlock("stop [all v]")
    expect(cap.isFinal).toBe(true)
    expect(cap.hasPuzzle).toBe(false)
  })

  test("define hats", () => {
    const b = parseBlock("define foo (bar)")
    expect(b.isHat).toBe(true)
    expect(b.isDefine).toBe(true)
    expect(b.info.shape).toBe("define-hat")
  })

  test("reporters, booleans and rings", () => {
    expect(parseBlock("(x position)").isReporter).toBe(true)
    expect(parseBlock("<mouse down?>").isBoolean).toBe(true)
    const ring = parseBlock("(() @addInput)")
    expect(ring.isRing).toBe(true)
    expect(ring.isReporter).toBe(false)
    expect(ring.isCommand).toBe(false)
  })

  test("else and end on their own are plain stack blocks", () => {
    expect(parseBlock("else").isCommand).toBe(true)
    expect(parseBlock("end").hasScript).toBe(false)
  })
})

describe("packs with custom shapes", () => {
  beforeAll(() => {
    registerPack({
      name: "classes",
      categories: { classes: "#5c6bc0" },
      shapes: {
        "class-hat": { top: "hat", mouth: true },
      },
      blocks: [
        {
          id: "classes.class",
          spec: "class %1",
          inputs: ["%s"],
          shape: "class-hat",
          category: "classes",
        },
        {
          id: "classes.method",
          spec: "method %1",
          inputs: ["%s"],
          shape: { top: "define", mouth: true },
          category: "classes",
        },
        {
          id: "classes.finally",
          spec: "finally",
          shape: "c cap",
          category: "classes",
        },
      ],
    })
  })

  test("named shapes are registered", () => {
    expect(shapes["class-hat"]).toMatchObject({ top: "hat", mouth: true })
  })

  test("a hat with a mouth holds a body", () => {
    const code = "class [Dog]\n  method [bark]\n    say [woof]\n  end\nend"
    const b = parseBlock(code)
    expect(b.info).toMatchObject({ id: "classes.class", shape: "class-hat" })
    expect(b.isHat).toBe(true)
    expect(b.hasScript).toBe(true)
    const body = b.children[b.children.length - 1]
    expect(body.isScript).toBe(true)
    expect(body.blocks.length).toBe(1)
    const method = body.blocks[0]
    expect(method.info).toMatchObject({
      id: "classes.method",
      shape: "define c",
    })
    expect(method.isDefine).toBe(true)
    expect(method.hasScript).toBe(true)
    expect(b.stringify()).toBe(code)
  })

  test("a hat with a mouth starts a new script", () => {
    const doc = parse("move (10) steps\nclass [Dog]\nend")
    expect(doc.scripts.length).toBe(2)
  })

  test("a c block cap ends the script", () => {
    const s = parseScript("say [hi]\nfinally\n  say [bye]\nend")
    expect(s.isFinal).toBe(true)
    expect(s.blocks[1].hasScript).toBe(true)
  })

  test("rejects unknown shapes and duplicate shape names", () => {
    expect(() =>
      registerPack({
        name: "bad-shape",
        blocks: [{ spec: "x", category: "motion", shape: "blob" }],
      }),
    ).toThrow(/Unknown shape 'blob' for block/)
    expect(() =>
      registerPack({
        name: "dupe-shape",
        shapes: { "class-hat": { top: "hat" } },
      }),
    ).toThrow(/already registered/)
  })
})

describe("review fixes", () => {
  test("a hat after an unterminated C block starts a new script", () => {
    const doc = parse("forever\nmove (10) steps\nwhen flag clicked\nsay [hi]")
    expect(doc.scripts.length).toBe(2)
    expect(doc.scripts[0].blocks[0].children.at(-1).blocks.length).toBe(1)
    expect(doc.scripts[1].blocks[0].isHat).toBe(true)
  })

  test("a define hat after an unterminated repeat starts a new script", () => {
    const doc = parse("repeat (10)\nmove (10) steps\ndefine bar\nsay [hi]")
    expect(doc.scripts.length).toBe(2)
    expect(doc.scripts[1].blocks[0].isDefine).toBe(true)
  })

  test("a hat leaves nested C blocks and is caught by an enclosing hat", () => {
    const doc = parse("class [A]\nforever\nsay [x]\nmethod [m]\nend")
    expect(doc.scripts.length).toBe(1)
    const body = doc.scripts[0].blocks[0].children.at(-1)
    expect(body.blocks.map(b => b.info.id)).toEqual([
      "CONTROL_FOREVER",
      "classes.method",
    ])
  })

  test("pack shape names cannot be shape words or built-in names", () => {
    for (const name of ["cat c", "hat", "c-block", "define-hat", "celse"]) {
      expect(() =>
        registerPack({
          name: `claim-${name}`,
          shapes: { [name]: { top: "hat" } },
        }),
      ).toThrow(/built in|shape words/)
    }
    expect(resolveShape("cat c")).toMatchObject({ top: "cat", mouth: true })
  })

  test("pack shape names cannot be category names", () => {
    expect(() =>
      registerPack({ name: "clash", shapes: { motion: { top: "hat" } } }),
    ).toThrow(/already a category/)
    expect(() =>
      registerPack({
        name: "clash2",
        categories: { tower: "#123456" },
        shapes: { tower: { top: "hat" } },
      }),
    ).toThrow(/already a category/)
  })

  test("a category cannot take a pack shape name", () => {
    expect(() =>
      registerPack({ name: "clash3", categories: { "class-hat": "#123456" } }),
    ).toThrow(/override keyword/)
  })

  test("features that do not combine are rejected, not dropped", () => {
    expect(() => normalizeShape({ role: "else", mouth: true })).toThrow(
      /role 'else' cannot also set mouth/,
    )
    expect(() => normalizeShape({ role: "end", top: "hat" })).toThrow(
      /cannot also set top/,
    )
    expect(() => normalizeShape({ output: "round", top: "hat" })).toThrow(
      /cannot also set top/,
    )
    expect(() => normalizeShape({ ring: true, output: "hex" })).toThrow(/ring/)
    expect(() => normalizeShape({ outline: true, mouth: true })).toThrow(
      /outline/,
    )
    expect(() => normalizeShape({ role: "maybe" })).toThrow(/role/)
    expect(() =>
      registerPack({
        name: "bad-role",
        blocks: [
          {
            spec: "otherwise",
            category: "control",
            shape: { role: "else", mouth: true },
          },
        ],
      }),
    ).toThrow(/cannot also set mouth/)
  })
})
