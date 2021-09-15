"use strict"

const listOfModulesElem = document.querySelector("#ListOfModulesElem")
const displayElem = document.querySelector("#DisplayElem")
const canvasElem = document.querySelector("#CanvasElem")
const report = document.querySelector("#ReportElem")

function div(parent, indentation, code, text) {
    const indentationSize = 2
    const separator = " — "
    const codeElem = document.createElement("code")
    codeElem.textContent = " ".repeat(indentation * indentationSize) + code
    const pre = document.createElement("pre")
    pre.appendChild(codeElem)
    const textNode = document.createTextNode(separator + text)
    const div = document.createElement("div")
    div.appendChild(pre)
    div.appendChild(textNode)
    parent.appendChild(div)
}

function byteStr(byte) {
    if (null == byte) {
        console.error("Segmentation fault")
        return
    }
    return byte.toString(16).padStart(2, "0")
}

function printByte(byte) {
    const span = document.createElement("span")
    span.textContent = byteStr(byte) + " "
    displayElem.appendChild(span)
}

const byte2type = {
    0x7f: "i32",
    0x7e: "i64",
    0x7d: "f32",
    0x7c: "f64",
}

const blockTypes = { block: "block", loop: "loop", if: "if"}

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
        let indent = 0
        let index = 8
        const signatureAndVersion = Array.from(view.slice(0, index)).map(byteStr).join(" ")
        if (signatureAndVersion === "00 61 73 6d 01 00 00 00") {
            div(report, indent, "00 61 73 6d   01 00 00 00", "asm version 1")
        } else {
            report.textContent = "Unknown file format"
            return;
        }
        div(report, indent, `${byteStr(view[index])}`, `${view[index] === 1 ? "start of section with types" : "that's something new.. Expected 01"}`)
        index++
        indent++
        div(report, indent, `${byteStr(view[index])}`, `number of bytes with types (${view[index]})`)
        index++
        const numberOfTypes = view[index]
        div(report, indent, `${byteStr(view[index])}`, `number of types (${view[index]})`)
        index++
        indent++
        for (let i = 0; i < numberOfTypes; i++) {
            div(report, indent, `${byteStr(view[index])}`, `${view[index] === 0x60 ? "function type" : "what is this? I know only 60"}`)
            index++
            indent++
            const arity = view[index]
            div(report, indent, `${Array.from(view.slice(index, index + arity + 1)).map(byteStr).join(" ")}`, `${arity} arguments of type ${Array.from(view.slice(index + 1, index + arity + 1)).map(byte => byte2type[byte]).join(", ")}`)
            index += arity + 1
            const outputs = view[index]
            div(report, indent, `${Array.from(view.slice(index, index + outputs + 1)).map(byteStr).join(" ")}`, `${outputs} output of type ${Array.from(view.slice(index + 1, index + outputs + 1)).map(byte => byte2type[byte]).join(", ")}`)
            index += outputs + 1
            indent--
        }
        indent = 0
        div(report, indent, `${byteStr(view[index])}`, `${view[index] === 3 ? "start of section with function declarations" : "that's something new. Expected 03"}`)
        index++
        indent++
        div(report, indent, `${byteStr(view[index])}`, `number of bytes with function declarations (${view[index]})`)
        index++
        const numberOfFunctions = view[index]
        div(report, indent, `${Array.from(view.slice(index, index + numberOfFunctions + 1)).map(byteStr).join(" ")}`, `${numberOfFunctions} functions with types ${Array.from(view.slice(index + 1, index + numberOfFunctions + 1)).join(", ")}`)
        index += numberOfFunctions + 1

        indent = 0
        div(report, indent, `${byteStr(view[index])}`, `${view[index] === 7 ? "start of section with exports" : "that's something new. Expected 07"}`)
        index++
        indent++
        div(report, indent, `${byteStr(view[index])}`, `number of bytes with exports (${view[index]})`)
        index++
        const numberOfExports = view[index]
        div(report, indent, `${byteStr(view[index])}`, `number of exports (${view[index]})`)
        index++
        indent++
        for (let i = 0; i < numberOfExports; i++) {
            const lengthOfName = view[index]
            div(report, indent, `${byteStr(view[index])}`, `length of name (${view[index]})`)
            index++
            indent++
            div(report, indent, `${Array.from(view.slice(index, index + lengthOfName + 2)).map(byteStr).join(" ")}`, `exported function "${Array.from(view.slice(index, index + lengthOfName)).map(c => String.fromCharCode(c)).join("")}" with index ${view[index + lengthOfName + 1]}`)
            index += lengthOfName + 2
            indent--
        }

        indent = 0
        div(report, indent, `${byteStr(view[index])}`, `${view[index] === 10 ? "start of section with code" : "that's something new. Expected 0a"}`)
        index++
        indent++
        div(report, indent, `${byteStr(view[index])}`, `number of bytes with code (${view[index]})`)
        index++
        
        div(report, indent, `${Array.from(view.slice(index)).map(byteStr).join(" ")}`, "")
        const codeStrings = Array.from(view.slice(index)).map(byteStr)
        const states = {
            opcode: "opcode",
            datalen: "datalen",
            localalloc: "localalloc",
            allocnumb: "allocnumb",
            alloctype: "alloctype",
            data: "data",
        }
        let state = states.opcode
        let locals = 0
        let typeToParse = ""
        const blockStack = []
        let dataExplanationTemplate = ""
        codeStrings.forEach((byte, i) => {
            if (i === 2) {
                if (byte === "00") {
                    div(report, indent, `${byte}`, `no additional local variables`)
                    return
                } else {
                    state = states.localalloc
                }
            }
            switch (state) {
            case states.opcode:
                switch (byte) {
                case "01":
                    div(report, indent, `${byte}`, `module start`)
                    state = states.datalen
                    break
                case "02":
                    div(report, indent, `${byte}`, `start of "block" block`)
                    blockStack.push(blockTypes.block)
                    break
                case "03":
                    div(report, indent, `${byte}`, `start of "loop" block`)
                    blockStack.push(blockTypes.loop)
                    break
                case "0d":
                    div(report, indent, `${byte}`, `br_if (breack if comparison was successful)`)
                    dataExplanationTemplate = blockStack[blockStack.length - 1] === "continue block VALUE in block stack" ? "" : "will break VALUE + 1 blocks"
                    typeToParse = "i32"
                    state = states.data
                    break
                case "20":
                    div(report, indent, `${byte}`, `local.get (push on stack value of local variable by index)`)
                    typeToParse = "i32"
                    state = states.data
                    break
                case "21":
                    div(report, indent, `${byte}`, `local.set (set value of local variable by index using a value on the stack)`)
                    typeToParse = "i32"
                    state = states.data
                    break
                case "40":
                    div(report, indent, `${byte}`, `block pseudo-type`)
                    indent++
                    break
                case "41":
                    div(report, indent, `${byte}`, `i32.const (push constant value on stack)`)
                    typeToParse = "i32"
                    state = states.data
                    break
                case "4c":
                    div(report, indent, `${byte}`, `i32.le_s (<=)`)
                    break
                default:

                }
                break
            case states.datalen:
                div(report, indent, `${byte}`, `size is ${parseInt(byte)} bytes`)
                indent++
                state = states.opcode
                break
            case states.localalloc:
                locals = parseInt(byte)
                div(report, indent, `${byte}`, `${locals} type kinds will be allocated`)
                indent++
                state = states.allocnumb
                break
            case states.allocnumb:
                div(report, indent, `${byte}`, `allocate ${parseInt(byte)} variables`)
                state = states.alloctype
                indent++
                break
            case states.alloctype:
                div(report, indent, `${byte}`, `of type ${byte2type[parseInt(byte, 16)]}`)
                locals--
                if (locals === 0) {
                    state = states.opcode
                    indent--
                } else {
                    state = states.allocnumb
                }
                indent--
                break
            case states.data:
                switch (typeToParse) {
                case "i32":
                    const value = parseInt(byte)
                    div(report, indent + 1, `${byte}`, `${value} ${dataExplanationTemplate.replace("VALUE", value)}`)
                    dataExplanationTemplate = ""
                    break
                default: console.error(`Unknown type ${typeToParse}`)
                }
                state = states.opcode
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
