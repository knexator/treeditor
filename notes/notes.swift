// in ???:
(func $sumI32s ([values : (Slice i32)]) i32
    (local res : i32 = 0)
    (foreach v in values
        ((set! res (+ 1 res))))
    (return res))

// in MLIR:
(func $sumI32s ([values : (Slice i32)]) i32
    
    ^entry() {
        br ^loop_1(0, 0);
    }

    ^loop_1(acc: i32, k: usize) {
        %c = (=? k values.len)
        cond_br %c ? ^end(acc) : ^loop_2(acc, k)
    }

    ^loop_2(acc: i32, k: usize) { // missing 'values', i guess
        cur = (load values k)
        acc2 = (add acc cur)
        k2 = (inc k)
        br ^loop_1(acc2, k2)
    }

    ^end(acc: i32) {
        return acc
    })

// in pure wasm
(func $sumI32 (params values_ptr $i32 values_len $u32) (result i32)
    (local $res i32)
    (local.set $res (i32.const 0))

    (local $k u32)
    (local.set $k (i32.const 0))
    (block $break
        (loop $continue
            (br_if $break (i32.eq (local.get k) (local.get values_len)))
            (local.set $res (i32.add (local.get $res) (i32.load values_ptr[$k])))
            (local.inc $k)
            (br $continue)
        ))
    (return (local.get $res)))