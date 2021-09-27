"use strict"

const sourceCodeLink = document.querySelector("#SourceCodeLink")
const themeTogglerElem = document.querySelector("#ThemeTogglerElem")
const listOfModulesElem = document.querySelector("#ListOfModulesElem")
const displayElem = document.querySelector("#DisplayElem")
const canvasElem = document.querySelector("#CanvasElem")
const report = document.querySelector("#ReportElem")

let bitmapWidth
let numberOfWords
let theme = localStorage.getItem("wasm-inspector-dark-theme") ?? "dark"
let dark = theme === "dark"
themeTogglerElem.textContent = dark ? "Light theme" : "Dark theme"
if (dark) {
    document.body.classList.add("dark")
} else {
    document.body.classList.remove("dark")
}

themeTogglerElem.addEventListener("click", e => {
    localStorage.setItem("wasm-inspector-dark-theme", dark ? "light" : "dark")
})

function initSizes() {
    if (document.body.clientWidth < 1000) {
        numberOfWords = 1
    } else {
        numberOfWords = 2
    }
    bitmapWidth = document.body.clientWidth - displayElem.offsetWidth / (3 - numberOfWords) - 20
}
initSizes()

addEventListener("resize", e => {
    // initSizes()
    // renderModule()
})


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

function getValue(view, index) {
    let numOfBytesInNumber = 1
    const firstByte = view[index]
    let value = firstByte
    if (firstByte > 63) {
        numOfBytesInNumber++
        value -= 128
    }
    return [numOfBytesInNumber, value]
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
        sourceCodeLink.href = `https://github.com/kolumb/learning-wasm/blob/main/src/${name}.wat`
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
    while(displayElem.firstChild) {
        displayElem.removeChild(displayElem.firstChild)
    }

    const wordWidth = 8
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
    // const scale = 2
    const padding = 4
    const widthOfDot = 3
    const widthOfSpace = 1
    const numberOfBitsInByte = 8
    const width = widthOfLine * numberOfBitsInByte
    const height = Math.ceil(moduleView.length / widthOfLine)

    const canvasElemWidth = (padding * 2 + (width + Math.ceil(width / wordWidth) - 1 + (numberOfWords - 1) * 2) * (widthOfDot + widthOfSpace) - widthOfSpace)
    const scale = bitmapWidth / canvasElemWidth
    canvasElem.width = canvasElemWidth * scale
    canvasElem.height = (padding * 2 + (2 * height - 1) * (widthOfDot + widthOfSpace) - widthOfSpace) * scale
    ctx.fillStyle = dark ? "#3B4252" : "#D8DEE9"
    ctx.fillRect(0, 0, canvasElem.width, canvasElem.height)
    for (let i = 0; i < moduleView.length; i++) {
        const x = (i * numberOfBitsInByte) % width
        const y = Math.floor((i * numberOfBitsInByte) / width)
        for (let j = 0; j < numberOfBitsInByte; j++) {
            if (moduleView[i] & 2 ** j) {
                ctx.fillStyle = dark ? "#E5E9F0" : "#434C5E"
            } else {
                ctx.fillStyle = dark ? "#1c1f26" : "white"
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

        memorySection: "memorySection",
        memNumb: "memNumb",
        memFlags: "memFlags",
        memInitAndMax: "memInitAndMax",

        exportSection: "exportSection",
        exportNumb: "exportNumb",
        exportNameLen: "exportNameLen",
        exportName: "exportName",
        exportKind: "exportKind",

        codeSection: "codeSection",
        blockNumb: "blockNumb",
        blockSize: "blockSize",
        localKindNumb: "localKindNumb",
        localTypeNumb: "localTypeNumb",
        localType: "localType",
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
    let numberOfMems
    let indexOfMemoryDecl
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
            div(report, indent, byteStr, byte > 0 ? `function returns ${byte} values with following types:`: `function returns nothing`)
            if (byte > 0) {
                numberOfRets = byte
                state = states.funcRetType
                indent++
            } else {
                numberOfTypes--
                if (numberOfTypes === 0) {
                    state = states.funcSection
                    indent -= 3
                } else {
                    state = states.type
                    indent -= 1
                }
            }
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
                if (nextByte === 0x05) {
                    state = states.memorySection
                } else {
                    state = states.exportSection
                }
                indent -= 2
            }
            break
// Section with Memory
        case states.memorySection:
            if (byte !== 0x05) { div(report, indent, byteStr, `Expected '05' as marker for section with memory declaration`); return}
            div(report, indent, byteStr, "start of section with memory")
            dataExplanation = `bytes of data with memory declaration`
            stateAfterData = states.memNumb
            state = states.data
            indent++
            break
        case states.memNumb:
            div(report, indent, byteStr, `number of memories (${byte})`)
            numberOfMems = byte
            indexOfMemoryDecl = 0
            state = states.memFlags
            indent++
            break
        case states.memFlags:
            div(report, indent, byteStr, `flags for memory with index '${indexOfMemoryDecl}'`)
            state = states.memInitAndMax
            indent++
            break
        case states.memInitAndMax:
            div(report, indent, `${byteStr} ${nextByteStr}`, `initial (${byte}) and maximum (${nextByte}) number of memory pages (64KiB each)`)
            indexOfMemoryDecl++
            state = states.skip
            if (numberOfMems === indexOfMemoryDecl) {
                stateAfterSkip = states.exportSection
                indent -= 3
            } else {
                stateAfterSkip = states.memFlags
                indent -= 1
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
            div(report, indent, byteStr, `number of exports (${byte})`)
            numberOfExports = byte
            state = states.exportNameLen
            indent++
            break
        case states.exportNameLen:
            div(report, indent, byteStr, `number of bytes that contain exported name (${byte})`)
            nameLen = byte
            state = states.exportName
            indent++
            break
        case states.exportName: {
            const bytesOfName = Array.from(moduleView.slice(i, i + nameLen))
            let nameBytes = bytesOfName.map(byte2str).join(" ")
            let name = bytesOfName.map(byte => String.fromCharCode(byte)).join("")
            div(report, indent, nameBytes, `"${name}" of kind:`)
            i += nameLen - 1
            state = states.exportKind
            indent++
            } break
        case states.exportKind:
            console.assert(byte === 0 || byte === 2, "Unknown export type. Currently supported only '00' and '02'")
            div(report, indent, `${byteStr} ${nextByteStr}`, `${byte === 0 ? "function" : "memory"} with index '${nextByte}'`)
            state = states.skip
            numberOfExports--
            if (numberOfExports === 0) {
                stateAfterSkip = states.codeSection
                indent -= 4
            } else {
                stateAfterSkip = states.exportNameLen
                indent -= 2
            }
            break

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
                // TODO: Check if block type detection is right
                const argument = nextByte
                const continueOrBreak = blockStack[blockStack.length - argument- 1] === blockTypes.loop ? "continue loop" : "break"
                div(report, indent, `${byte} ${nextByteStr}`, `br (${continueOrBreak} block with index ${argument} from end)`)
                state = states.skip
                } break
            case 0x0d: {
                const argument = nextByte
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
            case 0x28:
                div(report, indent, byteStr, `load (pop from stack index of memory and put on stack a value that's stored there)`)
                break
            case 0x36:
                div(report, indent, byteStr, `i32.store (pop from stack index of memory and a value that will be stored there)`)
                break
            case 0x41:
                div(report, indent, `${byteStr} ${nextByteStr}`, `i32.const (push constant value ${nextByte} on stack)`)
                // const [numOfBytesInNumber, value] = getValue(moduleView, i + 1)
                // div(report, indent, `${byteStr} ${nextByteStr}`, `i32.const ${numOfBytesInNumber}(push constant value ${value} on stack)`)
                state = states.skip
                break
            case 0x4c:
                div(report, indent, byteStr, `i32.le_s (pop two values from stack and compare them with <=)`)
                break
            case 0x4e:
                div(report, indent, byteStr, `i32.ge_s (pop two values from stack and compare them with >=)`)
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
