"use strict";
let module;
function initWASMModule(instantiatedWASMModule) {
    module = instantiatedWASMModule.instance.exports;
    console.log(2,3, "add", module.add(2,3));
    console.log(4, "double", module.double(4));
    const display = document.createElement('span')
    display.textContent = `add(2,3) = ${module.add(2,3)}. double(4) = ${module.double(4)}.`;
    document.querySelector('body').appendChild(display);
}
WebAssembly.instantiate(moduleBuffer).then(resultObject => {
    if(resultObject) initWASMModule(resultObject);
}).catch(function(err){
    console.log("You might need to build \"add2\" first");
    console.log(err)
});