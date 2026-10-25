#!/usr/bin/env node

import fs from "fs/promises"
import path from "path"
import { parseArgs } from "util"
import { pathToFileURL } from "url"

import mockblocks, { toSVG, loadLocale } from "../node.js"

const usage = `Usage: mockblocks [options] [file ...]

Turns mockblocks text into SVG images. Each file is written next to itself
with an .svg extension, so scripts/jump.txt becomes scripts/jump.svg. With no
files, or with "-", the text is read from standard input and the SVG is
written to standard output.

Options:
  -o, --output <file>   Write the image here ("-" for standard output).
                        Only works with a single input.
  -d, --out-dir <dir>   Write every image into this directory.
  -s, --style <style>   scratch3 (default) or scratch3-high-contrast.
  -l, --lang <code>     Also recognize blocks in this language, such as de.
                        Can be given more than once.
  -p, --pack <pack>     Register a pack before rendering: the name of a
                        bundled pack (${Object.keys(mockblocks.packs).join(", ")}) or a .js or .json
                        file whose default export is a pack. Can be given
                        more than once.
      --scale <n>       Scale the image (default 1).
  -h, --help            Show this help.
  -v, --version         Show the version.
`

const styles = ["scratch3", "scratch3-high-contrast"]

class UsageError extends Error {}

function readOptions(args) {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      output: { type: "string", short: "o" },
      "out-dir": { type: "string", short: "d" },
      style: { type: "string", short: "s", default: "scratch3" },
      lang: { type: "string", short: "l", multiple: true, default: [] },
      pack: { type: "string", short: "p", multiple: true, default: [] },
      scale: { type: "string", default: "1" },
      help: { type: "boolean", short: "h" },
      version: { type: "boolean", short: "v" },
    },
  })

  const inputs = positionals.length ? positionals : ["-"]
  if (values.output != null && inputs.length > 1) {
    throw new UsageError("--output only works with a single input")
  }
  if (values.output != null && values["out-dir"] != null) {
    throw new UsageError("use either --output or --out-dir, not both")
  }
  if (values["out-dir"] != null && inputs.includes("-")) {
    throw new UsageError("--out-dir needs file names, not standard input")
  }
  if (!styles.includes(values.style)) {
    throw new UsageError(
      `unknown style '${values.style}' (expected ${styles.join(" or ")})`,
    )
  }
  const scale = Number(values.scale)
  if (!(scale > 0)) {
    throw new UsageError(`--scale must be a positive number`)
  }

  return {
    inputs,
    output: values.output,
    outDir: values["out-dir"],
    style: values.style,
    languages: ["en", ...values.lang.filter(code => code !== "en")],
    packs: values.pack,
    scale,
    help: values.help,
    version: values.version,
  }
}

async function loadPack(name) {
  if (Object.hasOwn(mockblocks.packs, name)) {
    return mockblocks.packs[name]
  }
  const file = path.resolve(name)
  try {
    await fs.access(file)
  } catch {
    throw new Error(
      `'${name}' is not a bundled pack (${Object.keys(mockblocks.packs).join(", ")}) or a file`,
    )
  }
  if (path.extname(file) === ".json") {
    return JSON.parse(await fs.readFile(file, "utf8"))
  }
  let module
  try {
    module = await import(pathToFileURL(file).href)
  } catch (e) {
    throw new Error(`could not load pack '${name}': ${e.message}`, {
      cause: e,
    })
  }
  if (!module.default) {
    throw new Error(`pack file '${name}' has no default export`)
  }
  return module.default
}

async function readInput(input) {
  if (input !== "-") {
    return fs.readFile(input, "utf8")
  }
  let text = ""
  process.stdin.setEncoding("utf8")
  for await (const chunk of process.stdin) {
    text += chunk
  }
  return text
}

function outputPath(input, options) {
  if (options.output != null) {
    return options.output
  }
  if (input === "-") {
    return "-"
  }
  const name = `${path.parse(input).name}.svg`
  return path.join(options.outDir ?? path.dirname(input), name)
}

async function writeOutput(file, svg) {
  if (file === "-") {
    process.stdout.write(`${svg}\n`)
    return
  }
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, `${svg}\n`)
}

async function main(args) {
  const options = readOptions(args)
  if (options.help) {
    process.stdout.write(usage)
    return 0
  }
  if (options.version) {
    const pkg = new URL("../package.json", import.meta.url)
    process.stdout.write(`${JSON.parse(await fs.readFile(pkg)).version}\n`)
    return 0
  }

  for (const name of new Set(options.packs)) {
    const pack = await loadPack(name)
    // The scratch pack is always registered already.
    if (mockblocks.registeredPacks[pack.name] !== pack) {
      mockblocks.registerPack(pack)
    }
  }
  options.languages.slice(1).forEach(loadLocale)

  // A file that fails is reported and skipped, so one typo does not stop a
  // whole folder from being rendered.
  let failed = false
  for (const input of options.inputs) {
    const label = input === "-" ? "standard input" : input
    try {
      const code = await readInput(input)
      const svg = toSVG(code, options)
      const file = outputPath(input, options)
      await writeOutput(file, svg)
      if (file !== "-") {
        process.stderr.write(`wrote ${file}\n`)
      }
    } catch (e) {
      process.stderr.write(`mockblocks: ${label}: ${e.message}\n`)
      failed = true
    }
  }
  return failed ? 1 : 0
}

main(process.argv.slice(2)).then(
  code => {
    process.exitCode = code
  },
  e => {
    process.stderr.write(`mockblocks: ${e.message}\n`)
    if (e instanceof UsageError || e.code?.startsWith("ERR_PARSE_ARGS")) {
      process.stderr.write(`Run "mockblocks --help" for usage.\n`)
      process.exitCode = 2
    } else {
      process.exitCode = 1
    }
  },
)
