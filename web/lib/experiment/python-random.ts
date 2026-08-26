/**
 * PRNG determinístico compatível em espírito com Python random.Random.
 * Usa MT19937 com inicialização por inteiro de 64 bits.
 */
export class PythonRandom {
  private mt = new Uint32Array(624);
  private index = 624;

  constructor(seed: number) {
    this.seed(seed);
  }

  seed(a: number): void {
    const s = BigInt(Math.trunc(a)) & 0xffffffffffffffffn;
    const key = [Number(s & 0xffffffffn), Number((s >> 32n) & 0xffffffffn)];
    this.initByArray(key);
  }

  private initByArray(initKey: number[]): void {
    const N = 624;
    const M = 397;
    const MATRIX_A = 0x9908b0df;
    const UPPER_MASK = 0x80000000;
    const LOWER_MASK = 0x7fffffff;

    this.mt[0] = 19650218;
    for (let i = 1; i < N; i++) {
      this.mt[i] =
        (1812433253 * (this.mt[i - 1]! ^ (this.mt[i - 1]! >>> 30)) + i) >>> 0;
    }

    let i = 1;
    let j = 0;
    let k = Math.max(N, initKey.length);
    for (; k; k--) {
      this.mt[i] =
        (this.mt[i]! ^
          ((this.mt[i - 1]! & UPPER_MASK) | (this.mt[i - 1]! & LOWER_MASK) >> 1) ^
          (this.mt[i - 1]! & 1 ? MATRIX_A : 0) +
          initKey[j]! +
          i) >>>
        0;
      i++;
      j++;
      if (i >= N) {
        this.mt[0] = this.mt[N - 1]!;
        i = 1;
      }
      if (j >= initKey.length) j = 0;
    }

    for (k = N - 1; k; k--) {
      this.mt[i] =
        (this.mt[i]! ^
          ((this.mt[i - 1]! & UPPER_MASK) | (this.mt[i - 1]! & LOWER_MASK) >> 1) ^
          (this.mt[i - 1]! & 1 ? MATRIX_A : 0) -
          i) >>>
        0;
      i++;
      if (i >= N) {
        this.mt[0] = this.mt[N - 1]!;
        i = 1;
      }
    }

    this.mt[0] = 0x80000000;
    this.index = N;
  }

  private twist(): void {
    const N = 624;
    const M = 397;
    const MATRIX_A = 0x9908b0df;
    const UPPER_MASK = 0x80000000;
    const LOWER_MASK = 0x7fffffff;

    for (let i = 0; i < N; i++) {
      const y =
        (this.mt[i]! & UPPER_MASK) + (this.mt[(i + 1) % N]! & LOWER_MASK);
      this.mt[i] =
        (this.mt[(i + M) % N]! ^ (y >>> 1) ^ (y & 1 ? MATRIX_A : 0)) >>> 0;
    }
    this.index = 0;
  }

  private nextUInt32(): number {
    if (this.index >= 624) this.twist();
    let y = this.mt[this.index++]!;
    y ^= y >>> 11;
    y ^= (y << 7) & 0x9d2c5680;
    y ^= (y << 15) & 0xefc60000;
    y ^= y >>> 18;
    return y >>> 0;
  }

  random(): number {
    const a = this.nextUInt32() >>> 5;
    const b = this.nextUInt32() >>> 6;
    return (a * 67108864.0 + b) * (1.0 / 9007199254740992.0);
  }

  uniform(a: number, b: number): number {
    return a + (b - a) * this.random();
  }

  randrange(n: number): number {
    return Math.floor(this.random() * n);
  }

  choice<T>(arr: readonly T[]): T {
    return arr[this.randrange(arr.length)]!;
  }

  shuffle<T>(arr: T[]): void {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.randrange(i + 1);
      [arr[i], arr[j]] = [arr[j]!, arr[i]!];
    }
  }
}
