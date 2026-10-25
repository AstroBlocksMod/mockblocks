import { deriveShades, deriveHighContrastShades } from "./color.js"

// Categories registered by packs, by name. Each one holds the colors for both
// renderer themes.
export const categories = Object.create(null)

// Packs that have been registered, by name.
export const registeredPacks = Object.create(null)

const listeners = new Set()

// Called after a pack is registered, so that styles already added to the page
// can be refreshed with the new categories.
export function onChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function notifyChange() {
  for (const fn of listeners) {
    fn()
  }
}

// Category names end up in CSS class names, so keep them simple.
const categoryNamePat = /^[a-zA-Z][\w-]*$/

// Every category gets `.sb3-<name>`, `.sb3-<name>-alt` and `.sb3-<name>-dark`
// rules, so a name must not land on a class the renderer uses for something
// else, or on another category's shade classes.
const reservedClassPat =
  /^(label|extension-line|(input|literal|comment|diff)(-.*)?)$|-(alt|dark)$/

export function checkCategoryName(name) {
  if (!categoryNamePat.test(name)) {
    throw new Error(`Invalid category name '${name}'`)
  }
  if (reservedClassPat.test(name)) {
    throw new Error(
      `Category name '${name}' is used by the renderer for something else`,
    )
  }
}

function shadesFrom(def, name) {
  if (def.primary) {
    const derived = deriveShades(def.primary)
    return {
      primary: derived.primary,
      secondary: def.secondary || derived.secondary,
      tertiary: def.tertiary || derived.tertiary,
    }
  }
  if (def.color) {
    return deriveShades(def.color)
  }
  throw new Error(`Category '${name}' needs a color`)
}

// A category definition is either a hex color string, `{ color }` with the
// other shades derived, or `{ primary, secondary, tertiary }`. `highContrast`
// may give any of the three shades for the high contrast theme.
export function normalizeCategory(name, def) {
  checkCategoryName(name)
  if (typeof def === "string") {
    def = { color: def }
  }
  const colors = shadesFrom(def, name)
  const highContrast = {
    ...deriveHighContrastShades(colors),
    ...(def.highContrast || {}),
  }
  return { name, colors, highContrast }
}

export function addCategory(category) {
  if (category.name in categories) {
    throw new Error(`Category '${category.name}' is already registered`)
  }
  categories[category.name] = category
  return category
}
