(module
    (func $popcnt (param $p1 f32) (result i32)
        (i32.popcnt
            (i32.sub
                (i32.trunc_s/f32
                    (f32.sqrt
                        (get_local $p1)
                    )
                )
                (i32.const 1)
            )
        )
    )
    (export "popcnt" (func $popcnt))
)