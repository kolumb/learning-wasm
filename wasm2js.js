const fs = require("fs");
const sourcePath = process.argv[2];
const wasmModule = fs.readFileSync(sourcePath).toString("base64");
console.log(`const moduleBuffer = Uint8Array.from(atob("${wasmModule}"), c => c.charCodeAt(0));`);
console.log('WebAssembly.instantiate(moduleBuffer).then(({instance: {exports: module}} = resultObject) => {')
console.log(fs.readFileSync("script.js").toString());
console.log('});')
