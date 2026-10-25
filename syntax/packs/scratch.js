import commands from "../commands.js"

// The built-in Scratch blocks. Colors are the ones from scratch-blocks;
// secondary is used for number dropdowns and the define outline, tertiary for
// strokes and empty boolean slots. The high contrast colors are from the
// Scratch high contrast theme.
const categories = {
  motion: {
    primary: "#4c97ff",
    secondary: "#4280d7",
    tertiary: "#3373cc",
    highContrast: {
      primary: "#80b5ff",
      secondary: "#b3d2ff",
      tertiary: "#3373cc",
    },
  },
  looks: {
    primary: "#9966ff",
    secondary: "#855cd6",
    tertiary: "#774dcb",
    highContrast: {
      primary: "#ccb3ff",
      secondary: "#ddccff",
      tertiary: "#774dcb",
    },
  },
  sound: {
    primary: "#cf63cf",
    secondary: "#c94fc9",
    tertiary: "#bd42bd",
    highContrast: {
      primary: "#e19de1",
      secondary: "#ffb3ff",
      tertiary: "#bd42bd",
    },
  },
  control: {
    primary: "#ffab19",
    secondary: "#ec9c13",
    tertiary: "#cf8b17",
    highContrast: {
      primary: "#ffbe4c",
      secondary: "#ffda99",
      tertiary: "#cf8b17",
    },
  },
  events: {
    primary: "#ffbf00",
    secondary: "#e6ac00",
    tertiary: "#cc9900",
    highContrast: {
      primary: "#ffd966",
      secondary: "#ffecb3",
      tertiary: "#cc9900",
    },
  },
  sensing: {
    primary: "#5cb1d6",
    secondary: "#47a8d1",
    tertiary: "#2e8eb8",
    highContrast: {
      primary: "#85c4e0",
      secondary: "#aed8ea",
      tertiary: "#2e8eb8",
    },
  },
  operators: {
    primary: "#59c059",
    secondary: "#46b946",
    tertiary: "#389438",
    highContrast: {
      primary: "#7ece7e",
      secondary: "#b5e3b5",
      tertiary: "#389438",
    },
  },
  variables: {
    primary: "#ff8c1a",
    secondary: "#ff8000",
    tertiary: "#db6e00",
    highContrast: {
      primary: "#ffa54c",
      secondary: "#ffcc99",
      tertiary: "#db6e00",
    },
  },
  list: {
    primary: "#ff661a",
    secondary: "#ff5500",
    tertiary: "#e64d00",
    highContrast: {
      primary: "#ff9966",
      secondary: "#ffcab0",
      tertiary: "#e64d00",
    },
  },
  custom: {
    primary: "#ff6680",
    secondary: "#ff4d6a",
    tertiary: "#ff3355",
    highContrast: {
      primary: "#ff99aa",
      secondary: "#ffccd5",
      tertiary: "#ff3355",
    },
  },
  // Arguments inside a define hat share the custom block colors.
  "custom-arg": {
    primary: "#ff6680",
    secondary: "#ff4d6a",
    tertiary: "#ff3355",
    highContrast: {
      primary: "#ff99aa",
      secondary: "#ffccd5",
      tertiary: "#ff3355",
    },
  },
  extension: {
    primary: "#0fbd8c",
    secondary: "#0da57a",
    tertiary: "#0b8e69",
    highContrast: {
      primary: "#13ecaf",
      secondary: "#75f0cd",
      tertiary: "#0b8e69",
    },
  },
  // Not defined by Scratch. The high contrast shades were picked by hand to be
  // readable with black text.
  obsolete: {
    primary: "#ed4242",
    secondary: "#db3333",
    tertiary: "#ca2b2b",
    highContrast: {
      primary: "#fc6666",
      secondary: "#fcb0b0",
      tertiary: "#d32121",
    },
  },
  // From early Scratch prototype colors. High contrast tertiary was changed to
  // be AAA against black text.
  grey: {
    primary: "#bfbfbf",
    secondary: "#b2b2b2",
    tertiary: "#909090",
    highContrast: {
      primary: "#bfbfbf",
      secondary: "#b2b2b2",
      tertiary: "#959595",
    },
  },
}

export default {
  name: "scratch",
  categories,
  blocks: commands,
}
