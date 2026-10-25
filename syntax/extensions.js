/*
    When a new extension is added:
    1) Add it to extensions object
    2) Add its blocks to commands.js
    3) Add icon width/height to scratch3/blocks.js IconView
    4) Add icon to scratch3/style.js
*/

export const extensions = {
  pen: "pen",
  video: "video",
  music: "music",
  faceSensing: "faceSensing",
  tts: "tts",
  translate: "translate",
  microbit: "microbit",
  gdxfor: "gdxfor",
  wedo: "wedo",
  makeymakey: "makeymakey",
  ev3: "ev3",
  boost: "boost",
}

// Alias extensions: key is alias, value is real extension name
export const aliasExtensions = {
  wedo2: "wedo",
  text2speech: "tts",
}
