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
#### Windows
```console
> build <module-name>
```

Launch `index.html` in browser. No need to start http-server.

### How it works
1. `wat2wasm` tool compiles WebAssembly text format to binary.
1. `wasm2js` script converts binary file to `base64` and links with `script.js` to create `wasm-module-?.js`.
1. `BatchSubstitute.bat` replaces module name with yours in `index-template.html`.
1. That way created `index.html` includes link to your `wasm-module-?.js` module.

### TODO
- [ ] Replace batch script with js text in file replacement implementation.
- [ ] Generate a folder for each module with main index page.
- [ ] Check if index.html for module was already generated. It should contain link to main index page.
- [ ] Split script.js into module itself (replacable) and one-time generated initialisation template.
- [ ] Add separate templates folder.
- [ ] build command should build all wat files, or list of specified. (extention is optional)
- [ ] Replace Node.js with Deno.
