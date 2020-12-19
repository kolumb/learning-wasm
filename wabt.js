const moduleBuffer = Uint8Array.from(atob("AGFzbQEAAAABDAJgAn9/AX9gAX8BfwMDAgABBxACA2FkZAAABmRvdWJsZQABChECBwAgACABagsHACAAIABqCw=="), c => c.charCodeAt(0));
WebAssembly.instantiate(moduleBuffer).then(resultObject => {
    const result = resultObject.instance.exports.add(1, 2);
    console.log(result);
})
