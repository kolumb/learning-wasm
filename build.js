const fs = require("fs");
const { execSync } = require('child_process');

const moduleNames = []
const sourceFolder = "./src/"
const sources = fs.readdirSync(sourceFolder).filter(file => file.endsWith(".wat"));
if(process.argv.length < 3) {
    Array.prototype.push.apply(moduleNames, sources.map(source => source.slice(0, -4)));
    console.log('Building all modules: ' + moduleNames.join(", ") + ".");
} else {
    Array.prototype.push.apply(moduleNames, process.argv.slice(2));
}

moduleNames.map(moduleName => {
    const folderName = "./" + moduleName;
    if (!fs.existsSync(sourceFolder + moduleName + ".wat")) {
        if(sources.length > 0) {
            console.log(sourceFolder + moduleName + ".wat not found. Avaiable sources are:")
            sources.forEach(file => console.log(file));
        }
        process.exit(1);
    }

    if (!fs.existsSync(folderName)) {
        fs.mkdirSync(folderName);
    }

    const modulePath = `${folderName}/${moduleName}.wasm`;
    try {
        let stdout = execSync(`wat2wasm -o ${modulePath} ${sourceFolder + moduleName}.wat`);
    } catch(err) {
        console.error(`Could not compile module "${sourceFolder + moduleName}.wat". Make sure that you have "wat2wasm" tool in your path.`)
        process.exit(1);
    }

    if (!fs.existsSync(folderName + "/index.html")) {
        const htmlCode = fs.readFileSync("./template/index-template.html").toString().replace(/MODULE_NAME/g, moduleName);
        fs.writeFileSync(folderName + "/index.html", htmlCode);
    }
    if (!fs.existsSync(folderName + "/script.js")) {
        const jsCode = fs.readFileSync("./template/script-template.js").toString().replace(/MODULE_NAME/g, moduleName);
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
        ? `<li><a href="${folderName}/">${folderName}</a></li>`
        : '');
}, "");
const indexPage = `<!DOCTYPE html><html>
<head><meta charset="utf-8"><title>List of compiled modules</title></head>
<body>
    <p>Main <a href="./inspector/">Inspector</a></p>
    <p>List of compiled modules:</p>
    <ul>${list}</ul>

    <script>
        // Fix links for local pages.
        if (location.protocol === "file:") {
            Array.from(document.querySelectorAll("a")).forEach(a => a.href = a.href.replace(/\\/$/, "/index.html"))
        }
    </script>
</body>
</html>`;
fs.writeFileSync("./index.html", indexPage);

fs.writeFileSync("./inspector/module-names.js", `"use strict";\nmoduleNames = ${JSON.stringify(moduleNames)};\n`);
