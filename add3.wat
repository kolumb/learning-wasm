(module
  (type (;0;) (func (param i32 i32) (result i32)))
  (func (;0;) (type 0) (param i32 i32) (result i32)
    local.get 0
    local.get 1
    i32.add)
  (export "add" (func 0))
  (type (;1;) (func (param i32) (result i32)))
  (func (;1;) (type 1) (param i32) (result i32)
    local.get 0
    local.get 0
    i32.add)
  (export "double" (func 1))
  (func (;2;) (type 1) (param i32) (result i32)
    local.get 0
    i32.const 100
    i32.add)
  (export "hundred" (func 2))
)
