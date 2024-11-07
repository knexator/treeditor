import { expect, test } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Asdf } from './wobbly_model';
import { envFromToplevel } from './base_interpreter';

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

    expect(Asdf.fromCutreString(`(hola 
                buenas   )`).equals(
        Asdf.fromRaw(['hola', 'buenas']))).toBe(true);
});

// test('basic eval', () => {
//     // const env = envFromToplevel(Asdf.fromCutreString())
//     expect(1 + 4).toStrictEqual(5);
// });

// test('params destructuring', () => {
//     expect(1 + 4).toStrictEqual(5);
// });
