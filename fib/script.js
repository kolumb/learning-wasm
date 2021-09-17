"use strict";
let module;
function initWASMModule(instantiatedWASMModule) {
    module = instantiatedWASMModule.instance.exports;
    console.log(module.fib(10));
    const display = document.createElement('span')
    display.textContent = module.fib(10);
    document.querySelector('body').appendChild(display);
}
WebAssembly.instantiate(moduleBuffer).then(resultObject => {
    if(resultObject) initWASMModule(resultObject);
}).catch(function(err){
    console.log("You might need to build \"fib\" first");
    console.log(err)
});