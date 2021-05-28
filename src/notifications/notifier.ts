import url from 'url'
import { Server } from 'ws'
import { Server as HttpServer } from "http";

// untested
export class Notifier {
  private connections: Map<string, any>;
  private server: Server;
  private interval: NodeJS.Timeout;

  constructor() {
    this.connections = new Map()
  }

  connect(server: HttpServer) {
    this.server = new Server({ noServer: true })
    this.interval = setInterval(this.checkAll.bind(this), 10000)
    this.server.on('close', this.close.bind(this))
    this.server.on('connection', this.add.bind(this))
    server.on('upgrade', (request, socket, head) => {
      const userId = url.parse(request.url, true).query.userId.toString()

      userId
        ? this.server.handleUpgrade(request, socket, head, ws => this.server.emit('connection', userId, ws))
        : socket.destroy()
    })
  }

  add(userId: string, socket) {
    socket.isAlive = true
    socket.on('pong', () => socket.isAlive = true)
    socket.on('close', this.remove.bind(this, userId))
    this.connections.set(userId, socket)
  }

  send(userId: string, notification: AlertNotification) {
    const connection = this.connections.get(userId) as WebSocket
    if (connection) {
      connection.send(JSON.stringify(notification))
    }
  }

  broadcast(notification: AlertNotification) {
    this.connections.forEach((connection) =>
      connection.send(JSON.stringify(notification))
    )
  }

  isAlive(userId: string) {
    return !!this.connections.get(userId)
  }

  checkAll() {
    this.connections.forEach((connection) => {
      if (!connection.isAlive) {
        return connection.terminate()
      }

      connection.isAlive = false
      connection.ping('')
    })
  }

  remove(userId: string) {
    this.connections.delete(userId)
  }

  close() {
    clearInterval(this.interval)
  }
}