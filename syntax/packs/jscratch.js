// Mockup blocks for the "Advanced language features" planned in jScratch's
// roadmap (https://github.com/AstroBlocksMod/jScratch, docs/roadmap.md):
// functions, macros, objects, lambdas, maps, variables declared in code and
// broadcasts with data. jScratch has not designed these blocks yet,
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

    // Lambdas: functions made inline from a reporter or a stack of blocks. The
    // last input is the body and the ones before it are the arguments. A spec
    // cannot take a varying number of inputs, so there is one per count.
    {
      id: "jscratch.function",
      spec: "function %1",
      inputs: ["%s"],
      shape: "reporter",
      category: "custom",
    },
    {
      id: "jscratch.function1",
      spec: "function %1 %2",
      inputs: ["%s", "%s"],
      shape: "reporter",
      category: "custom",
    },
    {
      id: "jscratch.function2",
      spec: "function %1 %2 %3",
      inputs: ["%s", "%s", "%s"],
      shape: "reporter",
      category: "custom",
    },
    {
      id: "jscratch.callFunction",
      spec: "call %1 with %2",
      inputs: ["%s", "%s"],
      shape: "reporter",
      category: "custom",
    },
    {
      id: "jscratch.runFunction",
      spec: "run %1 with %2",
      inputs: ["%s", "%s"],
      shape: "stack",
      category: "custom",
    },
    {
      id: "jscratch.runAfter",
      spec: "after %1 seconds run %2",
      inputs: ["%n", "%s"],
      shape: "stack",
      category: "control",
    },
    {
      id: "jscratch.keepItems",
      spec: "keep items of %1 where %2",
      inputs: ["%m.list", "%s"],
      shape: "stack",
      category: "list",
    },
    {
      id: "jscratch.sortList",
      spec: "sort %1 by %2",
      inputs: ["%m.list", "%s"],
      shape: "stack",
      category: "list",
    },

    // Maps: values that store pairs of keys and values. They use the list
    // color.
    {
      id: "jscratch.emptyMap",
      spec: "empty map",
      shape: "reporter",
      category: "list",
    },
    {
      id: "jscratch.keyOf",
      spec: "key %1 of %2",
      inputs: ["%s", "%s"],
      shape: "reporter",
      category: "list",
    },
    {
      id: "jscratch.numberOfKeys",
      spec: "number of keys in %1",
      inputs: ["%s"],
      shape: "reporter",
      category: "list",
    },
    {
      id: "jscratch.hasKey",
      spec: "%1 has key %2?",
      inputs: ["%s", "%s"],
      shape: "boolean",
      category: "list",
    },
    {
      id: "jscratch.setKey",
      spec: "set key %1 of %2 to %3",
      inputs: ["%s", "%s", "%s"],
      shape: "stack",
      category: "list",
    },
    {
      id: "jscratch.changeKey",
      spec: "change key %1 of %2 by %3",
      inputs: ["%s", "%s", "%n"],
      shape: "stack",
      category: "list",
    },
    {
      id: "jscratch.removeKey",
      spec: "remove key %1 from %2",
      inputs: ["%s", "%s"],
      shape: "stack",
      category: "list",
    },
    {
      id: "jscratch.forEachKey",
      spec: "for each key %1 in %2",
      inputs: ["%m.var", "%s"],
      shape: "c-block",
      category: "list",
    },

    // Variables declared in code: a hat that holds the variables and lists it
    // creates, each with its scope and starting value.
    {
      id: "jscratch.declare",
      spec: "declare",
      shape: "hat c cap",
      category: "variables",
    },
    {
      id: "jscratch.declareVariable",
      spec: "variable %1 for %2 = %3",
      inputs: ["%s", "%m.var", "%s"],
      shape: "stack",
      category: "variables",
    },
    {
      id: "jscratch.declareList",
      spec: "list %1 for %2",
      inputs: ["%s", "%m.var"],
      shape: "stack",
      category: "list",
    },

    // Broadcasts with data, and clones that get a value from the script that
    // created them.
    {
      id: "jscratch.broadcastWith",
      spec: "broadcast %1 with %2",
      inputs: ["%m.broadcast", "%s"],
      shape: "stack",
      category: "events",
    },
    {
      id: "jscratch.broadcastWithAndWait",
      spec: "broadcast %1 with %2 and wait",
      inputs: ["%m.broadcast", "%s"],
      shape: "stack",
      category: "events",
    },
    {
      id: "jscratch.whenIReceiveWith",
      spec: "when I receive %1 with %2",
      inputs: ["%m.broadcast", "%s"],
      shape: "hat",
      category: "events",
    },
    {
      id: "jscratch.createCloneWith",
      spec: "create clone of %1 with %2",
      inputs: ["%m.spriteOnly", "%s"],
      shape: "stack",
      category: "control",
    },
    {
      id: "jscratch.whenStartAsCloneWith",
      spec: "when I start as a clone with %1",
      inputs: ["%s"],
      shape: "hat",
      category: "control",
    },
  ],
}
