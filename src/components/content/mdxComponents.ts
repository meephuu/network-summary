import type { MDXComponents } from 'mdx/types'
import { BackoffSim } from '../net/BackoffSim'
import { BufferCalc } from '../net/BufferCalc'
import { ChannelPartition } from '../net/ChannelPartition'
import { ChecksumCalc } from '../net/ChecksumCalc'
import { CountToInfinity } from '../net/CountToInfinity'
import { CrcCalc } from '../net/CrcCalc'
import { CrossSubnet } from '../net/CrossSubnet'
import { DhcpDora } from '../net/DhcpDora'
import { DijkstraSim } from '../net/DijkstraSim'
import { DvGrid } from '../net/DvGrid'
import { EthernetFrame } from '../net/EthernetFrame'
import { FlowTable } from '../net/FlowTable'
import { Fragmenter } from '../net/Fragmenter'
import { IpHeader } from '../net/IpHeader'
import { MacEfficiency } from '../net/MacEfficiency'
import { NatSim } from '../net/NatSim'
import { ParityDemo } from '../net/ParityDemo'
import { PlanesDiagram } from '../net/PlanesDiagram'
import { PrefixMatch } from '../net/PrefixMatch'
import { SchedulerSim } from '../net/SchedulerSim'
import { SdnStack } from '../net/SdnStack'
import { SubnetCalc } from '../net/SubnetCalc'
import { SwitchLearning } from '../net/SwitchLearning'
import { TracerouteSim } from '../net/TracerouteSim'
import { WebRequest } from '../net/WebRequest'
import { QuizOverview, QuizSet } from '../quiz/Quiz'
import { Callout, Def, Example, Tip, Warn } from './Callout'
import { Compare, CompareItem } from './Compare'
import { Figure } from './Figure'
import { Solution } from './Solution'

/**
 * Components every chapter's MDX can use without importing them.
 * Register new shared components (and every new widget) here.
 */
export const mdxComponents: MDXComponents = {
  // content boxes
  Callout,
  Def,
  Example,
  Warn,
  Tip,
  Solution,
  Compare,
  CompareItem,
  Figure,
  // chapter 4
  PlanesDiagram,
  PrefixMatch,
  SchedulerSim,
  BufferCalc,
  IpHeader,
  Fragmenter,
  SubnetCalc,
  DhcpDora,
  NatSim,
  FlowTable,
  // chapter 5
  DijkstraSim,
  DvGrid,
  CountToInfinity,
  SdnStack,
  TracerouteSim,
  // chapter 6
  ParityDemo,
  ChecksumCalc,
  CrcCalc,
  ChannelPartition,
  MacEfficiency,
  BackoffSim,
  CrossSubnet,
  EthernetFrame,
  SwitchLearning,
  WebRequest,
  // quiz page
  QuizOverview,
  QuizSet,
}
