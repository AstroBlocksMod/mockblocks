# mockblocks

Make pictures of block-based code from text, including mockups of blocks that do not exist yet.

mockblocks is a fork of [scratchblocks](https://github.com/scratchblocks/scratchblocks). It keeps the scratchblocks text syntax and the Scratch 3 look, and adds a way to define new blocks, categories and shapes so you can draw mockups for your own block language. Changes made here are not sent back upstream.

For the base syntax, see [the scratchblocks syntax guide](https://en.scratch-wiki.info/wiki/Block_Plugin/Syntax).

# Usage

## HTML

Include the mockblocks JS file on your page. You can build it yourself with Node 24+ (`npm run build`), which writes `build/mockblocks.min.js`.

```html
<script src="mockblocks.min.js"></script>
```

Write blocks inside `pre` tags with the class `blocks`:

```html
<pre class="blocks">
when flag clicked
move (10) steps
</pre>
```

Then call `mockblocks.renderMatching` after the page has loaded, just before the closing `</body>` tag:

```html
<script>
mockblocks.renderMatching('pre.blocks', {
  style:     'scratch3',   // Optional. 'scratch3' (default) or 'scratch3-high-contrast'.
  languages: ['en', 'de'], // Optional, defaults to ['en'].
  scale: 1,                // Optional, defaults to 1
});
</script>
```

`renderMatching()` takes a CSS selector for the elements that contain block code.

### Inline blocks

To use blocks inside a paragraph:

```html
I'm rather fond of the <code class="b">stamp</code> block in Scratch.
```

Make a second call to `renderMatching` with the `inline` option:

```html
<script>
mockblocks.renderMatching("pre.blocks", ...)

mockblocks.renderMatching("code.b", {
  inline: true,
  // Repeat `style` and `languages` options here.
});
</script>
```

### Translations

For languages other than English, include a second JS file with translations. The build writes two options:

* `build/translations.js` includes a limited set of languages
* `build/translations-all.js` includes every language that Scratch supports

The translation files are hundreds of kilobytes, so you might like to build your own with just the languages you need:

```js
window.mockblocks.loadLanguages({
    de: <contents of locales/de.json>
})
```

## NPM

```js
import mockblocks from "mockblocks";
mockblocks.renderMatching('pre.blocks');
```

# Mockups

The point of mockblocks is drawing blocks that do not exist yet. There are two ways to do that: overrides on a single line, and packs that define a whole block set.

## Overrides

Anything after `::` on a line changes how that block looks. mockblocks keeps the scratchblocks overrides (a category name, a hex color, `loop`, `+` and `-`) and adds shape words that can be combined:

| word | effect |
|---|---|
| `hat`, `cat`, `define` | the top edge |
| `c` | the block has a body, closed with `end` (`else` works too) |
| `cap` | nothing can go below the block |
| `stack` | back to a plain block |
| `reporter`, `boolean`, `ring` | round or pointed blocks |

So a class block with methods inside it is just:

```
class [Player] :: hat c #4c6ef5
  method [jump] :: define c
    change y by (10)
  end
end
```

A hex color gives the block the same three shades a built-in category has (slightly darker for dropdowns, darker again for the outline and empty boolean slots), in both the original and the high contrast theme.

## Packs

For a block set you use more than once, register a pack. A pack lists categories (with colors), optional shapes, and blocks. Once registered, the blocks are recognized by their text with no overrides needed:

```js
mockblocks.registerPack({
  name: "oop",
  categories: {
    classes: "#4c6ef5",
    // or explicit shades for both themes:
    // classes: { primary, secondary, tertiary, highContrast: { primary, secondary, tertiary } }
  },
  shapes: {
    "class-hat": { top: "hat", mouth: true },
  },
  blocks: [
    { id: "oop.class", spec: "class %1", inputs: ["%s"], shape: "class-hat", category: "classes" },
    { id: "oop.method", spec: "method %1", inputs: ["%s"], shape: "define c", category: "classes" },
    { id: "oop.new", spec: "new %1", inputs: ["%s"], shape: "reporter", category: "classes" },
  ],
  aliases: {
    "create %1": "oop.new",
  },
})
```

```
class [Player]
  method [jump]
    change y by (10)
  end
end

say (new [Player])
```

A block's `shape` is a shape name (`stack`, `hat`, `cap`, `c-block`, `reporter`, `boolean`, `ring`, or one from `shapes`), shape words such as `"hat c"`, or a feature object: `{ top: "notch" | "hat" | "cat" | "define", bottom: "puzzle" | "flat", mouth: true | false, output: null | "round" | "hex" }`.

### Bundled packs

`mockblocks.packs.jscratch` has draft blocks for the advanced language features on the [jScratch roadmap](https://github.com/AstroBlocksMod/jScratch/blob/main/docs/roadmap.md): functions (`return`, `local`), macros (`define macro`) and objects (`class`, `field`, `method`, `new`, `this`, `field of`, `set field of`, `call on`). jScratch has not designed these blocks yet, so treat the wording as a placeholder. It is not registered by default:

```js
mockblocks.registerPack(mockblocks.packs.jscratch)
```

### Writing a pack

`spec` uses `%1`, `%2` and so on for inputs, with the input kinds in `inputs` (`%s` string, `%n` number, `%b` boolean, `%m.name` dropdown). Registration is all or nothing: an invalid category, shape or block throws and nothing is registered. The built-in Scratch blocks are the `scratch` pack, available as `mockblocks.packs.scratch`.

## ESM

The ESM build (`build/mockblocks.min.es.js`) default-exports the `mockblocks` object instead of defining `window.mockblocks`. The ESM translation files default-export a function that loads the translations:

```js
import mockblocks from "./mockblocks.min.es.js";
import loadTranslations from "./translations-all-es.js";
loadTranslations(mockblocks);
```

# Languages

To update the translations:

```sh
npm upgrade scratch-l10n
npm run locales
```

Each language needs some [additional words](locales-src/extra_aliases.js) which aren't in Scratch itself (mainly the words used for the flag and arrow images). Rebuild the translations with `npm run locales` after editing the aliases.

# Development

```
npm install
npm start
```

Then open <http://localhost:8000/>.

Other useful commands:

```
npm test            # parser and stringify tests
npm run snapshots   # render the snapshot scripts to PNG with a headless browser
npm run lint
npm run fmt
```

See [`CONTRIBUTING.md`](.github/CONTRIBUTING.md) for more.

# Credits

mockblocks is built on scratchblocks. Many thanks to the [scratchblocks contributors](https://github.com/scratchblocks/scratchblocks/graphs/contributors)!

* scratchblocks was authored by [tjvr](https://github.com/tjvr) and maintained by tjvr and [apple502j](https://github.com/apple502j)
* Icons derived from [Scratch Blocks](https://github.com/scratchfoundation/scratch-blocks) (Apache License 2.0)
* JSO designed the syntax and wrote the original [Block Plugin](https://en.scratch-wiki.info/wiki/Block_Plugin_\(1.4\))
* Help with translation code from [joooni](https://scratch.mit.edu/users/joooni/)
* Block translations from the [scratch-l10n repository](https://github.com/scratchfoundation/scratch-l10n/)
* Ported to node by [arve0](https://github.com/arve0)
