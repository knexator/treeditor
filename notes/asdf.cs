
file_name: comptime []u8;
file_contents: []u8 = read_file(allocator, file_name);
parsed: []u8 = (allocator, file_contents: []u8) => {

    // (capture (some (set 0123456789)))
    let cur_thing: []u8 = file_contents[0..0]
    while (cur is digit) {
        cur_thing.len += 1
    }
}

(peg/match
    (any (digit)) -> parseInt    
    (any (not digit))
)






($let ($fileStart ...)
    ($let ($fileLen ...)
        ))

// zig
let file: []u8; 
let it = std.mem.split(file, " \n");
while (it.next()) |stuff: []u8| {
    cur_val: i32 = parseI32(stuff);
    res.push(cur_val);
}

// inlining

let file: []u8; 
let it = std.mem.split(file, " \n");
while (true) {
    stuff = it.next();
    if (stuff === null) break;
    cur_val: i32 = parseI32(stuff);
    res.push(cur_val);
    jmp loop
}

let file: []u8; 
let it = {cur: file.ptr}
while (true) {
    stuff = {
        const start = it.cur;
        if (start === null) break: null;
        const end = indexOfNext(file, start, ' \n')
        return file[start..end];
    }
    if (stuff === null) break;
    cur_val: i32 = parseI32(stuff);
    res.push(cur_val);
    jmp loop
}

let file: []u8; 
let it = {cur: file.ptr}
while (true) {
    const start = it.cur;
    if (start === null) break;
    const end = indexOfNext(file, start, ' \n')
    cur_val: i32 = parseI32(start..end);
    res.push(cur_val);
    jmp loop
}

let file: []u8; 
let it = {cur: file.ptr}
while (true) {
    const start = it.cur;
    if (start === null) break;
    const end = {
        for (file[start..], start..) |c, k| {
            if (c == ' ' or c == '\n') break k;
        }
    }
    cur_val: i32 = {
        res = 0;
        for (file[start..end], start..end) |c| {
            res = res * 10 + c;
        }
    }
    res.push(cur_val);
    jmp loop
}


// mlir?
(func $parseFileIntoMemory (file: []u8) []i32 (
    // infinitely growable, but can't alloc anything new
    let res: []i32 = cur_arena.get_next();

    let remaining_file = file

    while (true) {
        // option 1
        cur_thing: []u8, remaining_file = untilNextSpace(remaining_file);
        cur_val: i32 = parseI32(cur_thing);

        // option 2
        cur_val: i32, remaining_file = readI32(remaining_file);

        res.push(cur_val);

        // TODO: skip spaces
    }
))

(func $readI32 (file: []u8) (i32, []u8)

    let res: i32 = 0;

    let remaining_file = file
    while (true) {
        let cur_digit = remaining_file[0] - '0';
        if (cur_digit < 0 or cur_digit > 9) break;

        res = res * 10 + cur_digit;

        remaining_file = remaining_file[1..];
    }

    return res, remaining_file;
)

// my mlir
// no funcs, only blocks?
// arguments are immutable, can be structs
// do they have a return? let's say no, for now
// stack as an explicit allocator
(block $main ()
    (let file_name []u8 (ROM "../../advent_of_code_2024/cache/input_1.txt"))
    (call $loadFile file_name stack??)
)
(block $parseFileIntoMemory ((file (Slice u8)) (stack (Stack)))

)
