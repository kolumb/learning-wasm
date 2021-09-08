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
        const widthOfWord = 8 * 2
        for (let i = 0; i < view.length; i++) {
            printByte(view[i])
            if (i % 8 === 7) {
                displayElem.appendChild(document.createTextNode(" "))
            }
            if (i % widthOfWord === widthOfWord - 1) {
                displayElem.appendChild(document.createTextNode("\n"))
            }
        }
        const ctx = canvasElem.getContext("2d", {alpha: false})
        const scale = 10
        const padding = 1
        const width = widthOfWord * 8
        const height = Math.ceil(view.length / widthOfWord)
        canvasElem.width = (padding + width + widthOfWord * 2) * scale
        canvasElem.height = (padding + height) * 2 * scale
        ctx.fillStyle = "white"
        ctx.fillRect(0, 0, canvasElem.width, canvasElem.height)
        for (let i = 0; i < view.length; i++) {
            const x = (i * 8) % width
            const y = Math.floor((i * 8) / width)
            for (let j = 0; j < 8; j++) {
                if (view[i] & 2 ** j) {
                    ctx.fillStyle = "black"
                } else {
                    ctx.fillStyle = "lightgrey"
                }
                ctx.fillRect((padding + x + j + Math.floor(x / 8) + Math.floor(x / 64) * 2) * scale, (padding + y) * scale * 2, Math.ceil(2 * scale / 3), Math.ceil(2 * scale / 3))
            }
        }
    })
}
