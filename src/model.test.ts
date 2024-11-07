import { expect, test } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Asdf } from './wobbly_model';

test('placeholder', () => {
    expect(1 + 2).toStrictEqual(3);
});

test('parsing', () => {
    expect(Asdf.fromCutreString('hola').equals(
        new Asdf('hola'))).toBe(true);

    expect(Asdf.fromCutreString('hola').equals(
        new Asdf('adios'))).toBe(false);

    expect(Asdf.fromCutreString('(hola)').equals(
        Asdf.fromRaw(['hola']))).toBe(true);

    expect(Asdf.fromCutreString('((hola))').equals(
        Asdf.fromRaw([['hola']]))).toBe(true);

    expect(Asdf.fromCutreString('(hola buenas)').equals(
        Asdf.fromRaw(['hola', 'buenas']))).toBe(true);

    expect(Asdf.fromCutreString('(hola (buenos dias) etc)').equals(
        Asdf.fromRaw(['hola', ['buenos', 'dias'], 'etc']))).toBe(true);
});

// test('params destructuring', () => {
//     expect(1 + 4).toStrictEqual(5);
// });
