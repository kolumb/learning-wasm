"use strict";
function byte2str(byte) {
    if (null == byte) {
        console.error("Undefined argument in byte2str function");
        return;
    }
    return byte.toString(16).padStart(2, "0");
}

let module;
function initWASMModule(instantiatedWASMModule) {
    module = instantiatedWASMModule.instance.exports;
    const message = "Segmentation fault";
    const data = new TextEncoder().encode(message);
    const sharedMemory = new Uint8Array(module.memory.buffer, 0, data.length);
    sharedMemory.set(data);

    module.rot13(sharedMemory.length);

    const encryptedMessage = new TextDecoder().decode(sharedMemory);
    const display = document.createElement('span');
    display.innerHTML = `
        <div>${message}</div>
        <div><code>${Array.from(data).map(byte2str).join(", ")}</code></div>
        <div><code>${Array.from(sharedMemory).map(byte2str).join(", ")}</code></div>
        <div>${encryptedMessage}</div>`;

    module.rot13(sharedMemory.length);

    const decodedMessage = new TextDecoder().decode(sharedMemory);
    display.innerHTML += `
        <div><code>${Array.from(sharedMemory).map(byte2str).join(", ")}</code></div>
        <div>${decodedMessage}</div>`;

    document.querySelector('body').appendChild(display);
}
WebAssembly.instantiate(moduleBuffer).then(resultObject => {
    if(initWASMModule) initWASMModule(resultObject);
}).catch(function(err){
    console.log("You might need to build \"rot13\" first");
    console.log(err)
});
