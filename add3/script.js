"use strict";
let module;
function initWASMModule(instantiatedWASMModule) {
    module = instantiatedWASMModule.instance.exports;
    console.log(module.hundred(12));
    const display = document.createElement('span')
    display.textContent = module.hundred(12);
    document.querySelector('body').appendChild(display);
}
WebAssembly.instantiate(moduleBuffer).then(resultObject => {
    if(resultObject) initWASMModule(resultObject);
}).catch(function(err){
    console.log("You might need to build \"add3\" first");
    console.log(err)
});