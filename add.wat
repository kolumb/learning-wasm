(module
    (func $add (param $p1 i32) (param $p2 i32) (result i32)
        (local.get $p1)
        (local.get $p2)
        (i32.add)
    )
    (export "add" (func $add))
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