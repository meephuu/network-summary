/** Helpers for the networking widgets: IPv4 parsing, binary strings, mod-2 division. */

/** 32-bit unsigned IPv4 from four octets. */
export const ipFromOctets = (o: number[]) => ((o[0] << 24) | (o[1] << 16) | (o[2] << 8) | o[3]) >>> 0

export const octetsOf = (ip: number) => [ip >>> 24, (ip >>> 16) & 255, (ip >>> 8) & 255, ip & 255]

export const ipToString = (ip: number) => octetsOf(ip).join('.')

/** "200.23.16.0" → number, or null if malformed */
export function parseIp(s: string): number | null {
  const m = s.trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (!m) return null
  const o = m.slice(1).map(Number)
  if (o.some((v) => v > 255)) return null
  return ipFromOctets(o)
}

/** 32-char string of 0/1 */
export const ipToBits = (ip: number) => ip.toString(2).padStart(32, '0')

/** subnet mask for /len as a number */
export const maskOf = (len: number) => (len === 0 ? 0 : (0xffffffff << (32 - len)) >>> 0)

export const networkOf = (ip: number, len: number) => (ip & maskOf(len)) >>> 0
export const broadcastOf = (ip: number, len: number) => (networkOf(ip, len) | (~maskOf(len) >>> 0)) >>> 0

/** pad + group a bit string, e.g. "11001000 00010111 …" */
export const groupBits = (bits: string, size = 8) => bits.match(new RegExp(`.{1,${size}}`, 'g'))!.join(' ')

export const xorBits = (a: string, b: string) => a.split('').map((c, i) => (c === b[i] ? '0' : '1')).join('')

export interface CrcStep {
  /** column where the divisor is aligned */
  pos: number
  /** current window (r+1 bits) before XOR */
  window: string
  /** what we XOR with (G or 000…) */
  divisor: string
  /** result after XOR (r+1 bits; first bit is always 0) */
  result: string
}

/** Long division modulo 2 of `dividend` by `g`. Returns the steps and the remainder (len(g)-1 bits). */
export function mod2Divide(dividend: string, g: string): { steps: CrcStep[]; remainder: string } {
  const r = g.length - 1
  const bits = dividend.split('')
  const steps: CrcStep[] = []
  for (let i = 0; i + r < bits.length; i++) {
    const window = bits.slice(i, i + r + 1).join('')
    const divisor = window[0] === '1' ? g : '0'.repeat(r + 1)
    const result = xorBits(window, divisor)
    steps.push({ pos: i, window, divisor, result })
    for (let k = 0; k <= r; k++) bits[i + k] = result[k]
  }
  return { steps, remainder: bits.slice(bits.length - r).join('') }
}

/** one's-complement 16-bit sum with wraparound; returns [rawSum17bits, wrapped, checksum] */
export function onesComplementSum(words: number[]) {
  let raw = 0
  let sum = 0
  for (const w of words) {
    raw = sum + w
    sum = raw
    while (sum > 0xffff) sum = (sum & 0xffff) + (sum >>> 16)
  }
  return { raw, sum, checksum: ~sum & 0xffff }
}

export const bin16 = (n: number) => groupBits(n.toString(2).padStart(16, '0'), 4)
