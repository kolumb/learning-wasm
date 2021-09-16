"use strict"

const listOfModulesElem = document.querySelector("#ListOfModulesElem")
const displayElem = document.querySelector("#DisplayElem")
const canvasElem = document.querySelector("#CanvasElem")
const report = document.querySelector("#ReportElem")

function div(parent, indentation, code, text) {
    console.assert(indentation >= 0, `Non-negative indentation. Got ${indentation}`)
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

function byte2str(byte) {
    if (null == byte) {
        console.error("Undefined argument in byte2str function")
        return
    }
    return byte.toString(16).padStart(2, "0")
}

function printByte(byte) {
    const span = document.createElement("span")
    span.textContent = byte2str(byte) + " "
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
    scriptElem.addEventListener("load", reportModule)
}

function renderModule(moduleView) {
    const wordWidth = 8
    const numberOfWords = 2
    const widthOfLine = wordWidth * numberOfWords
    for (let i = 0; i < moduleView.length; i++) {
        printByte(moduleView[i])
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
    const height = Math.ceil(moduleView.length / widthOfLine)
    canvasElem.width = (padding * 2 + (width + Math.ceil(width / wordWidth) - 1 + (numberOfWords - 1) * 2) * (widthOfDot + widthOfSpace) - widthOfSpace) * scale
    canvasElem.height = (padding * 2 + (2 * height - 1) * (widthOfDot + widthOfSpace) - widthOfSpace) * scale
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, canvasElem.width, canvasElem.height)
    for (let i = 0; i < moduleView.length; i++) {
        const x = (i * numberOfBitsInByte) % width
        const y = Math.floor((i * numberOfBitsInByte) / width)
        for (let j = 0; j < numberOfBitsInByte; j++) {
            if (moduleView[i] & 2 ** j) {
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
}

function reportModule(e) {
    const moduleView = new Uint8Array(moduleBuffer)

    renderModule(moduleView)

    const states = {
        typeSection: "typeSection",
        typeNumb: "typeNumb",
        type: "type",
        funcArgNumb: "funcArgNumb",
        funcArgType: "funcArgType",
        funcRetNumb: "funcRetNumb",
        funcRetType: "funcRetType",

        funcSection: "funcSection",
        funcNumb: "funcNumb",
        funcTypeIndex: "funcTypeIndex",

        exportSection: "exportSection",
        exportNumb: "exportNumb",
        exportNameLen: "exportNameLen",
        exportName: "exportName",

        codeSection: "codeSection",
        blockNumb: "blockNumb",
        blockSize: "blockSize",
        localKindNumb: "localKindNumb",
        localTypeNumb: "localTypeNumb",
        localType: "localType",


        allocNumb: "allocNumb",
        allocType: "allocType",
        opCode: "opCode",

        data: "data",
        skip: "skip",
    }
    let indent = 0
    let state = states.typeSection
    let dataExplanation = ""
    let stateAfterData = states.opCode
    let typeToParse = "i32"
    let numberOfTypes
    let typeIndex
    let numberOfArgs
    let numberOfRets
    let numberOfFuncs
    let numberOfExports
    let nameLen
    let numberOfBlocks
    let localKindNumb
    let stateAfterSkip = states.opCode
    const blockStack = []

    const signatureAndVersion = Array.from(moduleView.slice(0, 8)).map(byte2str).join(" ")
    if (signatureAndVersion === "00 61 73 6d 01 00 00 00") {
        div(report, indent, "00 61 73 6d   01 00 00 00", "asm version 1")
    } else {
        report.textContent = `Unknown file format "${signatureAndVersion}". Expected "00 61 73 6d 01 00 00 00"`
        return;
    }
    for (let i = 8; i < moduleView.length; i++) {
        const byte = moduleView[i]
        const byteStr = byte2str(moduleView[i])
        const nextByte = moduleView[i+1]
        const nextByteStr = byte2str(moduleView[i+1] ?? 0)
        switch (state) {
// Section with Types
        case states.typeSection:
            if (byte !== 0x01) { div(report, indent, byteStr, `Expected '01' as marker for section with type declarations`); return}
            div(report, indent, byteStr, `start of section with types`)
            dataExplanation = "bytes of data with types"
            stateAfterData = states.typeNumb
            state = states.data
            indent++
            break
        case states.typeNumb:
            div(report, indent, byteStr, `number of types (${byte})`)
            numberOfTypes = byte
            typeIndex = 0
            state = states.type
            indent++
            break
        case states.type:
            if (byte !== 0x60) { div(report, indent, byteStr, `Expected '60'. Currently supported only function types`); return}
            div(report, indent, byteStr, `type declaration for function (under index ${typeIndex}):`)
            typeIndex++
            state = states.funcArgNumb
            indent++
            break
        case states.funcArgNumb:
            div(report, indent, byteStr, `function accepts ${byte} arguments with following types:`)
            numberOfArgs = byte
            state = states.funcArgType
            indent++
            break
        case states.funcArgType:
            div(report, indent, byteStr, byte2type[byte])
            numberOfArgs--
            if (numberOfArgs === 0) {
                state = states.funcRetNumb
                indent--
            }
            break
        case states.funcRetNumb:
            div(report, indent, byteStr, `function returns ${byte} values with following types:`)
            numberOfRets = byte
            state = states.funcRetType
            indent++
            break
        case states.funcRetType:
            div(report, indent, byteStr, byte2type[byte])
            numberOfRets--
            if (numberOfRets === 0) {
                numberOfTypes--
                if (numberOfTypes === 0) {
                    state = states.funcSection
                    indent -= 4
                } else {
                    state = states.type
                    indent -= 2
                }
            }
            break
// Section with Functions
        case states.funcSection:
            if (byte !== 0x03) { div(report, indent, byteStr, `Expected '03' as marker for section with function declarations`); return}
            div(report, indent, byteStr, "start of section with functions")
            dataExplanation = `bytes of data with functions`
            stateAfterData = states.funcNumb
            state = states.data
            indent++
            break
        case states.funcNumb:
            div(report, indent, byteStr, `number of functions (${byte}) with type:`)
            numberOfFuncs = byte
            state = states.funcTypeIndex
            indent++
            break
        case states.funcTypeIndex:
            div(report, indent, byteStr, `index of type that function has (${byte})`)
            numberOfFuncs--
            if (numberOfFuncs === 0) {
                state = states.exportSection
                indent -= 2
            }
            break
// Section with Exports
        case states.exportSection:
            if (byte !== 0x07) { div(report, indent, byteStr, `Expected '07' as marker for section with exports`); return}
            div(report, indent, byteStr, "start of section with exports")
            dataExplanation = `bytes of data with exports`
            stateAfterData = states.exportNumb
            state = states.data
            indent++
            break
        case states.exportNumb:
            div(report, indent, byteStr, `number of exported functions (${byte}) with indices:`)
            numberOfExports = byte
            state = states.exportNameLen
            indent++
            break
        case states.exportNameLen:
            div(report, indent, byteStr, `number of bytes that contain exported function name (${byte}):`)
            nameLen = byte
            state = states.exportName
            indent++
            break
        case states.exportName: {
            const bytesOfName = Array.from(moduleView.slice(i, i + nameLen + 1))
            let nameBytes = bytesOfName.map(byte2str).join(" ")
            let name = bytesOfName.map(byte => String.fromCharCode(byte)).join("").replace("\0", "\\0")
            const index = moduleView[i + nameLen + 1]
            div(report, indent, `${nameBytes}, ${byte2str(index)}`, `"${name}" with index ${index}`)
            i += nameLen + 1
            numberOfExports--
            if (numberOfExports === 0) {
                state = states.codeSection
                indent -= 2
            } else {
                state = states.exportNameLen
            }
            indent--
            } break

// Section with Code
        case states.codeSection:
            if (byte !== 0x0a) { div(report, indent, byteStr, `Expected '0a' as marker for section with code`); return}
            div(report, indent, byteStr, "start of section with code")
            dataExplanation = `bytes of data with code`
            stateAfterData = states.blockNumb
            state = states.data
            indent++
            break
        case states.blockNumb:
            div(report, indent, byteStr, `number of blocks in module (${byte})`)
            numberOfBlocks = byte
            state = states.blockSize
            indent++
            break
        case states.blockSize:
            div(report, indent, byteStr, `bytes of data in block (${byte})`)
            blockStack.push(blockTypes.block)
            state = states.localKindNumb
            indent++
            break
        case states.localKindNumb:
            div(report, indent, byteStr, `number of type kinds of local variables that will be allocated (${byte})`)
            localKindNumb = byte
            if (localKindNumb) {
                state = states.localTypeNumb
                indent++
            } else {
                state = states.opCode
            }
            break
        case states.localTypeNumb:
            div(report, indent, byteStr, `number of local variables that will be allocated (${byte})`)
            state = states.localType
            indent++
            break
        case states.localType:
            div(report, indent, byteStr, `type of variables is '${byte2type[byte]}'`)
            localKindNumb--
            if (localKindNumb === 0) {
                state = states.opCode
                indent -= 2
            } else {
                state = states.localTypeNumb
                indent--
            }
            break
        case states.opCode:
            switch (byte) {
            case 0x01:
                div(report, indent, byteStr, `module start`)
                dataExplanation = `bytes of data with module`
                state = states.data
                indent++
                break
            case 0x02:
                div(report, indent, `${byte} ${nextByteStr}`, `start of "block" block`)
                blockStack.push(blockTypes.block)
                state = states.skip
                indent++
                break
            case 0x03:
                div(report, indent, `${byte} ${nextByteStr}`, `start of "loop" block`)
                blockStack.push(blockTypes.loop)
                indent++
                state = states.skip
                break
            case 0x0b:
                div(report, indent, byteStr, `end (close block)`)
                if (!blockStack.pop()) console.error("Stack Underflow")
                if (blockStack.length === 0) {
                    state = states.blockSize
                }
                indent--
                break
            case 0x0c: {
                const argument = byte
                const continueOrBreak = blockStack[blockStack.length - argument- 1] === blockTypes.loop ? "continue loop" : "break"
                div(report, indent, `${byte} ${nextByteStr}`, `br (${continueOrBreak} block with index ${argument} from end)`)
                state = states.skip
                } break
            case 0x0d: {
                const argument = byte
                const continueOrBreak = blockStack[blockStack.length - argument- 1] === blockTypes.loop ? "continue loop" : "break"
                div(report, indent, `${byte} ${nextByteStr}`, `br_if (${continueOrBreak} block with index ${argument} from end if comparison was successful)`)
                state = states.skip
                } break
            case 0x0f:
                div(report, indent, byteStr, `return (pop value from stack and return it to caller)`)
                break
            case 0x20:
                div(report, indent, `${byteStr} ${nextByteStr}`, `local.get (push on stack value of local variable by index ${nextByte})`)
                state = states.skip
                break
            case 0x21:
                div(report, indent, `${byteStr} ${nextByteStr}`, `local.set (pop value from stack to local variable by index ${nextByte})`)
                state = states.skip
                break
            case 0x22:
                div(report, indent, `${byteStr} ${nextByteStr}`, `local.tee (pop value from stack to variable with index ${nextByte} and put it back on stack)`)
                state = states.skip
                break
            case 0x41:
                div(report, indent, `${byteStr} ${nextByteStr}`, `i32.const (push constant value ${byte} on stack)`)
                state = states.skip
                break
            case 0x4c:
                div(report, indent, byteStr, `i32.le_s (pop two values from stack and compare them with <=)`)
                break
            case 0x69:
                div(report, indent, byteStr, `i32.popcnt (count bites that == 1)`)
                break
            case 0x6a:
                div(report, indent, byteStr, `i32.add (pop two values from stack, add them and push result on stack)`)
                break
            case 0x6b:
                div(report, indent, byteStr, `i32.sub (pop two values from stack, subtract them and push result on stack)`)
                break
            case 0x91:
                div(report, indent, byteStr, `f32.sqrt (pop value from stack caclulate square root of it and push result on stack)`)
                break
            case 0xa8:
                div(report, indent, byteStr, `i32.trunc_s/f32 (convert f32 to i32)`)
                break
            default:
                div(report, indent, byteStr, `< < < Unknown > > >`)
            }
            break
        case states.data:
            switch (typeToParse) {
            case "i32":
                div(report, indent, byteStr, `${byte} ${dataExplanation}`)
                dataExplanation = ""
                break
            default: console.error(`Unknown type ${typeToParse}`)
            }
            state = stateAfterData
            stateAfterData = states.opCode
            break
        case states.skip:
            state = stateAfterSkip
            stateAfterSkip = states.opCode
            break
        default:
            console.error(`unknown state ${state}`)
        }
    }

}
