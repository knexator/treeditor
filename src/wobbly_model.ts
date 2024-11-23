/* eslint-disable @stylistic/indent */
// constructor(
//     public ctx: CanvasRenderingContext2D,
// ) { }

import { addAt, at, deleteAt, eqArrays, replace } from './kommon/kommon';

// TODO: revise flutter's top-down rendering

/*

fn main(u: f32, v: f32) f32 {
    const dx = u - .5;
    return dx;
}

(toplevel
    (fn main ((u f32) (v f32)) f32 (
        (const dx (- u .5))
        (return dx)
    ))
)
*/

/*
press L while hovering (u f32) -> jump to (v f32)

(fn main ( ... [param] param ... ) ...) + L -> (fn main ( ... param [param] ... ) ...)

(fn main ( ... [param]) return_type body) + L -> (fn main ( ... param) [return_type] body)

(fn . (main . ( (param_1 . (param_2 . (param_3 . nil))) . (return_type . (body . nil)))))

(#fn @name (@param_1 ) @return_type @body)

x: ([param] param . etc) || (param . x)

(fn . (main . ( (param_1 . (param_2 . (param_3 . nil))) . (return_type . (body . nil)))))

*/

// class AstNode {
//     constructor(
//         public type: string,
//         public children: (AstNode | string)[],
//     ) { }
// }

// const asdf = new AstNode('toplevel', [
//     new AstNode('fn', [
//         new AstNode('LitName', ['main']),
//     ]),
// ]);

// type Asdf = string | { head: Asdf, extra: Asdf[] };
// const asdf2 = {
//     head: 'toplevel', extra: [
//         { head: 'fn', extra: [
//             'main',
//             {head: ??, extra: [
//                 {head: 'f32', extra: 'u'}, ??
//             ]}
//         ] },
//     ],
// };

// export type Asdf = string | Asdf[];

export type RawAsdf = string | RawAsdf[];

export class Asdf {
    constructor(
        public data: string | Asdf[],
    ) {
        if (typeof data === 'string') {
            if ([' ', '(', ')'].some(forbiden_char => data.includes(forbiden_char))) {
                throw new Error('spaces or parenthesis in atoms are not supported');
            }
        }
    }

    isLeaf(): boolean {
        return typeof this.data === 'string';
    }

    isAtom(v: string): boolean {
        if (!this.isLeaf()) return false;
        if (typeof this.data !== 'string') throw new Error('unreachable');
        return this.data === v;
    }

    childAt(k: number): Asdf | null {
        if (this.isLeaf()) throw new Error('bad');
        if (typeof this.data === 'string') throw new Error('unreachable');
        if (k < 0 || k >= this.data.length) return null;
        return this.data[k];
    }

    childCount(): number {
        if (this.isLeaf()) throw new Error('bad');
        if (typeof this.data === 'string') throw new Error('unreachable');
        return this.data.length;
    }

    forEachChild(callbackfn: (value: Asdf, index: number) => void): void {
        if (this.isLeaf()) throw new Error('bad');
        if (typeof this.data === 'string') throw new Error('unreachable');
        return this.data.forEach(callbackfn);
    }

    setAt(address: Address, value: Asdf): Asdf {
        if (address.data.length === 0) return value;
        if (this.isLeaf()) throw new Error('bad');
        if (typeof this.data === 'string') throw new Error('unreachable');
        const [first, ...rest] = address.data;
        return new Asdf(
            replace(this.data,
                this.childAt(first)!.setAt(new Address(rest), value),
                first));
    }

    getAt(address: Address): Asdf | null {
        if (address.data.length === 0) return this;
        if (this.isLeaf()) return null;
        if (typeof this.data === 'string') throw new Error('unreachable');
        const [first, ...rest] = address.data;
        return this.childAt(first)?.getAt(new Address(rest)) ?? null;
    }

    innerValues(): Asdf[] {
        if (this.isLeaf()) throw new Error(`not a list: ${this.atomValue()}`);
        if (typeof this.data === 'string') throw new Error('unreachable');
        return this.data;
    }

    atomValue(): string {
        if (!this.isLeaf()) throw new Error(`not an atom: ${this.toCutreString()}`);
        if (typeof this.data !== 'string') throw new Error('unreachable');
        return this.data;
    }

    numberValue(): number {
        const n = Number(this.atomValue());
        if (Number.isNaN(n)) throw new Error('not a number');
        return n;
    }

    static fromNumber(n: number): Asdf {
        return new Asdf(n.toString());
    }

    boolValue(): boolean {
        const v = this.atomValue();
        if (v === 'true') return true;
        if (v === 'false') return false;
        throw new Error(`not a boolean: ${v}`);
    }

    static fromBool(b: boolean): Asdf {
        return new Asdf(b ? 'true' : 'false');
    }

    insertBefore(address: Address, value: Asdf): Asdf {
        if (address.data.length === 0) throw new Error('bad');
        if (this.isLeaf()) throw new Error('bad');
        if (typeof this.data === 'string') throw new Error('unreachable');
        const [first, ...rest] = address.data;
        if (rest.length === 0) {
            return new Asdf(addAt(this.data, value, first));
        }
        else {
            return new Asdf(
                replace(this.data,
                    this.childAt(first)!.insertBefore(new Address(rest), value),
                    first));
        }
    }

    insertAfter(address: Address, value: Asdf): Asdf {
        if (address.data.length === 0) throw new Error('bad');
        if (this.isLeaf()) throw new Error('bad');
        if (typeof this.data === 'string') throw new Error('unreachable');
        const [first, ...rest] = address.data;
        if (rest.length === 0) {
            return new Asdf(addAt(this.data, value, first + 1));
        }
        else {
            return new Asdf(
                replace(this.data,
                    this.childAt(first)!.insertAfter(new Address(rest), value),
                    first));
        }
    }

    deleteAt(address: Address): Asdf {
        if (address.data.length === 0) throw new Error('bad');
        if (this.isLeaf()) throw new Error('bad');
        if (typeof this.data === 'string') throw new Error('unreachable');
        const [first, ...rest] = address.data;
        if (rest.length === 0) {
            return new Asdf(deleteAt(this.data, first));
        }
        else {
            return new Asdf(
                replace(this.data,
                    this.childAt(first)!.deleteAt(new Address(rest)),
                    first));
        }
    }

    static fromRaw(x: RawAsdf): Asdf {
        if (typeof x === 'string') return new Asdf(x);
        return new Asdf(x.map(v => Asdf.fromRaw(v)));
    }

    equals(other: Asdf): boolean {
        if (typeof this.data === 'string') {
            if (typeof other.data === 'string') {
                return this.data === other.data;
            }
            return false;
        }
        else {
            if (typeof other.data === 'string') return false;
            const other_data = other.data;
            return this.data.every((v, k) => v.equals(other_data[k]));
        }
    }

    toCutreString(): string {
        if (typeof this.data === 'string') return this.data;
        return '(' + this.data.map(x => x.toCutreString()).join(' ') + ')';
    }

    static fromCutre(s: string): Asdf {
        function helper(v: string): [Asdf, string] {
            v = v.trimStart();
            if (v[0] === '(') {
                const inner: Asdf[] = [];
                let remaining = v.slice(1).trimStart();
                while (remaining[0] !== ')') {
                    const [cur, new_remaining] = helper(remaining);
                    remaining = new_remaining.trimStart();
                    inner.push(cur);
                }
                return [new Asdf(inner), remaining.slice(1)];
            }
            else {
                let k = 0;
                while (k < v.length && v[k].trim() !== '' && v[k] !== ')') {
                    k++;
                }
                return [new Asdf(v.slice(0, k)), v.slice(k)];
            }
        }

        const [res, extra] = helper(s.trim());
        if (extra !== '') throw new Error(`unexpected extra stuff after thing: ${extra}`);
        return res;
    }
}

export class Address {
    constructor(
        public data: number[],
    ) { }

    plus(k: number): Address {
        return new Address([...this.data, k]);
    }

    equals(other: Address): boolean {
        return eqArrays(this.data, other.data);
    }

    validFor(asdf: Asdf): boolean {
        if (this.data.length === 0) return true;
        if (asdf.isLeaf()) return false;
        const [first, ...rest] = this.data;
        const child = asdf.childAt(first);
        if (child === null) return false;
        return new Address(rest).validFor(child);
    }

    validOrNull(asdf: Asdf): Address | null {
        return this.validFor(asdf) ? this : null;
    }

    nextSibling(): Address {
        if (this.data.length === 0) throw new Error('bad');
        const last = at(this.data, -1);
        return new Address([...this.data.slice(0, -1), last + 1]);
    }

    prevSibling(asdf: Asdf): Address | null {
        const x = this.safePrevSibling();
        if (x === null) return null;
        if (!x.validFor(asdf)) return null;
        return x;
    }

    safePrevSibling(): Address | null {
        if (this.data.length === 0) return null;
        const last = at(this.data, -1);
        if (last === 0) return null;
        return new Address([...this.data.slice(0, -1), last - 1]);
    }

    firstChild(): Address {
        return new Address([...this.data, 0]);
    }

    parent(): Address | null {
        if (this.data.length === 0) return null;
        return new Address(this.data.slice(0, -1));
    }
}
export class Cursor {
    constructor(
        public address: Address,
    ) { }
}

// // TODO: something richer than a string, supporting colors
// export function renderAsdf(tree: Asdf, address: Address, cursor: Cursor): string {
//     if (typeof tree === 'string') return tree;

//     // the general philosophy: everything is special cases
//     const [head, ...rest] = tree;
//     if (head === 'toplevel') {
//         return rest.map((t, k) => renderAsdf(t, address.plus(k + 1), cursor)).join('\n\n');
//     }
//     else if (head === 'fn') {
//         const [name, params, return_type, body, ...extra] = rest;
//         assertEmpty(extra);
//         if (typeof params === 'string') throw new Error('unreachable');
//         if (typeof body === 'string') throw new Error('unreachable');
//         const [
//             rendered_name,
//             rendered_params,
//             rendered_return_type,
//             rendered_body,
//         ] = [
//                 renderAsdf(name, address.plus(1), cursor),
//                 params.map((p, k) => renderAsdf(p, address.plus(2).plus(k), cursor)),
//                 renderAsdf(return_type, address.plus(3), cursor),
//                 body.map((p, k) => renderAsdf(p, address.plus(4).plus(k), cursor)),
//             ];

//         return `fn ${rendered_name}(${rendered_params.join(', ')}) ${rendered_return_type} {\n${rendered_body.map(l => '\t' + l + ';').join('\n')}\n}`;
//     }
//     else {
//         return tree.map((t, k) => renderAsdf(t, address.plus(k), cursor)).join(' ');
//     }
// }

function assertEmpty<T>(arr: T[]): void {
    if (arr.length > 0) throw new Error('unreachable');
}

/*
(defun main (u v)
  (let* ((dx (- u 0.5))
         (dy (- v 0.5)))
    (+ (* dx dx) (* dy dy))))

(: main (-> Float Float Float))
(define (main u v)
  (let* ([dx : Float (- u 0.5)]
         [dy : Float (- v 0.5)])
    (+ (* dx dx) (* dy dy))))
*/
