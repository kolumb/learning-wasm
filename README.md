Minimalistic playground to learn WebAssembly text format.

Demo: https://kolumb.github.io/learning-wasm/executor.html

Dependencies:
- [Node.js](https://nodejs.org/)
- [WABT: The WebAssembly Binary Toolkit](https://github.com/WebAssembly/wabt)


### How to create new module

* Create `<module-name>.wat` file in `src` folder with module.
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
* [Build](#build) this module.
* Write js code that uses the module in `module-name/script.js`.
```js
console.log(module.add(1, 2));
console.log(module.double(34));
```
<a name="build"></a>
### Build
Build all `*.wat` files:
```console
> node build
```
Build only specific ones:
```console
> node build module module2
```

Launch `executor.html` in browser. No need to start http-server.

### Cheat-sheet
| Opcode | token            | meaning
|--------|------------------|--------------------------------------
|        | ;;               | single-line comment
|        | (; ;)            | multi-line comment
|        | module           | collection of functions
| 01     | type             | declaration for functions is optional
| 03     | func             | declaration with named index
| 07     | export           | func from stack
| 60     | param            | indexed (name is optional)
|        | result           | accepts a type
| 40     |                  | pseudo type for block
| 02     | block            | start block of code. May or my not return a value. (can accept a label?)
| 03     | loop             | start block that can be used as a loop if you break from it. (can accept a label?)
| 0b     | end              | end block of code
| 0c     | br               | breack provided index of block (from end)
| 0d     | br_if            | breack if comparison was successful by provided index of block (from end)
| 0f     | return           | Is it optional?
| 20     | local.get        | get value of local variable by index
| 21     | local.set        | set value of local variable by index using a value on the stack
| 22     | local.tee        | set value from stack and put it back on stack (set without consuming)
| 7f     | i32              | 32 bit integer type
| 41     | i32.const        | declare constant value on stack
| 6a     | i32.add          | i32 i32 -> i32
| 69     | i32.popcnt       | count bites = 1
| 4c     | i32.le_s         | less than or equal
| a8     | i32.trunc_s/f32  | f32 -> i32 (i32.trunc_f32_s)
| 7e     | i64              | 64 bit float type
|        | i64.eqz          | equal to zero
| 7d     | f32              | 32 bit float type
| 91     | f32.sqrt         | sqrt
| 7c     | f64              | 64 bit float type
|        | f64.lt           | less than

Notes:
In function all variables are indexed. Arguments has 0, 1 ... And local variables have next indices e.g. 2, 3 etc.

### Wasm file anatomy (`add` module)
```
00 61 73 6d 01 00 00 00  01 07 01 60 02 7f 7f 01
7f 03 02 01 00 07 07 01  03 61 64 64 00 00 0a 09
01 07 00 20 00 20 01 6a  0b
```

| N of bytes | value         | meaning
|------------|---------------|--------------
| 4          | 00 61 73 6d   | file signature (Magic bytes) "\0asm"
| 4          | 01 00 00 00   | wasm version number
| 1          | 01            | type header section
| 1          | 07            | number of bytes with types
| 7          | ->            | 01 60 02 7f 7f 01 7f
|            |               | one type for function with 2 params and 1 output (all `int`)
| 1          | 03            | function header section
| 1          | 02            | number of bytes with function definition
| 2          | ->            | 01 00
|            |               | one function with type `0`
| 1          | 07            | export header section
| 1          | 07            | number of bytes with export data
| 7          | ->            | 01 03 61 64 64 00 00
|            |               | one function name with length of 3 which corresponds to a function with index `0`
|            | ..61 64 64..  | name of exported function ("add")
| 1          | 0a            | code section
| 1          | 09            | number of bytes with code
| 9          | ->            | 01 07 00 20 00 20 01 6a  0b
|            |               | one block with length of 7. function with index `0`. get 0, get 0, add, end.

### Wasm file anatomy (`add2` module)
```
00 61 73 6d 01 00 00 00  01 0c 02 60 02 7f 7f 01
7f 60 01 7f 01 7f 03 03  02 00 01 07 10 02 03 61
64 64 00 00 06 64 6f 75  62 6c 65 00 01 0a 11 02
07 00 20 00 20 01 6a 0b  07 00 20 00 20 00 6a 0b
```

| N of bytes | value         | meaning
| -----------|---------------|--------------
| 4          | 00 61 73 6d   | file signature (Magic bytes) "\0asm"
| 4          | 01 00 00 00   | wasm version number
| 1          | 01            | type header section
| 1          | 0c            | number of bytes with types
| 12         | ->            | 02 60 02 7f 7f 01 7f 60 01 7f 01 7f
|            |               | two types for functions. 2 in 1 out. 1 in 1 out
| 1          | 03            | function header section
| 1          | 03            | number of bytes with function definition
| 3          | ->            | 02 00 01
|            |               | two functions with types `0` and `1`
| 1          | 07            | export header section
| 1          | 10            | number of bytes with export data
| 16         | ->            | 02 03 61 64  64 00 00 06  64 6f 75 62  6c 65 00 01
|            |               | two function names with length of 3 and 6 which corresponds to functions with indices `0` and `1`
|            | ..61 64 64..  | name of exported function ("add\0")
|            | 646f75626c65  | name of exported function ("double\0")
| 1          | 0a            | code section
| 1          | 11            | number of bytes with code
| 17         | ->            | 02  07 00 20 00 20 01 6a 0b  07 00 20 00 20 00 6a 0b
|            |               | two blocks of code both with length of 7 bytes

### Wasm file anatomy (`fib` module)
```
00 61 73 6d 01 00 00 00  01 06 01 60 01 7f 01 7f
03 02 01 00 07 07 01 03  66 69 62 00 00 0a 2c 01
2a 01 02 7f 41 01 21 02  02 40 03 40 20 00 41 00
4c 0d 01 20 01 20 02 22  01 6a 21 02 20 00 41 01
6b 21 00 0c 00 0b 0b 20  02 0f 0b
```

| N of bytes | value         | meaning
| -----------|---------------|--------------
| 4          | 00 61 73 6d   | file signature (Magic bytes) "\0asm"
| 4          | 01 00 00 00   | wasm version number
| 1          | 01            | type header section
| 1          | 06            | number of bytes with types
| 6          | ->            | 01 60 01 7f 01 7f
|            |               | one type for functions. 1 in 1 out
| 1          | 03            | function header section
| 1          | 02            | number of bytes with function definition
| 2          | ->            | 01 00
|            |               | one function with type `0`
| 1          | 07            | export header section
| 1          | 07            | number of bytes with export data
| 7          | ->            | 01 03 66 69 62 00 00
|            |               | one function name with length of 3 which corresponds to function with index `0`
|            | ..66 69 62..  | name of exported function ("fib\0")
| 1          | 0a            | code section
| 1          | 2c            | number of bytes with code
| 44         | ->            | 01  2a 01 02 7f 41 01 21 02  02 40 03 40 20 00 41 00
|            |               | 4c 0d 01 20 01 20 02 22  01 6a 21 02 20 00 41 01
|            |               | 6b 21 00 0c 00 0b 0b 20  02 0f 0b
|            | 01 2a         | one block of code both with length of 42 bytes
|            | 01            | ???
|            | 02 7f         | allocate two int
|            | 41 01         | put 1 on a stack
|            | 21 02         | set variable with index 2 to 1
|            | 02 40         | start nested block of code
|            | 03 40         | start nested block of code that repeats indefinetly
|            | 20 00 41 00   | get first variable and put 0 on stack
|            | 4c            | compare them (x <= 0)
|            | 0d 01         | break outer block if comparison was successful
|            | 20 01 20 02   | get local 1 and local 2
|            | 22 01         | local 1 = local 2
|            | 6a            | add $1 and $2
|            | 21 02         | set sum to $2
|            | 20 00         | get argument on stack
|            | 41 01         | put 1 on stack
|            | 6b            | argument - 1
|            | 21 00         | set new value for argument variable
|            | 0c 00         | break from current block
|            | 0b 0b         | ends of blocks
|            | 20 02         | get local 2
|            | 0f            | return
|            | 0b            | ends a block

### Wasm file anatomy (`popcnt` module)
```
00 61 73 6d 01 00 00 00  01 06 01 60 01 7d 01 7f
03 02 01 00 07 0a 01 06  70 6f 70 63 6e 74 00 00
0a 0c 01 0a 00 20 00 91  a8 41 01 6b 69 0b
```

| N of bytes | value         | meaning
| -----------|---------------|--------------
| 4          | 00 61 73 6d   | file signature (Magic bytes) "\0asm"
| 4          | 01 00 00 00   | wasm version number
| 1          | 01            | type header section
| 1          | 06            | number of bytes with types
| 6          | ->            | 01 60 01 7d 01 7f
|            |               | one type for functions. 1 f32 in 1 i32 out
| 1          | 03            | function header section
| 1          | 02            | number of bytes with function definition
| 2          | ->            | 01 00
|            |               | one function with type `0`
| 1          | 07            | export header section
| 1          | 0a            | number of bytes with export data
| 10         | ->            | 01 06 70 6f 70 63 6e 74 00 00
|            |               | one function name with length of 6 which corresponds to function with index `0`
|            | 706f70636e74  | name of exported function ("popcnt\0")
| 1          | 0a            | code section
| 1          | 0c            | number of bytes with code
| 12         | ->            | 01 0a 00 20 00 91 a8 41 01 6b 69 0b
|            | 01 0a         | one block of code both with length of 10 bytes
|            | 00            | ???
|            | 20 00         | get argument on stack
|            | 91            | f32.sqrt
|            | a8            | i32.trunc_f32_s
|            | 41 01         | put 1 on a stack
|            | 6b            | result - 1
|            | 69            | i32.popcnt
|            | 0b            | ends a block
