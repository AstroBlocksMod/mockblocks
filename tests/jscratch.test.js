import {
  parse,
  registerPack,
  jscratchPack,
  allBlocks,
} from "../syntax/index.js"
import { hashSpec } from "../syntax/blocks.js"

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

describe("jscratch pack: lambdas", () => {
  test("a lambda wraps an expression, with its arguments first", () => {
    const b = parseBlock("(function (x) ((x) * (2)))")
    expect(b.info).toMatchObject({
      id: "jscratch.function1",
      category: "custom",
    })
    expect(b.isReporter).toBe(true)
    expect(parseBlock("(function (a) (b) ((a) + (b)))").info.id).toBe(
      "jscratch.function2",
    )
  })

  test("a lambda can hold a stack of blocks", () => {
    const b = parseBlock(`(function (name) {
say (name)
play sound (fanfare v) until done
})`)
    expect(b.info.id).toBe("jscratch.function1")
    const body = b.children.find(c => c.isScript)
    expect(body.blocks.map(x => x.info.id)).toEqual([
      "LOOKS_SAY",
      "SOUND_PLAYUNTILDONE",
    ])
  })

  test("lambdas are called, run and passed to list blocks", () => {
    expect(parseBlock("(call (double) with (21))").info.id).toBe(
      "jscratch.callFunction",
    )
    expect(parseBlock("run (greet) with [Ada]").info.id).toBe(
      "jscratch.runFunction",
    )
    expect(
      parseBlock("after (2) seconds run (function {clear graphic effects})")
        .info,
    ).toMatchObject({ id: "jscratch.runAfter", category: "control" })
    expect(
      parseBlock("keep items of [enemies v] where (function (e) <(e) > (0)>)")
        .info.id,
    ).toBe("jscratch.keepItems")
    expect(parseBlock("sort [enemies v] by (function (e) (e))").info.id).toBe(
      "jscratch.sortList",
    )
  })

  test("call with does not take over call on", () => {
    expect(parseBlock("call [jump] on (player)").info.id).toBe("jscratch.call")
  })
})

describe("jscratch pack: maps", () => {
  test("map reporters and booleans use the list color", () => {
    expect(parseBlock("(empty map)").info).toMatchObject({
      id: "jscratch.emptyMap",
      category: "list",
    })
    expect(parseBlock("(key [sword] of (prices))").info.id).toBe(
      "jscratch.keyOf",
    )
    expect(parseBlock("(number of keys in (prices))").info.id).toBe(
      "jscratch.numberOfKeys",
    )
    const has = parseBlock("<(prices) has key [sword]?>")
    expect(has.info.id).toBe("jscratch.hasKey")
    expect(has.isBoolean).toBe(true)
  })

  test("map stack blocks", () => {
    const s = parseScript(`set key [sword] of (prices) to (50)
change key (thing) of (inventory) by (1)
remove key (thing) from (prices)`)
    expect(s.blocks.map(b => b.info.id)).toEqual([
      "jscratch.setKey",
      "jscratch.changeKey",
      "jscratch.removeKey",
    ])
  })

  test("for each key is a C block", () => {
    const b = parseBlock(`for each key [name v] in (inventory)
say (name)
end`)
    expect(b.info.id).toBe("jscratch.forEachKey")
    expect(b.hasScript).toBe(true)
  })

  test("Scratch's own item of still works", () => {
    expect(parseBlock("(item (1) of [enemies v])").info.id).toBe(
      "DATA_ITEMOFLIST",
    )
  })
})

describe("jscratch pack: declared variables", () => {
  const declareCode = `declare
  variable [score] for [all sprites v] = (0)
  list [high scores] for [all sprites v]
end`

  test("declare is a capped hat that holds variables and lists", () => {
    const b = parseBlock(declareCode)
    expect(b.info).toMatchObject({
      id: "jscratch.declare",
      category: "variables",
    })
    expect(b.isHat).toBe(true)
    expect(b.hasScript).toBe(true)
    expect(b.shape.bottom).toBe("flat")
    const body = b.children.find(c => c.isScript)
    expect(body.blocks.map(x => x.info)).toMatchObject([
      { id: "jscratch.declareVariable", category: "variables" },
      { id: "jscratch.declareList", category: "list" },
    ])
    expect(b.stringify()).toBe(declareCode)
  })
})

describe("jscratch pack: broadcasts with data", () => {
  test("broadcasts carry a value", () => {
    expect(parseBlock("broadcast [score v] with (10)").info).toMatchObject({
      id: "jscratch.broadcastWith",
      category: "events",
    })
    expect(parseBlock("broadcast [score v] with (10) and wait").info.id).toBe(
      "jscratch.broadcastWithAndWait",
    )
    const hat = parseBlock("when I receive [score v] with (points)")
    expect(hat.info.id).toBe("jscratch.whenIReceiveWith")
    expect(hat.isHat).toBe(true)
  })

  test("clones get a value from the script that made them", () => {
    expect(
      parseBlock("create clone of [myself v] with (10)").info,
    ).toMatchObject({ id: "jscratch.createCloneWith", category: "control" })
    const hat = parseBlock("when I start as a clone with (start x)")
    expect(hat.info.id).toBe("jscratch.whenStartAsCloneWith")
    expect(hat.isHat).toBe(true)
  })

  test("Scratch's own broadcast and clone blocks still work", () => {
    const s = parseScript(`when I receive [score v]
broadcast [score v]
broadcast [score v] and wait
create clone of [myself v]`)
    expect(s.blocks.map(b => b.info.id)).toEqual([
      "EVENT_WHENBROADCASTRECEIVED",
      "EVENT_BROADCAST",
      "EVENT_BROADCASTANDWAIT",
      "CONTROL_CREATECLONEOF",
    ])
    expect(parseBlock("when I start as a clone").info.id).toBe(
      "CONTROL_STARTASCLONE",
    )
  })
})

describe("jscratch pack: Scratch blocks", () => {
  test("no jscratch spec has the same text as a Scratch block", () => {
    const scratch = new Set(
      allBlocks.filter(b => b.pack === "scratch").map(b => hashSpec(b.spec)),
    )
    const taken = jscratchPack.blocks.filter(b => scratch.has(hashSpec(b.spec)))
    expect(taken.map(b => b.spec)).toEqual([])
  })
})

describe("jscratch pack: arguments", () => {
  function categoryOf(script, name) {
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

  test("a hat's argument takes its color in the rest of the script", () => {
    const s = parseScript(`when I receive [score v] with (points)
change [score v] by (points)`)
    expect(categoryOf(s, "points")).toEqual(["events", "events"])
    const clone = parseScript(`when I start as a clone with (start x)
go to x (start x) y (0)`)
    expect(categoryOf(clone, "start x")).toEqual(["control", "control"])
  })

  test("a hat's argument does not reach other scripts", () => {
    const doc = parse(`when I receive [score v] with (points)
say (points)

when flag clicked
say (points)`)
    expect(categoryOf(doc.scripts[1], "points")).toEqual(["variables"])
  })

  test("a lambda's arguments only reach its body", () => {
    const s = parseScript(`set [f v] to (function (x) ((x) * (2)))
say (x)`)
    expect(categoryOf(s, "x")).toEqual([
      "custom-arg",
      "custom-arg",
      "variables",
    ])
  })

  test("a lambda can use the arguments of the hat it is under", () => {
    const s = parseScript(`when I receive [hit v] with (damage)
set [f v] to (function (x) ((x) * (damage)))`)
    expect(categoryOf(s, "damage")).toEqual(["events", "events"])
  })

  test("a lambda's argument hides a hat argument with the same name", () => {
    const s = parseScript(`when I receive [hit v] with (x)
say (function (x) (x))`)
    expect(categoryOf(s, "x")).toEqual(["events", "custom-arg", "custom-arg"])
  })

  test("arguments with their own override keep it", () => {
    const s = parseScript(`when I receive [score v] with (points :: looks)
say (points)`)
    expect(categoryOf(s, "points")).toEqual(["looks", "looks"])
  })

  test("arguments print as overrides and parse back the same", () => {
    const code = `when I receive [score v] with (points)
say (function (x) ((x) + (points)))`
    const once = parse(code).stringify()
    expect(once).toBe(`when I receive [score v] with (points :: events)
say (function (x :: custom-arg) ((x :: custom-arg) + (points :: events)))`)
    expect(parse(once).stringify()).toBe(once)
  })
})
