"use strict"

const listOfModulesElem = document.querySelector("#ListOfModulesElem")
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
        console.log("script loaded")
        console.log(moduleBuffer)
    })
}
