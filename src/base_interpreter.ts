import { assertEmpty } from './kommon/kommon';
import { Asdf } from './wobbly_model';

type Value = Asdf | FnkDef;

class Env {
    public map: Map<string, Value>;
    constructor(
        public parents: Env[],
    ) {
        this.map = new Map();
    }

    add(key: string, value: Value): void {
        this.map.set(key, value);
    }
}

class FnkDef {
    constructor(
        public params: Asdf,
        public return_type: Asdf,
        public body: Asdf,
    ) { }
}

export function envFromToplevel(expr: Asdf): Env {
    const [toplevel, ...defs] = expr.innerValues();
    assertAtom(toplevel, 'toplevel');
    const result = new Env([]);
    for (const def of defs) {
        const [fn, fn_name, params, return_type, body, ...extra] = def.innerValues();
        if (!fn.isAtom('fn')) continue;
        assertAtom(fn, 'fn');
        assertEmpty(extra);
        result.add(fn_name.atomValue(), new FnkDef(params, return_type, body));
    }
    return result;
}

export function myEval(expr: Asdf, env: Env): Asdf {
    return new Asdf([]);
}

function assertAtom(thing: Asdf, expected: string) {
    if (thing.atomValue() !== expected) throw new Error('bad input');
}

// function eval()
// const FnDef =
// (type FnDef (NamedTuple (
//     (_ (Literal String fn))
//     (name String)
//     (params (List (NamedTuple (
//         (param_name String)
//         (param_type Type)
//     ))))
//     (return_type Type)
//     (body (Expr return_type)) // returning return_type
// )))

// function toTypeScript(funk: Funk) {
//     const ['fn', name, params, returnType, body] = funk;
// }
