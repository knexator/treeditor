import { addAt, at, deleteAt, fromCount, fromRange, or, replace, single } from './kommon/kommon';
import { randomChoice } from './kommon/math';
import grammar from './sexpr.pegjs?raw';
import * as peggy from 'peggy';
const parser = peggy.generate(grammar);

export type Atom = { type: 'atom', value: string };
export type Pair = { type: 'pair', left: Sexpr, right: Sexpr };
export type Sexpr = Atom | Pair;

export function parseSexpr(input: string): Sexpr {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const raw_thing = parser.parse(input) as Sexpr;
    return raw_thing;
}

export function asListPlusSentinel(x: Sexpr): { list: Sexpr[], sentinel: Atom } {
    if (x.type !== 'pair') {
        return { list: [], sentinel: x };
    }
    else {
        const { list: inner_list, sentinel } = asListPlusSentinel(x.right);
        return { list: [x.left, ...inner_list], sentinel };
    }
}

export function sexprToString(input: Sexpr): string {
    const { list, sentinel } = asListPlusSentinel(input);
    if (list.length === 0) {
        return sentinel.value;
    }
    else {
        if (isNil(sentinel)) {
            return `(${list.map(x => sexprToString(x)).join(' ')})`;
        }
        else {
            // option 1
            // return `(${list.map(x => sexprToString(x)).join(' ')} . ${sentinel_str})`

            // option 2
            if (input.type !== 'pair') throw new Error('unreachable');
            return `(${sexprToString(input.left)} . ${sexprToString(input.right)})`;
        }
    }
    // return `(${sexprToString(input.left)} . ${sexprToString(input.right)})`;
}

export function isNil(sentinel: Sexpr): boolean {
    return sentinel.type === 'atom' && sentinel.value === 'nil';
}

export function cloneSexpr(x: Sexpr): Sexpr {
    if (x.type === 'pair') {
        return {
            type: 'pair',
            left: cloneSexpr(x.left),
            right: cloneSexpr(x.right),
        };
    }
    else {
        return { type: x.type, value: x.value };
    }
}

export type SexprAddress = ('l' | 'r')[];

export function getAtLocalAddress(haystack: Sexpr, address: SexprAddress): Sexpr {
    let result = haystack;
    for (let k = 0; k < address.length; k++) {
        if (result.type !== 'pair') throw new Error('unreachable');
        result = (address[k] === 'l') ? result.left : result.right;
    }
    return result;
}

export function isValidAddress(haystack: Sexpr, address: SexprAddress): boolean {
    return maybeGetAtLocalAddress(haystack, address) !== null;
}

export function maybeGetAtLocalAddress(haystack: Sexpr, address: SexprAddress): Sexpr | null {
    let result = haystack;
    for (let k = 0; k < address.length; k++) {
        if (result.type !== 'pair') return null;
        result = (address[k] === 'l') ? result.left : result.right;
    }
    return result;
}

export function setAtLocalAddress(haystack: Sexpr, address: SexprAddress, needle: Sexpr): Sexpr {
    if (address.length === 0) return needle;
    if (haystack.type !== 'pair') throw new Error('can\'t setAtAddress, is not a pair');
    if (address[0] === 'l') {
        return { type: 'pair', right: haystack.right, left: setAtLocalAddress(haystack.left, address.slice(1), needle) };
    }
    else {
        return { type: 'pair', left: haystack.left, right: setAtLocalAddress(haystack.right, address.slice(1), needle) };
    }
}

export function parentAdress(address: SexprAddress): SexprAddress {
    if (address.length === 0) throw new Error('unreachable');
    return address.slice(0, -1);
}

export function concatAddresses(parent: SexprAddress, child: SexprAddress): SexprAddress {
    return [...parent, ...child];
}

export function equalSexprs(a: Sexpr, b: Sexpr): boolean {
    if (a.type === 'atom' && b.type === 'atom') return a.value === b.value;
    if (a.type === 'pair' && b.type === 'pair') {
        return equalSexprs(a.left, b.left) && equalSexprs(a.right, b.right);
    }
    return false;
}

export function doPair(left: Sexpr, right: Sexpr): Pair {
    return { type: 'pair', left, right };
}

export function doNil(): Atom {
    return { type: 'atom', value: 'nil' };
}

export function doAtom(value: string): Atom {
    return { type: 'atom', value };
}

export function randomAtom(): Atom {
    const value: string = fromCount(4, _ => randomChoice('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.split(''))).join('');
    return { type: 'atom', value };
}
