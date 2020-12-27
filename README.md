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
* Build this module.
* Write js code that uses the module in `module-name/script.js`.
```js
console.log(module.add(1, 2));
console.log(module.double(34));
```

### Build
Build all `*.wat` files:
```console
> node build
```
Build only specific ones:
```console
> node build module module2
```

Launch `index.html` in browser. No need to start http-server.

### Cheat-sheet
token | meaning
----|----
;; | single-line comment
(; ;) | multi-line comment
module | Collection of functions
type | declaration for functions is optional
func | declaration with named index
export | func from stack
param | indexed (name is optional)
i32.add | i32 i32 → i32
i32.popcnt | count bites = 1
f32.sqrt | sqrt
i64.eqz | equal to zero
f64.lt | less than
i32.trunc_s/f32 | f32→i32
