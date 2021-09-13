(module
    (func $fib (export "fib")
        (param $n i32)
        (result i32)

        (local $a i32)
        (local $b i32)
        (set_local $b (i32.const 1))
        (block $exit
            (loop $repeat
                (br_if $exit
                    (i32.le_s (get_local $n) (i32.const 0))
                )
                (set_local $b
                    (i32.add 
                        (get_local $a)
                        (tee_local $a (get_local $b))
                    )
                )
                (set_local $n
                    (i32.sub
                        (get_local $n)
                        (i32.const 1)
                    )
                )
                (br $repeat)
            )
        )
        (return (get_local $b))
    )
)

(;
int fib(int n) {
    int a = 0;
    int b = 0;
    while (n > 0) {
        int t = b;
        b = a + b;
        a = t;
        n--;
    }
    return b;
}
;)
