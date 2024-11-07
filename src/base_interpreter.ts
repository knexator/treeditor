import { assertEmpty } from './kommon/kommon';
import { Asdf } from './wobbly_model';

class BuiltInVau {
    constructor(
        public value: (params: Asdf[], env: Env) => Value,
    ) { }
}

type Value = Asdf | FnkDef | BuiltInVau;

export class Env {
    public map: Map<string, Value>;
    constructor(
        public parents: Env[],
    ) {
        this.map = new Map();
    }

    add(key: string, value: Value): void {
        this.map.set(key, value);
    }

    lookup(key: string): Value | null {
        const v = this.map.get(key);
        if (v !== undefined) return v;
        for (const p of this.parents) {
            const cur = p.lookup(key);
            if (cur !== null) return cur;
        }
        return null;
    }

    static standard(): Env {
        return new Env([DEFAULT_ENV]);
    }
}

const DEFAULT_ENV: Env = new Env([]);
DEFAULT_ENV.add('$first', new BuiltInVau((params: Asdf[], env: Env) => {
    return params[0];
}));
DEFAULT_ENV.add('$quote', new BuiltInVau((params: Asdf[], env: Env) => {
    if (params.length !== 1) throw new Error(`$quote expects 1 argument, got ${params.length}`);
    return params[0];
}));
DEFAULT_ENV.add('$list', new BuiltInVau((params: Asdf[], env: Env) => {
    return new Asdf(params);
}));
DEFAULT_ENV.add('+', new BuiltInVau((params: Asdf[], env: Env) => {
    const numbers = params.map((p) => {
        const v = myEval(p, env);
        if (!(v instanceof Asdf)) throw new Error('not all values were numbers');
        return v.numberValue();
    });
    return Asdf.fromNumber(numbers.reduce((n, acc) => n + acc, 0));
}));
DEFAULT_ENV.add('<?', new BuiltInVau((params: Asdf[], env: Env) => {
    if (params.length !== 2) throw new Error(`expected 2 params`);
    const numbers = params.map((p) => {
        const v = myEval(p, env);
        if (!(v instanceof Asdf)) throw new Error('not all values were numbers');
        return v.numberValue();
    });
    return Asdf.fromBool(numbers[0] < numbers[1]);
}));

class FnkDef {
    constructor(
        public typed: boolean,
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
        if (def.isLeaf()) continue;
        if (def.innerValues().length === 0) continue;
        const first = def.innerValues()[0];
        if (first.isAtom('fn')) {
            const [fn, fn_name, params, return_type, body, ...extra] = def.innerValues();
            assertAtom(fn, 'fn');
            assertEmpty(extra);
            result.add(fn_name.atomValue(), new FnkDef(true, params, return_type, body));
        }
        else if (first.isAtom('def')) {
            const [fn, fn_name, params, body, ...extra] = def.innerValues();
            assertAtom(fn, 'def');
            assertEmpty(extra);
            result.add(fn_name.atomValue(), new FnkDef(false, params, new Asdf('TODO:-simplify-this'), body));
        }
    }
    return result;
}

export function outerEval(expr: Asdf, env: Env): Asdf | null {
    const res = myEval(expr, env);
    if (res !== null && res instanceof Asdf) return res;
    return null;
}

// TODO: lambda params destructuring
export function myEval(expr: Asdf, env: Env): Value | null {
    console.log('evaluating: ', expr.toCutreString());
    if (expr.isLeaf()) {
        if (expr.atomValue()[0] === '#') return expr;
        return env.lookup(expr.atomValue());
    }
    if (expr.innerValues().length === 0) return null;
    const [raw_first, ...rest] = expr.innerValues();
    const first = myEval(raw_first, env);
    if (first === null) return null;
    if (first instanceof FnkDef) {
        const params = first.params.innerValues();
        if (rest.length !== params.length) return null;
        const new_env = new Env([env]);
        for (let k = 0; k < params.length; k++) {
            if (first.typed) {
                const [name, type, ...extra] = params[k].innerValues();
                if (extra.length > 0) return null;
                new_env.add(name.atomValue(), rest[k]);
            }
            else {
                new_env.add(params[k].atomValue(), rest[k]);
            }
        }
        return myEval(first.body, new_env);
    }
    else if (first instanceof BuiltInVau) {
        return first.value(rest, env);
    }
    else if (first instanceof Asdf) {
        if (first.isAtom('#apply')) {
            // (apply car (one two)) -> one
            const [fn2_expr, params, ...extra] = rest;
            if (extra.length > 0) return null;
            // TEMP HACK until params destructuring
            return myEval(new Asdf([fn2_expr, params]), env);
            // return myEval(new Asdf([fn2_expr, ...params.innerValues()]), env);
        }
        else if (first.isAtom('#list')) {
            const stuff = rest.map(x => myEval(x, env));
            if (stuff.some(x => x === null)) return null;
            // @ts-expect-error No nulls in the array
            return new Asdf(stuff);
        }
        return null;
    }
    else {
        const _: never = first;
        throw new Error('unreachable');
    }
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
