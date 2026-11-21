/** Small numeric helpers shared by the interactive widgets. */

/** ln(n!) */
export function logFactorial(n: number): number {
  let s = 0
  for (let i = 2; i <= n; i++) s += Math.log(i)
  return s
}

/** Error function, Abramowitz & Stegun 7.1.26 (|error| < 1.5e-7). */
export function erf(x: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(x))
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-x * x)
  return x >= 0 ? y : -y
}

/** Standard normal CDF Φ(z). */
export function normalCdf(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2))
}

export function normalPdf(x: number, mu = 0, sd = 1): number {
  return Math.exp(-((x - mu) ** 2) / (2 * sd * sd)) / (Math.sqrt(2 * Math.PI) * sd)
}

export function range(a: number, b: number): number[] {
  const out: number[] = []
  for (let i = a; i <= b; i++) out.push(i)
  return out
}

/** Compact number formatting for axis ticks and readouts. */
export function fmt(v: number): string {
  if (Math.abs(v - Math.round(v)) < 1e-9) return String(Math.round(v))
  const a = Math.abs(v)
  if (a >= 100) return v.toFixed(0)
  if (a >= 10) return v.toFixed(1)
  return v.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
}

/** ln Γ(x), Lanczos approximation (x > 0). */
export function logGamma(x: number): number {
  const c = [
    676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ]
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x)
  x -= 1
  let a = 0.99999999999980993
  const t = x + 7.5
  for (let i = 0; i < 8; i++) a += c[i] / (x + i + 1)
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a)
}

/** Continued fraction for the incomplete beta function (Numerical Recipes betacf). */
function betaCf(a: number, b: number, x: number): number {
  const TINY = 1e-300
  let c = 1
  let d = 1 - ((a + b) * x) / (a + 1)
  if (Math.abs(d) < TINY) d = TINY
  d = 1 / d
  let h = d
  for (let m = 1; m <= 300; m++) {
    const m2 = 2 * m
    let aa = (m * (b - m) * x) / ((a + m2 - 1) * (a + m2))
    d = 1 + aa * d
    if (Math.abs(d) < TINY) d = TINY
    c = 1 + aa / c
    if (Math.abs(c) < TINY) c = TINY
    d = 1 / d
    h *= d * c
    aa = (-(a + m) * (a + b + m) * x) / ((a + m2) * (a + m2 + 1))
    d = 1 + aa * d
    if (Math.abs(d) < TINY) d = TINY
    c = 1 + aa / c
    if (Math.abs(c) < TINY) c = TINY
    d = 1 / d
    const del = d * c
    h *= del
    if (Math.abs(del - 1) < 1e-12) break
  }
  return h
}

/** Regularized incomplete beta I_x(a, b). */
export function betaInc(a: number, b: number, x: number): number {
  if (x <= 0) return 0
  if (x >= 1) return 1
  const lbt = logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x)
  const bt = Math.exp(lbt)
  return x < (a + 1) / (a + b + 2) ? (bt * betaCf(a, b, x)) / a : 1 - (bt * betaCf(b, a, 1 - x)) / b
}

/** Student-t CDF with df degrees of freedom. */
export function tCdf(t: number, df: number): number {
  const tail = 0.5 * betaInc(df / 2, 0.5, df / (df + t * t))
  return t > 0 ? 1 - tail : tail
}

export function tPdf(t: number, df: number): number {
  return Math.exp(
    logGamma((df + 1) / 2) - logGamma(df / 2) - 0.5 * Math.log(df * Math.PI) - ((df + 1) / 2) * Math.log(1 + (t * t) / df),
  )
}

/** Invert a monotone CDF by bisection: smallest x with cdf(x) ≥ p. */
export function invertCdf(cdf: (x: number) => number, p: number, lo = -60, hi = 60): number {
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2
    if (cdf(mid) < p) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

/** Regularized lower incomplete gamma P(a, x) (Numerical Recipes gser/gcf). */
export function gammaIncLower(a: number, x: number): number {
  if (x <= 0) return 0
  const gln = logGamma(a)
  if (x < a + 1) {
    let ap = a
    let sum = 1 / a
    let del = sum
    for (let n = 0; n < 500; n++) {
      ap += 1
      del *= x / ap
      sum += del
      if (Math.abs(del) < Math.abs(sum) * 1e-14) break
    }
    return sum * Math.exp(-x + a * Math.log(x) - gln)
  }
  const TINY = 1e-300
  let b = x + 1 - a
  let c = 1 / TINY
  let d = 1 / b
  let h = d
  for (let i = 1; i < 500; i++) {
    const an = -i * (i - a)
    b += 2
    d = an * d + b
    if (Math.abs(d) < TINY) d = TINY
    c = b + an / c
    if (Math.abs(c) < TINY) c = TINY
    d = 1 / d
    const del = d * c
    h *= del
    if (Math.abs(del - 1) < 1e-14) break
  }
  return 1 - Math.exp(-x + a * Math.log(x) - gln) * h
}

/** Chi-squared CDF with k degrees of freedom. */
export function chi2Cdf(x: number, k: number): number {
  return gammaIncLower(k / 2, x / 2)
}
