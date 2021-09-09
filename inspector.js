"use strict"

const listOfModulesElem = document.querySelector("#ListOfModulesElem")
const displayElem = document.querySelector("#DisplayElem")
const canvasElem = document.querySelector("#CanvasElem")

function printByte(byte) {
    const span = document.createElement("span")
    span.textContent = byte.toString(16).padStart(2, "0") + " "
    displayElem.appendChild(span)
}

moduleNames && moduleNames.forEach(name => {
    const link = document.createElement("a")
    link.href = `./inspector.html?module=${name}`
    link.textContent = name
    const li = document.createElement("li")
    li.appendChild(link)
    listOfModulesElem.appendChild(li)
})
const moduleName = new URLSearchParams(location.search).get("module")
if (moduleName) {
    const scriptElem = document.createElement("script")
    scriptElem.src = `./${moduleName}/wasm-module-${moduleName}.js`
    document.body.appendChild(scriptElem)
    scriptElem.addEventListener("load", e => {
        const view = new Uint8Array(moduleBuffer)
        const wordWidth = 8
        const numberOfWords = 2
        const widthOfLine = wordWidth * numberOfWords
        for (let i = 0; i < view.length; i++) {
            printByte(view[i])
            if (i % 8 === 7) {
                displayElem.appendChild(document.createTextNode(" "))
            }
            if (i % widthOfLine === widthOfLine - 1) {
                displayElem.appendChild(document.createTextNode("\n"))
            }
        }
        const ctx = canvasElem.getContext("2d", {alpha: false})
        const scale = 2
        const padding = 4
        const widthOfDot = 3
        const widthOfSpace = 1
        const numberOfBitsInByte = 8
        const width = widthOfLine * numberOfBitsInByte
        const height = Math.ceil(view.length / widthOfLine)
        canvasElem.width = (padding * 2 + (width + Math.ceil(width / wordWidth) - 1 + (numberOfWords - 1) * 2) * (widthOfDot + widthOfSpace) - widthOfSpace) * scale
        canvasElem.height = (padding * 2 + (2 * height - 1) * (widthOfDot + widthOfSpace) - widthOfSpace) * scale
        ctx.fillStyle = "white"
        ctx.fillRect(0, 0, canvasElem.width, canvasElem.height)
        for (let i = 0; i < view.length; i++) {
            const x = (i * numberOfBitsInByte) % width
            const y = Math.floor((i * numberOfBitsInByte) / width)
            for (let j = 0; j < numberOfBitsInByte; j++) {
                if (view[i] & 2 ** j) {
                    ctx.fillStyle = "black"
                } else {
                    ctx.fillStyle = "lightgrey"
                }
                ctx.fillRect(
                    (padding + (x + j + Math.floor(x / numberOfBitsInByte) + 2 * Math.floor(x / (wordWidth * numberOfBitsInByte))) * (widthOfDot + widthOfSpace)) * scale,
                    (padding + 2 * y * (widthOfDot + widthOfSpace)) * scale,
                    widthOfDot * scale,
                    widthOfDot * scale
                )
            }
        }
    })
}
