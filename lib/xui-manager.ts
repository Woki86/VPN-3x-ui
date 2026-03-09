import { prisma } from './prisma'

interface PanelConfig {
  url: string
  username: string
  password: string
}

interface InboundClient {
  id: string
  email: string
  uuid: string
  flow: string
  enable: boolean
  tgId?: string
  subId?: string
  limitIp?: number
  totalGB?: number
  expiryTime?: number
  flowSettings?: {
    flow: string
  }
}

interface XUIResponse<T> {
  success: boolean
  msg?: string
  obj?: T
}

interface Inbound {
  id: number
  port: number
  protocol: string
  settings: string
  streamSettings: string
  tag: string
  sniffing: string
  clientStats: string
}

interface InboundSettings {
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

export class XUIManager {
  private baseUrl: string
  private username: string
  private password: string
  private cookie: string | null = null
  private token: string | null = null

  constructor(panel: PanelConfig) {
    this.baseUrl = panel.url
    this.username = panel.username
    this.password = panel.password
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }

    if (this.cookie) {
      headers['Cookie'] = this.cookie
    }

    if (this.token) {
      headers['X-Auth-Token'] = this.token
    }

    return headers
  }

  async login(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          username: this.username,
          password: this.password,
        }),
      })

      const data = await response.json() as XUIResponse<{ token?: string }>

      if (data.success && data.obj?.token) {
        this.token = data.obj.token
        // Получаем cookie из заголовков Set-Cookie
        const setCookie = response.headers.get('set-cookie')
        if (setCookie) {
          this.cookie = setCookie.split(';')[0]
        }
        return true
      }

      return false
    } catch (error) {
      console.error('XUI login error:', error)
      return false
    }
  }

  private async ensureAuth(): Promise<void> {
    if (!this.token && !this.cookie) {
      await this.login()
    }
  }

  async getInbounds(): Promise<Inbound[]> {
    await this.ensureAuth()

    try {
      const response = await fetch(`${this.baseUrl}/xui/inbound/list`, {
        method: 'GET',
        headers: this.getHeaders(),
      })

      const data = await response.json() as XUIResponse<Inbound[]>

      if (data.success && data.obj) {
        return data.obj
      }

      return []
    } catch (error) {
      console.error('XUI getInbounds error:', error)
      return []
    }
  }

  async getClientInbound(inboundId: number, clientId: string): Promise<Inbound | null> {
    await this.ensureAuth()

    try {
      const response = await fetch(`${this.baseUrl}/xui/inbound/get/${inboundId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      })

      const data = await response.json() as XUIResponse<Inbound>

      if (data.success && data.obj) {
        return data.obj
      }

      return null
    } catch (error) {
      console.error('XUI getClientInbound error:', error)
      return null
    }
  }

  async addClientToInbound(
    inboundId: number,
    client: InboundClient
  ): Promise<boolean> {
    await this.ensureAuth()

    try {
      // Получаем текущий inbound
      const inbound = await this.getClientInbound(inboundId, client.id)
      if (!inbound) {
        console.error('Inbound not found:', inboundId)
        return false
      }

      // Парсим настройки
      const settings: InboundSettings = JSON.parse(inbound.settings)
      const streamSettings = JSON.parse(inbound.streamSettings)

      // Добавляем нового клиента
      if (!settings.clients) {
        settings.clients = []
      }

      settings.clients.push({
        id: client.uuid,
        email: client.email,
        flow: client.flow,
        enable: true,
      })

      // Формируем запрос на обновление
      const updateData = {
        id: inboundId,
        port: inbound.port,
        protocol: inbound.protocol,
        settings: JSON.stringify(settings),
        streamSettings: JSON.stringify(streamSettings),
        sniffing: inbound.sniffing,
        tag: inbound.tag,
      }

      const response = await fetch(`${this.baseUrl}/xui/inbound/update/${inboundId}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(updateData),
      })

      const data = await response.json() as XUIResponse<unknown>

      return data.success === true
    } catch (error) {
      console.error('XUI addClientToInbound error:', error)
      return false
    }
  }

  async removeClientFromInbound(
    inboundId: number,
    clientId: string
  ): Promise<boolean> {
    await this.ensureAuth()

    try {
      const inbound = await this.getClientInbound(inboundId, clientId)
      if (!inbound) {
        return false
      }

      const settings: InboundSettings = JSON.parse(inbound.settings)
      const streamSettings = JSON.parse(inbound.streamSettings)

      if (settings.clients) {
        settings.clients = settings.clients.filter(c => c.id !== clientId)
      }

      const updateData = {
        id: inboundId,
        port: inbound.port,
        protocol: inbound.protocol,
        settings: JSON.stringify(settings),
        streamSettings: JSON.stringify(streamSettings),
        sniffing: inbound.sniffing,
        tag: inbound.tag,
      }

      const response = await fetch(`${this.baseUrl}/xui/inbound/update/${inboundId}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(updateData),
      })

      const data = await response.json() as XUIResponse<unknown>

      return data.success === true
    } catch (error) {
      console.error('XUI removeClientFromInbound error:', error)
      return false
    }
  }

  generateVLESSLink(
    uuid: string,
    ip: string,
    port: number,
    sni: string,
    pbk: string,
    sid: string,
    flow: string,
    remark: string
  ): string {
    const params = new URLSearchParams({
      type: 'tcp',
      security: 'reality',
      pbk,
      fp: 'chrome',
      sni,
      sid,
      flow,
    })

    return `vless://${uuid}@${ip}:${port}?${params.toString()}#${encodeURIComponent(remark)}`
  }

  async generateClientLink(
    inboundId: number,
    clientId: string,
    userEmail: string,
    remark: string
  ): Promise<string | null> {
    await this.ensureAuth()

    try {
      const inbound = await this.getClientInbound(inboundId, clientId)
      if (!inbound) {
        return null
      }

      const settings: InboundSettings = JSON.parse(inbound.settings)
      const streamSettings: {
        realitySettings?: {
          serverNames: string[]
          publicKey: string
          shortIds: string[]
        }
      } = JSON.parse(inbound.streamSettings)

      const client = settings.clients?.find(c => c.id === clientId)
      if (!client) {
        return null
      }

      // Извлекаем IP из URL панели
      const url = new URL(this.baseUrl)
      const ip = url.hostname

      const realitySettings = streamSettings.realitySettings
      if (!realitySettings) {
        console.error('Reality settings not found')
        return null
      }

      const sni = realitySettings.serverNames?.[0] || 'google.com'
      const pbk = realitySettings.publicKey || ''
      const sid = realitySettings.shortIds?.[0] || ''

      return this.generateVLESSLink(
        client.id,
        ip,
        inbound.port,
        sni,
        pbk,
        sid,
        client.flow || 'xtls-rprx-vision',
        remark
      )
    } catch (error) {
      console.error('XUI generateClientLink error:', error)
      return null
    }
  }
}

export async function getXUIManager(isVip: boolean = false): Promise<XUIManager | null> {
  // Пытаемся получить панель из env переменных
  if (process.env.XUI_URL && process.env.XUI_USERNAME && process.env.XUI_PASSWORD) {
    const isVipPanel = process.env.XUI_IS_VIP === 'true'
    if (isVipPanel === isVip) {
      return new XUIManager({
        url: process.env.XUI_URL,
        username: process.env.XUI_USERNAME,
        password: process.env.XUI_PASSWORD,
      })
    }
  }

  // Пытаемся получить из базы данных
  const panel = await prisma.panel.findFirst({
    where: {
      isVip,
      isActive: true,
    },
  })

  if (panel) {
    return new XUIManager({
      url: panel.url,
      username: panel.username,
      password: panel.password,
    })
  }

  return null
}

export async function getAvailablePanel(isVip: boolean = false): Promise<{
  id: string
  url: string
  username: string
  password: string
  isVip: boolean
} | null> {
  // Проверяем env переменные
  if (process.env.XUI_URL && process.env.XUI_USERNAME && process.env.XUI_PASSWORD) {
    const isVipPanel = process.env.XUI_IS_VIP === 'true'
    if (isVipPanel === isVip) {
      return {
        id: 'env',
        url: process.env.XUI_URL,
        username: process.env.XUI_USERNAME,
        password: process.env.XUI_PASSWORD,
        isVip: isVipPanel,
      }
    }
  }

  // Получаем случайную активную панель из БД (round-robin)
  const panel = await prisma.panel.findFirst({
    where: {
      isVip,
      isActive: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  return panel
}
