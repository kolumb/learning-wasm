const fs = require("fs");
const sourcePath = process.argv[2];
const wasmModule = fs.readFileSync(sourcePath).toString("base64");
console.log(`const moduleBuffer = Uint8Array.from(atob("${wasmModule}"), c => c.charCodeAt(0));
WebAssembly.instantiate(moduleBuffer).then(resultObject => {
    const result = resultObject.instance.exports.add(1, 2);
    console.log(result);
})`);
