"use strict"

const listOfModulesElem = document.querySelector("#ListOfModulesElem")
const displayElem = document.querySelector("#DisplayElem")
const canvasElem = document.querySelector("#CanvasElem")
const partsElem = document.querySelector("#PartsElem")

function div(parent, code, text) {
    const codeElem = document.createElement("code")
    codeElem.textContent = code
    const pre = document.createElement("pre")
    pre.appendChild(codeElem)
    const textNode = document.createTextNode(text)
    const div = document.createElement("div")
    div.appendChild(pre)
    div.appendChild(textNode)
    parent.appendChild(div)
}

function byteStr(byte) {
    return byte.toString(16).padStart(2, "0")
}

function printByte(byte) {
    const span = document.createElement("span")
    span.textContent = byteStr(byte) + " "
    displayElem.appendChild(span)
}

function getType(byte) {
    switch (byte) {
        case 0x7f: return "i32"
        case 0x7e: return "i64"
        case 0x7d: return "f32"
        case 0x7c: return "f64"
        default: return "unknown"
    }
}

let moduleName = new URLSearchParams(location.search).get("module")
if (!moduleName && moduleNames && moduleNames[0]) {
    moduleName = moduleNames[0]
}
moduleNames && moduleNames.forEach(name => {
    const link = document.createElement("a")
    if (name === moduleName) {
        link.classList.add("current-module")
    }
    const fixLocalLinks = location.protocol === "file:" ? "index.html" : ""
    link.href = `./${fixLocalLinks}?module=${name}`
    link.textContent = name
    const li = document.createElement("li")
    li.appendChild(link)
    listOfModulesElem.appendChild(li)
})
if (moduleName) {
    const scriptElem = document.createElement("script")
    scriptElem.src = `../${moduleName}/wasm-module-${moduleName}.js`
    document.body.appendChild(scriptElem)
    scriptElem.addEventListener("load", e => {
        const view = new Uint8Array(moduleBuffer)
        let index = 8
        const signatureAndVersion = Array.from(view.slice(0, index)).map(byteStr).join(" ")
        if (signatureAndVersion === "00 61 73 6d 01 00 00 00") {
            div(partsElem, "00 61 73 6d   01 00 00 00", " — asm version 1")
        } else {
            partsElem.textContent = "Unknown file format"
            return;
        }
        div(partsElem, `${byteStr(view[index])}`, ` — ${view[index] === 1 ? "start of section with types" : "that's something new.. Expected 01"}`)
        index++
        div(partsElem, `  ${byteStr(view[index])}`, ` — number of bytes with types (${view[index]})`)
        index++
        const numberOfTypes = view[index]
        div(partsElem, `  ${byteStr(view[index])}`, ` — number of types (${view[index]})`)
        index++
        for (let i = 0; i < numberOfTypes; i++) {
            div(partsElem, `    ${byteStr(view[index])}`, ` — ${view[index] === 0x60 ? "function type" : "what is this? I know only 60"}`)
            index++
            const arity = view[index]
            div(partsElem, `      ${Array.from(view.slice(index, index + arity + 1)).map(byteStr).join(" ")}`, ` — ${arity} arguments of type ${Array.from(view.slice(index + 1, index + arity + 1)).map(getType).join(", ")}`)
            index += arity + 1
            const outputs = view[index]
            div(partsElem, `      ${Array.from(view.slice(index, index + outputs + 1)).map(byteStr).join(" ")}`, ` — ${outputs} output of type ${Array.from(view.slice(index + 1, index + outputs + 1)).map(getType).join(", ")}`)
            index += outputs + 1
        }

        div(partsElem, `${byteStr(view[index])}`, ` — ${view[index] === 3 ? "start of section with function declarations" : "that's something new. Expected 03"}`)
        index++
        div(partsElem, `  ${byteStr(view[index])}`, ` — number of bytes with function declarations (${view[index]})`)
        index++
        const numberOfFunctions = view[index]
        div(partsElem, `  ${Array.from(view.slice(index, index + numberOfFunctions + 1)).map(byteStr).join(" ")}`, ` — ${numberOfFunctions} functions with types ${Array.from(view.slice(index + 1, index + numberOfFunctions + 1)).join(", ")}`)
        index += numberOfFunctions + 1

        div(partsElem, `${byteStr(view[index])}`, ` — ${view[index] === 7 ? "start of section with exports" : "that's something new. Expected 07"}`)
        index++
        div(partsElem, `  ${byteStr(view[index])}`, ` — number of bytes with exports (${view[index]})`)
        index++
        const numberOfExports = view[index]
        div(partsElem, `  ${byteStr(view[index])}`, ` — number of exports (${view[index]})`)
        index++
        for (let i = 0; i < numberOfExports; i++) {
            const lengthOfName = view[index]
            div(partsElem, `    ${byteStr(view[index])}`, ` — length of name (${view[index]})`)
            index++
            div(partsElem, `      ${Array.from(view.slice(index, index + lengthOfName + 2)).map(byteStr).join(" ")}`, ` — exported function "${Array.from(view.slice(index, index + lengthOfName)).map(c => String.fromCharCode(c)).join("")}" with index ${view[index + lengthOfName + 1]}`)
            index += lengthOfName + 2
        }

        div(partsElem, `${byteStr(view[index])}`, ` — ${view[index] === 10 ? "start of section with code" : "that's something new. Expected 0a"}`)
        index++
        div(partsElem, `  ${byteStr(view[index])}`, ` — number of bytes with code (${view[index]})`)
        index++
        
        div(partsElem, `${Array.from(view.slice(index)).map(byteStr).join(" ")}`, "")
        const codeStrings = Array.from(view.slice(index)).map(byteStr)
        let state = "opcode"
        codeStrings.forEach(byte => {
            switch (state) {
            case "opcode": 
                switch (byte) {
                case "03":
                    div(partsElem, `${byte}`, ` — function call`)
                    break
                default:

                }
                break
            case "data":

                break
            default:
                console.error(`unknown state ${state}`)
            }
        })

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
