import type { Assertion, AsymmetricMatchersContaining } from 'vitest';

interface CustomMatchers<R = unknown> {
    toBeAsdf: (expected: R) => void,
    toBeLitAsdf: (expected: string) => void,
}

declare module 'vitest' {
    interface Assertion<T> extends CustomMatchers<T> { }
    interface AsymmetricMatchersContaining extends CustomMatchers { }
}
