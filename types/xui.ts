export interface XUIResponse<T> {
  success: boolean
  msg?: string
  obj?: T
}

export interface Inbound {
  id: number
  port: number
  protocol: string
  settings: string
  streamSettings: string
  tag: string
  sniffing: string
  clientStats: string
}

export interface InboundSettings {
  clients?: Array<{
    id: string
    email: string
    flow: string
    limitIp?: number
    totalGB?: number
    expiryTime?: number
    enable?: boolean
    tgId?: string
    subId?: string
  }>
}

export interface RealitySettings {
  show: boolean
  dest: string
  proxyProtocolVer: string
  serverNames: string[]
  privateKey: string
  minClientVer: string
  maxClientVer: string
  maxTimeDiff: number
  shortIds: string[]
}

export interface XUIUser {
  id?: string
  username: string
  password: string
}
