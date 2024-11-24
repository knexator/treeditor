(module
    ;; Export a function named "add" that takes two i32 parameters and returns their sum
    (func $add (export "add") (param i32 i32) (result i32)
        (i32.add
            (local.get 0)
            (local.get 1))
    )
)
