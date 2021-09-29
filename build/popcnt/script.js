"use strict";
let module;
function initWASMModule(instantiatedWASMModule) {
    module = instantiatedWASMModule.instance.exports;
    console.log(module.popcnt(2**6));
    console.log(module.popcnt(2**8));
    const display = document.createElement('span')
    display.textContent = `
        Math.sqrt(2^6) - 1 bit count = ${module.popcnt(2**6)};
        Math.sqrt(2^8) - 1 bit count = ${module.popcnt(2**8)};
    `;
    document.querySelector('body').appendChild(display);
}
WebAssembly.instantiate(moduleBuffer).then(resultObject => {
    if(resultObject) initWASMModule(resultObject);
}).catch(function(err){
    console.log("You might need to build \"popcnt\" first");
    console.log(err)
});