"use strict"

const listOfModulesElem = document.querySelector("#ListOfModulesElem")
const displayElem = document.querySelector("#DisplayElem")

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
        for (let i = 0; i < view.length; i++) {
            printByte(view[i])
            if (i % 8 === 7) {
                displayElem.appendChild(document.createTextNode(" "))
            }
            if (i % (16 * 2) === 16 * 2 - 1) {
                displayElem.appendChild(document.createTextNode("\n"))
            }
        }
    })
}
