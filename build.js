const fs = require("fs");
const { execSync } = require('child_process');

const moduleNames = []
let modulesToBuild = []
const sourceFolder = "./src/"
const buildFolder = "./build/"
const sources = fs.readdirSync(sourceFolder).filter(file => file.endsWith(".wat"));
Array.prototype.push.apply(moduleNames, sources.map(source => source.slice(0, -4)));
if(process.argv.length < 3) {
    modulesToBuild = moduleNames
    console.log('Building all modules: ' + moduleNames.join(", ") + ".");
} else {
    Array.prototype.push.apply(modulesToBuild, process.argv.slice(2));
    console.log('Building modules: ' + modulesToBuild.join(", ") + ".");
}

modulesToBuild.map(moduleName => {
    const folderName = buildFolder + moduleName;
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
        process.exit(err.status);
    }

    // if (!fs.existsSync(folderName + "/index.html")) {
        const htmlCode = fs.readFileSync("./templates/index-template.html").toString().replace(/MODULE_NAME/g, moduleName);
        fs.writeFileSync(folderName + "/index.html", htmlCode);
    // }
    if (!fs.existsSync(folderName + "/script.js")) {
        const jsCode = fs.readFileSync("./templates/script-template.js").toString().replace(/MODULE_NAME/g, moduleName);
        fs.writeFileSync(folderName + "/script.js", jsCode);
    }

    const jsModuleSourcePath = `${folderName}/wasm-module-${moduleName}.js`;
    const wasmModule = fs.readFileSync(modulePath).toString("base64");
    const jsModuleInstantiationCode = `"use strict";
const moduleBuffer = Uint8Array.from(atob("${wasmModule}"), c => c.charCodeAt(0));
`
    fs.writeFileSync(jsModuleSourcePath, jsModuleInstantiationCode);
});


const list = sources.reduce((acc, file)=>{
    const folderName = file.slice(0, -4);
    return acc
        + (fs.existsSync(buildFolder + folderName + "/index.html")
        ? `<li><a href="${folderName}/">${folderName}</a></li>`
        : '');
}, "");
const executerPage = fs.readFileSync("./templates/executor-template.html").toString().replace(/LIST_OF_MODULES/g, list)

fs.writeFileSync(buildFolder + "index.html", executerPage);

fs.writeFileSync("./inspector/module-names.js", `"use strict";\nmoduleNames = ${JSON.stringify(moduleNames)};\n`);
