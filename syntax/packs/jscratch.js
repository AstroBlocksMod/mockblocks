// Mockup blocks for the "Advanced language features" planned in jScratch's
// roadmap (https://github.com/AstroBlocksMod/jScratch, docs/roadmap.md):
// functions, macros and objects. jScratch has not designed these blocks yet,
// so the wording, shapes and colors here are a draft for mockups, not a spec.
// Only the features the roadmap lists are covered.
//
// Not registered by default. Use `mockblocks.registerPack(mockblocks.packs.jscratch)`.

export default {
  name: "jscratch",

  categories: {
    // Functions are custom blocks, so they reuse the built-in `custom` color.
    macros: "#7e57c2",
    objects: "#3f7fbf",
  },

  shapes: {
    // A class holds its fields and methods in its body.
    "class-hat": { top: "hat", mouth: true },
    // A method is a define hat with a body, so it can sit inside a class.
    "method-hat": { top: "define", mouth: true },
  },

  blocks: [
    // Functions: custom blocks that report a value, and local variables.
    {
      id: "jscratch.return",
      spec: "return %1",
      inputs: ["%s"],
      shape: "cap",
      category: "custom",
    },
    {
      id: "jscratch.local",
      spec: "local %1 = %2",
      inputs: ["%s", "%s"],
      shape: "stack",
      category: "variables",
    },

    // Macros: blocks that expand into other blocks at compile time.
    {
      id: "jscratch.defineMacro",
      spec: "define macro %1",
      inputs: ["%s"],
      shape: "define",
      category: "macros",
    },

    // Objects: classes with fields and methods, and instances that can be
    // created, passed around and stored in variables and lists.
    {
      id: "jscratch.class",
      spec: "class %1",
      inputs: ["%s"],
      shape: "class-hat",
      category: "objects",
    },
    {
      id: "jscratch.field",
      spec: "field %1 = %2",
      inputs: ["%s", "%s"],
      shape: "stack",
      category: "objects",
    },
    {
      id: "jscratch.method",
      spec: "method %1",
      inputs: ["%s"],
      shape: "method-hat",
      category: "objects",
    },
    {
      id: "jscratch.new",
      spec: "new %1",
      inputs: ["%s"],
      shape: "reporter",
      category: "objects",
    },
    {
      id: "jscratch.this",
      spec: "this",
      shape: "reporter",
      category: "objects",
    },
    {
      id: "jscratch.fieldOf",
      spec: "field %1 of %2",
      inputs: ["%s", "%s"],
      shape: "reporter",
      category: "objects",
    },
    {
      id: "jscratch.setFieldOf",
      spec: "set field %1 of %2 to %3",
      inputs: ["%s", "%s", "%s"],
      shape: "stack",
      category: "objects",
    },
    {
      id: "jscratch.call",
      spec: "call %1 on %2",
      inputs: ["%s", "%s"],
      shape: "stack",
      category: "objects",
    },
  ],
}
