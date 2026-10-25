import init from "./index.js"

const mockblocks = (window.mockblocks = init(window))

// add our CSS to the page
mockblocks.appendStyles()

export default mockblocks
