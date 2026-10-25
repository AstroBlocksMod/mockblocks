import path from "path"

const tests = []

// Every snapshot is rendered in both the original and the high contrast style.
export function test(name, source, lang) {
  for (const style of ["scratch3", "scratch3-high-contrast"]) {
    tests.push({
      style,
      name,
      source,
      lang: lang || "en",
    })
  }
}

export function runTests(r) {
  return Promise.all(
    tests.map(tc => {
      const outputPath = path.join(
        "snapshots",
        tc.style,
        tc.name.replace(/ /g, "-") + ".png",
      )
      console.log("running", tc.name)
      return (async () => {
        const options = {
          lang: tc.lang,
          style: tc.style,
          scale: 1,
        }
        await r.snapshotToFile(tc.source, options, outputPath)
        console.log("✓ wrote", outputPath)
      })()
    }),
  )
}
