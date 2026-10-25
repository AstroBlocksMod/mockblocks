import { parse, registerPack, jscratchPack } from "../syntax/index.js"

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

beforeAll(() => {
  registerPack(jscratchPack)
})

describe("jscratch pack: objects", () => {
  const classCode = `class [Player]
  field [health] = (100)
  method [jump]
    change y by (10)
  end
end`

  test("a class holds fields and methods", () => {
    const b = parseBlock(classCode)
    expect(b.info).toMatchObject({ id: "jscratch.class", category: "objects" })
    expect(b.isHat).toBe(true)
    const body = b.children.find(c => c.isScript)
    expect(body.blocks.map(x => x.info.id)).toEqual([
      "jscratch.field",
      "jscratch.method",
    ])
    const method = body.blocks[1]
    expect(method.isDefine).toBe(true)
    expect(method.hasScript).toBe(true)
    expect(b.stringify()).toBe(classCode)
  })

  test("instances are reporters", () => {
    expect(parseBlock("(new [Player])").info.id).toBe("jscratch.new")
    expect(parseBlock("(this)").info.id).toBe("jscratch.this")
    expect(parseBlock("(field [health] of (this))").info.id).toBe(
      "jscratch.fieldOf",
    )
  })

  test("instances can be stored in variables and lists", () => {
    const s = parseScript(
      "set [player v] to (new [Player])\nadd (new [Enemy]) to [enemies v]",
    )
    expect(s.blocks[0].children[3].info.id).toBe("jscratch.new")
    expect(s.blocks[1].children[1].info.id).toBe("jscratch.new")
  })

  test("fields and methods are used through an instance", () => {
    expect(parseBlock("set field [health] of (player) to (50)").info.id).toBe(
      "jscratch.setFieldOf",
    )
    expect(parseBlock("call [jump] on (player)").info.id).toBe("jscratch.call")
  })

  test("Scratch's own 'of' block still works", () => {
    expect(parseBlock("([x position v] of [Sprite1 v])").info.id).toBe(
      "SENSING_OF",
    )
  })
})

describe("jscratch pack: functions and macros", () => {
  test("return ends a custom block", () => {
    const s = parseScript("define double (x)\nreturn ((x) * (2))")
    expect(s.blocks[1].info.id).toBe("jscratch.return")
    expect(s.isFinal).toBe(true)
  })

  test("local variables", () => {
    expect(parseBlock("local [count] = (0)").info).toMatchObject({
      id: "jscratch.local",
      category: "variables",
    })
  })

  test("macros are define hats", () => {
    const s = parseScript("define macro [bounce]\nif on edge, bounce")
    expect(s.blocks[0].info).toMatchObject({
      id: "jscratch.defineMacro",
      category: "macros",
    })
    expect(s.blocks[0].isDefine).toBe(true)
  })

  test("Scratch's own define still works", () => {
    const b = parseBlock("define jump (height)")
    expect(b.info).toMatchObject({ category: "custom", selector: "procDef" })
  })
})
