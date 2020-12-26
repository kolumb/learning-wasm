"use strict";
let module;
function initWASMModule(instantiatedWASMModule) {
    module = instantiatedWASMModule.instance.exports;
    console.log(module.add(12));
    const display = document.createElement('span')
    display.textContent = module.add(12);
    document.querySelector('body').appendChild(display);
}
WebAssembly.instantiate(moduleBuffer).then(resultObject => {
    if(initWASMModule) initWASMModule(resultObject);
}).catch(function(err){
    console.log("You might need to build add first");
    console.log(err)
});