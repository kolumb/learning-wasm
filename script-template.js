"use strict";
let module;
function initWASMModule(instantiatedWASMModule) {
    module = instantiatedWASMModule.instance.exports;
    console.log(module);
    const display = document.createElement('span')
    display.textContent = "You can output some results here.";
    document.querySelector('body').appendChild(display);
}
WebAssembly.instantiate(moduleBuffer).then(resultObject => {
    if(initWASMModule) initWASMModule(resultObject);
}).catch(function(err){
    console.log("You might need to build \"MODULE_NAME\" first");
    console.log(err)
});