// services/signalrService.ts
import * as signalR from '@microsoft/signalr'
import * as SecureStore from 'expo-secure-store'

class SignalRService {
  private connection: signalR.HubConnection | null = null

  async connect(): Promise<void> {
    // Luôn disconnect cũ trước
    await this.disconnect()

    const token = await SecureStore.getItemAsync('accessToken')
    if (!token) {
      console.log('[SignalR] No token, skip connect')
      return
    }

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl('http://10.87.18.163:5189/hubs/chat', {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect([0, 2000, 5000])
      .configureLogging(signalR.LogLevel.Warning)
      .build()

    try {
      await this.connection.start()
      console.log('[SignalR] Connected')
    } catch (e) {
      console.log('[SignalR] Connect failed:', e)
      this.connection = null
      throw e
    }
  }

  async disconnect(): Promise<void> {
    console.log('[SignalR] disconnect() called, connection:', this.connection?.state)
    if (!this.connection) return

    const conn = this.connection
    this.connection = null // Set null trước để tránh reuse

    try {
      conn.off // Xóa tất cả listener
      await conn.stop()
      console.log('[SignalR] Disconnected')
    } catch (e) {
      console.log('[SignalR] Disconnect error (ignored):', e)
    }
  }

  async sendMessage(conversationId: number, content: string): Promise<void> {
    if (!this.isConnected()) throw new Error('Not connected')
    await this.connection!.invoke('SendMessageAsync', conversationId, content)
  }

  async markAsRead(conversationId: number): Promise<void> {
    if (!this.isConnected()) return
    try {
      await this.connection!.invoke('MarkAsRead', conversationId)
    } catch {}
  }

  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.connection) return
    this.connection.off(event) // Remove listener cũ trước
    this.connection.on(event, callback)
  }

  off(event: string): void {
    this.connection?.off(event)
  }

  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected
  }
}

export const signalRService = new SignalRService()