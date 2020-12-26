const fs = require("fs");
const { execSync } = require('child_process');

const moduleName = process.argv[2];
const folderName = "./" + moduleName;
if (!fs.existsSync(moduleName + ".wat")) {
    const sources = fs.readdirSync("./").filter(file => file.endsWith(".wat"));
    if(sources.length > 0) {
        console.log(moduleName + ".wat not found. Avaiable sources are:")
        sources.forEach(file => console.log(file));
    }
    process.exit(1);
}
if (!fs.existsSync(folderName)) {
    fs.mkdirSync(folderName);
}

const modulePath = `${folderName}/${moduleName}.wasm`;
try {
    let stdout = execSync(`wat2wasm -o ${modulePath} ${moduleName}.wat`);
} catch(err) {
    process.exit(1);
}

if (!fs.existsSync(folderName + "/index.html")) {
    const htmlCode = fs.readFileSync("index-template.html").toString().replace(/MODULE_NAME/g, moduleName);
    fs.writeFileSync(folderName + "/index.html", htmlCode);
}
if (!fs.existsSync(folderName + "/script.js")) {
    fs.writeFileSync(folderName + "/script.js", `"use strict";
let module;
function initWASMModule(instantiatedWASMModule) {
    module = instantiatedWASMModule.instance.exports;
    console.log(module);
    const display = document.createElement('span')
    display.textContent = "You can output some results here.";
    document.querySelector('body').appendChild(display);
}
WebAssembly.instantiate(moduleBuffer).then(resultObject => {
    if(initWASMModule) initWASMModule(resultObject);
}).catch(function(err){
    console.log("You might need to build \\\"${moduleName}\\\" first");
    console.log(err)
});`);
}

const jsModuleSourcePath = `${folderName}/wasm-module-${moduleName}.js`;
const wasmModule = fs.readFileSync(modulePath).toString("base64");
const jsModuleInstantiationCode = `const moduleBuffer = Uint8Array.from(atob("${wasmModule}"), c => c.charCodeAt(0));`
fs.writeFileSync(jsModuleSourcePath, jsModuleInstantiationCode);
