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
byte | token            | meaning
-----|------------------|--------------------------------------
     | ;;               | single-line comment
     | (; ;)            | multi-line comment
     | module           | collection of functions
01   | type             | declaration for functions is optional
03   | func             | declaration with named index
07   | export           | func from stack
60   | param            | indexed (name is optional)
     | result           | accepts a type
20   | local.get        | get value of local variable by index
7f   | i32              | 32 bit integer type
6a   | i32.add          | i32 i32 -> i32
     | i32.popcnt       | count bites = 1
     | f32.sqrt         | sqrt
     | i64.eqz          | equal to zero
     | f64.lt           | less than
     | i32.trunc_s/f32  | f32 -> i32
0b   | end              | end block of function

### Wasm file anatomy (based on `add` module)
```
00 61 73 6d 01 00 00 00  01 07 01 60 02 7f 7f 01
7f 03 02 01 00 07 07 01  03 61 64 64 00 00 0a 09
01 07 00 20 00 20 01 6a  0b
```

N of bytes | example value | meaning
-----------|---------------|--------------
4          | 00 61 73 6d   | file signature (Magic bytes) "\0asm"
4          | 01 00 00 00   | wasm version number
1          | 01            | type header section
1          | 07            | number of bytes with types
7          | ->            | 01 60 02 7f 7f 01 7f
//         |               | one type for function with 2 params and 1 output (all ints)
1          | 03            | function header section
1          | 02            | number of bytes with function definition
2          | ->            | 01 00
//         |               | one function with index `0`
1          | 07            | export header section
1          | 07            | number of bytes with export data
7          | ->            | 01 03 61 64 64 00 00
//         |               | one function name with length of 3 which corresponds to a function with index `0`
//         | ..61 64 64..  | name of exported function ("add")
1          | 0a            | code section
1          | 09            | number of bytes with code
9          | ->            | 01 07 00 20 00 20 01 6a  0b
//         |               | one block with length of 7. function with index `0`. get 0, get 0, add, end.

### Wasm file anatomy (based on `add2` module)
```
00 61 73 6d 01 00 00 00  01 0c 02 60 02 7f 7f 01
7f 60 01 7f 01 7f 03 03  02 00 01 07 10 02 03 61
64 64 00 00 06 64 6f 75  62 6c 65 00 01 0a 11 02
07 00 20 00 20 01 6a 0b  07 00 20 00 20 00 6a 0b
```

N of bytes | example value | meaning
-----------|---------------|--------------
4          | 00 61 73 6d   | file signature (Magic bytes) "\0asm"
4          | 01 00 00 00   | wasm version number
1          | 01            | type header section
1          | 0c            | number of bytes with types
12         | ->            | 02 60 02 7f 7f 01 7f 60 01 7f 01 7f
//         |               | two types for functions. 2in 1out. 1in 1out
1          | 03            | function header section
1          | 03            | number of bytes with function definition
2          | ->            | 02 00 01
//         |               | two functions with index `0` and `1`
1          | 07            | export header section
1          | 10            | number of bytes with export data
16         | ->            | 02 03 61 64  64 00 00 06  64 6f 75 62  6c 65 00 01
//         |               | two function names with length of 3 and 6 which corresponds to functions with indices `0` and `1`
//         | ..61 64 64..  | name of exported function ("add\0")
//         | 646f75626c65  | name of exported function ("double\0")
1          | 0a            | code section
1          | 11            | number of bytes with code
17         | ->            | 02  07 00 20 00 20 01 6a 0b  07 00 20 00 20 00 6a 0b
//         |               | two blocks of code both with length of 7 bytes.
