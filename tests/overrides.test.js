import { parse, registerPack } from "../syntax/index.js"

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

describe("shape words in overrides", () => {
  test("hat c makes a hat with a body", () => {
    const code = "class [Player] :: hat c\n  move (10) steps\nend"
    const b = parseBlock(code)
    expect(b.info.shape).toBe("hat c")
    expect(b.isHat).toBe(true)
    expect(b.hasScript).toBe(true)
    expect(b.children[b.children.length - 1].blocks.length).toBe(1)
    expect(b.stringify()).toBe(code)
  })

  test("define c makes a define hat with a body", () => {
    const code = "method [jump] :: define c\n  change y by (10)\nend"
    const b = parseBlock(code)
    expect(b.info.shape).toBe("define c")
    expect(b.isDefine).toBe(true)
    expect(b.hasScript).toBe(true)
    expect(b.stringify()).toBe(code)
  })

  test("cap and c cap", () => {
    expect(parseBlock("finish :: cap").isFinal).toBe(true)
    const b = parseBlock("finally :: c cap\n  say [bye]\nend")
    expect(b.hasScript).toBe(true)
    expect(b.isFinal).toBe(true)
    expect(b.hasPuzzle).toBe(false)
  })

  test("cat c", () => {
    const b = parseBlock("when done :: cat c\nend")
    expect(b.shape.top).toBe("cat")
    expect(b.hasScript).toBe(true)
  })

  test("else works inside a custom c block", () => {
    const code = "try :: c\n  say [a]\nelse\n  say [b]\nend"
    const b = parseBlock(code)
    expect(b.children.filter(c => c.isScript).length).toBe(2)
    expect(b.stringify()).toBe(code)
  })

  test("words build on the block's own shape", () => {
    // forever is a C block with a flat bottom, so it keeps both.
    const b = parseBlock("forever :: hat\nend")
    expect(b.info.shape).toBe("hat c cap")
    expect(b.isHat).toBe(true)
    expect(b.hasScript).toBe(true)
    expect(b.isFinal).toBe(true)
    expect(b.stringify()).toBe("forever :: hat c cap\nend")
  })

  test("stack resets to a plain block", () => {
    const code = "forever :: stack"
    const b = parseBlock(code)
    expect(b.hasScript).toBe(false)
    expect(b.stringify()).toBe(code)
  })

  test("reporter and boolean words win over command words", () => {
    expect(parseBlock("foo :: hat reporter").isReporter).toBe(true)
    expect(parseBlock("foo :: c boolean").isBoolean).toBe(true)
  })

  test("a registered shape name can be used as an override", () => {
    registerPack({
      name: "banners",
      shapes: { banner: { top: "hat", bottom: "flat" } },
    })
    const code = "hello :: banner"
    const b = parseBlock(code)
    expect(b.info.shape).toBe("banner")
    expect(b.isHat).toBe(true)
    expect(b.isFinal).toBe(true)
    expect(b.stringify()).toBe(code)
  })

  test("unknown words are ignored", () => {
    const b = parseBlock("say [hi] :: wobbly")
    expect(b.info.shape).toBe("stack")
    expect(b.info.category).toBe("looks")
  })
})

describe("color overrides", () => {
  test("a hex color with shape words", () => {
    const code = "class [Player] :: #4c6ef5 hat c\nend"
    const b = parseBlock(code)
    expect(b.info.color).toBe("#4c6ef5")
    expect(b.info.shape).toBe("hat c")
    expect(b.stringify()).toBe(code)
  })

  test("a hex color is stringified", () => {
    const code = "say [hi] :: #ff0000"
    expect(parseBlock(code).stringify()).toBe(code)
  })
})
