import { useState } from 'react'
import { ipToString, maskOf, networkOf, broadcastOf, parseIp } from '../../lib/net'
import type { PanelTab } from './FloatingPanel'
import { Calc, Grid, Note } from './PanelParts'

function SubnetTab() {
  const [txt, setTxt] = useState('200.23.18.77/23')
  const m = txt.trim().match(/^(.+)\/(\d{1,2})$/)
  const ip = m ? parseIp(m[1]) : null
  const len = m ? +m[2] : NaN
  const ok = ip !== null && len >= 0 && len <= 32
  return (
    <>
      <Calc>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          a.b.c.d/x
          <input value={txt} onChange={(e) => setTxt(e.target.value)} style={{ fontFamily: 'var(--font-mono)', width: 170 }} />
        </label>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13.5, marginTop: 4 }}>
          {ok ? (
            <>
              network {ipToString(networkOf(ip!, len))} · last {ipToString(broadcastOf(ip!, len))} · {2 ** (32 - len)} addr
            </>
          ) : (
            'รูปแบบ เช่น 192.168.1.10/26'
          )}
        </div>
      </Calc>
      <Grid
        corner="/x"
        cols={['subnet mask', 'จำนวน address', 'ขนาดบล็อก']}
        rows={Array.from({ length: 25 }, (_, i) => i + 8).map((n) => {
          const host = 32 - n
          const oct = Math.ceil(n / 8)
          const step = 2 ** (8 * oct - n)
          return {
            label: `/${n}`,
            cells: [ipToString(maskOf(n)), (2 ** host).toLocaleString('en-US'), `ไบต์ ${oct} ทีละ ${step}`],
            strong: n % 8 === 0,
          }
        })}
      />
      <Note>ขนาดบล็อก = ช่วงที่ไบต์ที่ไม่เต็ม 255 ของ mask กระโดดทีละเท่าไร เช่น /23 → ไบต์ 3 ทีละ 2 (16, 18, 20 …)</Note>
    </>
  )
}

function BinaryTab() {
  const [n, setN] = useState(200)
  const v = Math.max(0, Math.min(255, Math.floor(n || 0)))
  return (
    <>
      <Calc>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          ฐาน 10 (0–255)
          <input type="number" min={0} max={255} value={n} onChange={(e) => setN(+e.target.value)} style={{ width: 80 }} />
        </label>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, marginTop: 4 }}>= {v.toString(2).padStart(8, '0')}</div>
      </Calc>
      <Grid corner="บิต" cols={['128', '64', '32', '16', '8', '4', '2', '1']} rows={[{ label: v, cells: v.toString(2).padStart(8, '0').split('') }]} />
      <Grid
        corner="n"
        cols={['2ⁿ']}
        rows={Array.from({ length: 17 }, (_, i) => ({ label: i, cells: [(2 ** i).toLocaleString('en-US')], strong: i === 8 || i === 16 }))}
      />
    </>
  )
}

function RefTab() {
  return (
    <>
      <Grid
        corner="ICMP type/code"
        cols={['ความหมาย']}
        rows={[
          ['0/0', 'echo reply (ping)'],
          ['3/0', 'dest. network unreachable'],
          ['3/1', 'dest. host unreachable'],
          ['3/3', 'dest. port unreachable (traceroute จบ)'],
          ['8/0', 'echo request (ping)'],
          ['11/0', 'TTL expired (traceroute)'],
          ['12/0', 'bad IP header'],
        ].map(([a, b]) => ({ label: a, cells: [b] }))}
      />
      <Grid
        corner="อะไร"
        cols={['ค่า']}
        rows={[
          ['DHCP port', 'server 67 / client 68 (UDP)'],
          ['broadcast IP', '255.255.255.255'],
          ['broadcast MAC', 'FF-FF-FF-FF-FF-FF'],
          ['private IP', '10/8, 172.16/12, 192.168/16'],
          ['IPv4 / IPv6 header', '20 B (+options) / 40 B'],
          ['MAC address', '48 บิต'],
          ['802.1Q VLAN ID', '12 บิต'],
          ['backoff', 'K ∈ {0..2^m−1}, รอ K·512 bit times'],
        ].map(([a, b]) => ({ label: a, cells: [b] }))}
      />
      <Grid
        corner="protocol"
        cols={['วิ่งบน']}
        rows={[
          ['OSPF (LSA)', 'IP ตรง'],
          ['BGP', 'TCP (semi-permanent)'],
          ['OpenFlow', 'TCP'],
          ['DHCP / DNS', 'UDP'],
          ['ICMP', 'ห่อใน IP'],
          ['traceroute probe', 'UDP'],
        ].map(([a, b]) => ({ label: a, cells: [b] }))}
      />
    </>
  )
}

export const NET_TABS: PanelTab[] = [
  { id: 'subnet', label: 'Subnet /x', render: () => <SubnetTab /> },
  { id: 'binary', label: 'ฐาน 2', render: () => <BinaryTab /> },
  { id: 'ref', label: 'ICMP / ตัวเลข', render: () => <RefTab /> },
]
