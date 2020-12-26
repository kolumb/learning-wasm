Minimalistic playground to learn WebAssembly text format.

Dependencies:
[Node.js](https://nodejs.org/)
[WABT: The WebAssembly Binary Toolkit](https://github.com/WebAssembly/wabt)


### How to create new module

* Create `<module-name>.wat` file with module.
```wat
(module
    (func $add (param $p1 i32) (param $p2 i32) (result i32)
        (local.get $p1)
        (local.get $p2)
        (i32.add)
    )
    (export "add" (func $add))

    (func $double (param $p1 i32) (result i32)
        (local.get $p1)
        (local.get $p1)
        (i32.add)
    )
    (export "double" (func $double))
)
```
* Write js code that uses the module in `script.js`. Call exported functions from `module` object.
```js
console.log(module.add(1, 2));
console.log(module.double(34));
```

### Build
Build all `*.wat` files:
```console
> node wasm2js.js
```
Build only specific ones:
```console
> node wasm2js.js module module2
```

Launch `index.html` in browser. No need to start http-server.

### TODO
- [ ] Add build with Deno.
