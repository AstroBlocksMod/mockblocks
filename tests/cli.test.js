import { execFile } from "child_process"
import fs from "fs/promises"
import os from "os"
import path from "path"

import { toSVG } from "../node.js"

const bin = path.resolve("bin/mockblocks.js")

function run(args, input) {
  return new Promise(resolve => {
    const child = execFile("node", [bin, ...args], (error, stdout, stderr) => {
      resolve({ code: error ? error.code : 0, stdout, stderr })
    })
    child.stdin.end(input ?? "")
  })
}

describe("toSVG", () => {
  test("returns a standalone SVG document", () => {
    const svg = toSVG("when flag clicked\nmove (10) steps")
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/)
    expect(svg).toContain("<style>")
    expect(svg).toContain('class="mockblocks-style-scratch3"')
    expect(svg).toContain(">move</text>")
  })

  test("measures labels, so longer text makes a wider block", () => {
    const width = svg => Number(svg.match(/width="([\d.]+)"/)[1])
    expect(width(toSVG("say [hi]"))).toBeLessThan(
      width(toSVG("say [hello there, how are you]")),
    )
  })

  test("takes the style and other languages", () => {
    const svg = toSVG("gehe (10) er Schritt", {
      style: "scratch3-high-contrast",
      languages: ["en", "de"],
    })
    expect(svg).toContain('class="mockblocks-style-scratch3-high-contrast"')
    expect(svg).toContain('class="sb3-motion"')
  })

  test("rejects unknown languages", () => {
    expect(() => toSVG("move (10) steps", { languages: ["../x"] })).toThrow(
      "Unknown language",
    )
  })
})

describe("mockblocks command", () => {
  let dir
  beforeAll(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "mockblocks-"))
  })
  afterAll(async () => {
    await fs.rm(dir, { recursive: true, force: true })
  })

  test("reads standard input and writes standard output", async () => {
    const { code, stdout } = await run([], "move (10) steps")
    expect(code).toBe(0)
    expect(stdout).toMatch(/^<svg[^]*<\/svg>\n$/)
  })

  test("writes each file next to itself, or into --out-dir", async () => {
    await fs.writeFile(path.join(dir, "a.txt"), "move (10) steps")
    await fs.writeFile(path.join(dir, "b.txt"), "class [Player]\nend")

    expect((await run([path.join(dir, "a.txt")])).code).toBe(0)
    await fs.access(path.join(dir, "a.svg"))

    const out = path.join(dir, "out")
    const files = ["a.txt", "b.txt"].map(f => path.join(dir, f))
    const result = await run(["-p", "jscratch", "-d", out, ...files])
    expect(result.code).toBe(0)
    expect(await fs.readdir(out)).toEqual(["a.svg", "b.svg"])
    const svg = await fs.readFile(path.join(out, "b.svg"), "utf8")
    expect(svg).toContain('class="sb3-objects"')
  })

  test("registers a pack from a file", async () => {
    const pack = path.join(dir, "pack.js")
    await fs.writeFile(
      pack,
      `export default {
        name: "demo",
        categories: { robots: "#e8590c" },
        blocks: [{ id: "demo.beep", spec: "beep", shape: "stack", category: "robots" }],
      }`,
    )
    const { code, stdout } = await run(["-p", pack], "beep")
    expect(code).toBe(0)
    expect(stdout).toContain('class="sb3-robots"')
  })

  test("reports a missing file and still renders the rest", async () => {
    const out = path.join(dir, "partial")
    const { code, stderr } = await run([
      "-d",
      out,
      path.join(dir, "missing.txt"),
      path.join(dir, "a.txt"),
    ])
    expect(code).toBe(1)
    expect(stderr).toContain("missing.txt")
    expect(await fs.readdir(out)).toEqual(["a.svg"])
  })

  test("exits with 2 on bad usage", async () => {
    expect((await run(["--style", "scratch2"])).code).toBe(2)
    expect((await run(["-o", "x.svg", "a.txt", "b.txt"])).code).toBe(2)
  })
})
