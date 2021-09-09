const fs = require("fs");
const { execSync } = require('child_process');

const moduleNames = []
const sources = fs.readdirSync("./").filter(file => file.endsWith(".wat"));
if(process.argv.length < 3) {
    Array.prototype.push.apply(moduleNames, sources.map(source => source.slice(0, -4)));
    console.log('Building all modules: ' + moduleNames.join(", ") + ".");
} else {
    Array.prototype.push.apply(moduleNames, process.argv.slice(2));
}

moduleNames.map(moduleName => {
    const folderName = "./" + moduleName;
    if (!fs.existsSync(moduleName + ".wat")) {
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
        const jsCode = fs.readFileSync("script-template.js").toString().replace(/MODULE_NAME/g, moduleName);
        fs.writeFileSync(folderName + "/script.js", jsCode);
    }

    const jsModuleSourcePath = `${folderName}/wasm-module-${moduleName}.js`;
    const wasmModule = fs.readFileSync(modulePath).toString("base64");
    const jsModuleInstantiationCode = `"use strict";
    const moduleBuffer = Uint8Array.from(atob("${wasmModule}"), c => c.charCodeAt(0));`
    fs.writeFileSync(jsModuleSourcePath, jsModuleInstantiationCode);
});


const list = sources.reduce((acc, file)=>{
    const folderName = file.slice(0, -4);
    return acc
        + (fs.existsSync(folderName + "/index.html")
        ? `<li><a href="${folderName}/index.html">${folderName}</a></li>`
        : '');
}, "");
const indexPage = `<!DOCTYPE html><html>
<head><meta charset="utf-8"><title>List of compiled modules</title></head>
<body>
    <p>List of compiled modules:</p>
    <ul>${list}</ul>
    <a href="./inspector.html">Inspector</a>
</body>
</html>`;
fs.writeFileSync("./index.html", indexPage);

fs.writeFileSync("./module-names.js", `"use strict";\nmoduleNames = ${JSON.stringify(moduleNames)};\n`);
