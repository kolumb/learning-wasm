(module
    (memory $mem (export "memory") 1 1)
    (func $rot13 (export "rot13") (param $len i32) (result)
        (local $i i32)
        (local $offset i32)
        (set_local $i (i32.const 0))
        (block $exit
            (loop $repeat
                (br_if $exit
                    (i32.ge_s (get_local $i) (get_local $len))
                )
                (if (i32.lt_u
                        (i32.load8_u (get_local $i))
                        (i32.const 97)
                    )
                    (then
                        (set_local $offset (i32.const 65))
                    )
                    (else
                        (set_local $offset (i32.const 97))
                    )
                )
                (i32.store8
                    (get_local $i)
                    (i32.add
                        (i32.rem_s
                            (i32.add
                                (i32.sub
                                    (i32.load8_s (get_local $i))
                                    (get_local $offset)
                                )
                                (i32.const 13)
                            )
                            (i32.const 26)
                        )
                        (get_local $offset)
                    )
                )
                (set_local $i
                    (i32.add
                        (get_local $i)
                        (i32.const 1)
                    )
                )
                (br $repeat)
            )
        )
    )
)
