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
;; comment
(;
module
func
param
result <type>
i32
    add
export
;)