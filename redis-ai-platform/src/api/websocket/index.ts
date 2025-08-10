import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { Redis } from 'ioredis';
import { logger } from '../../utils/logger';
import { APIServices } from '../rest/index';

// Import handlers
import { WorkspaceHandler } from './handlers/workspace';
import { LearningHandler } from './handlers/learning';
import { AdaptiveUIHandler } from './handlers/adaptive-ui';
import { SystemHandler } from './handlers/system';
import { AIRoutingHandler } from './handlers/ai-routing';\nimport { SearchHandler } from './handlers/search';

export interface WebSocketConfig {
  cors: {
    origin: string[];
    methods: string[];
    credentials: boolean;
  };
  connectionTimeout: number;
  pingTimeout: number;
  pingInterval: number;
  maxConnections: number;
  enableAuth: boolean;
  enableRateLimit: boolean;
  rateLimitMax: number;
  rateLimitWindow: number;
}

export interface SocketUser {
  id: string;
  email?: string;
  role?: string;
  workspaces?: string[];
  connectedAt: Date;
  lastActivity: Date;
}

export interface ConnectionInfo {
  id: string;
  userId?: string;
  user?: SocketUser;
  ipAddress: string;
  userAgent: string;
  connectedAt: Date;
  lastActivity: Date;
  subscriptions: Set<string>;
  rateLimitCount: number;
  rateLimitResetTime: number;
}

export class WebSocketGateway {
  private io: SocketIOServer;
  private redis: Redis;
  private services: APIServices;
  private config: WebSocketConfig;
  private connections: Map<string, ConnectionInfo> = new Map();
  private userConnections: Map<string, Set<string>> = new Map();
  
  // Handlers
  private workspaceHandler: WorkspaceHandler;
  private learningHandler: LearningHandler;
  private adaptiveUIHandler: AdaptiveUIHandler;
  private systemHandler: SystemHandler;
  private aiRoutingHandler: AIRoutingHandler;\n  private searchHandler: SearchHandler;

  constructor(httpServer: HTTPServer, redis: Redis, services: APIServices, config: WebSocketConfig) {
    this.redis = redis;
    this.services = services;
    this.config = config;

    // Initialize Socket.IO server
    this.io = new SocketIOServer(httpServer, {
      cors: config.cors,
      connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
        skipMiddlewares: true
      },
      pingTimeout: config.pingTimeout,
      pingInterval: config.pingInterval
    });

    // Initialize handlers
    this.workspaceHandler = new WorkspaceHandler(this.io, redis, services);
    this.learningHandler = new LearningHandler(this.io, redis, services);
    this.adaptiveUIHandler = new AdaptiveUIHandler(this.io, redis, services);
    this.systemHandler = new SystemHandler(this.io, redis, services);
    this.aiRoutingHandler = new AIRoutingHandler(this.io, redis, services);\n    this.searchHandler = new SearchHandler(this.io, redis, services);

    this.setupMiddleware();
    this.setupEventHandlers();
    this.startCleanupInterval();
  }

  private setupMiddleware(): void {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        if (this.config.enableAuth) {
          const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
          if (!token) {
            return next(new Error('Authentication required'));
          }

          const user = await this.authenticateToken(token);
          if (!user) {
            return next(new Error('Invalid authentication token'));
          }

          socket.data.user = user;
        }

        next();
      } catch (error) {
        logger.error('WebSocket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });

    // Rate limiting middleware
    this.io.use(async (socket, next) => {
      try {
        if (this.config.enableRateLimit) {
          const clientId = socket.handshake.address;
          const rateLimitKey = `ws_rate_limit:${clientId}`;
          
          const current = await this.redis.get(rateLimitKey);
          const count = current ? parseInt(current) : 0;

          if (count >= this.config.rateLimitMax) {
            return next(new Error('Rate limit exceeded'));
          }

          // Set rate limit data
          socket.data.rateLimitCount = count + 1;
          socket.data.rateLimitResetTime = Date.now() + this.config.rateLimitWindow;

          // Update Redis counter
          if (count === 0) {
            await this.redis.setex(rateLimitKey, Math.ceil(this.config.rateLimitWindow / 1000), 1);
          } else {
            await this.redis.incr(rateLimitKey);
          }
        }

        next();
      } catch (error) {
        logger.error('WebSocket rate limiting error:', error);
        next(error);
      }
    });

    // Connection limit middleware
    this.io.use((socket, next) => {
      if (this.connections.size >= this.config.maxConnections) {
        return next(new Error('Maximum connections exceeded'));
      }
      next();
    });
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    // Setup Redis pub/sub for cross-instance communication
    this.setupRedisSubscriptions();
  }

  private async handleConnection(socket: any): Promise<void> {
    const connectionInfo: ConnectionInfo = {
      id: socket.id,
      userId: socket.data.user?.id,
      user: socket.data.user,
      ipAddress: socket.handshake.address,
      userAgent: socket.handshake.headers['user-agent'] || 'unknown',
      connectedAt: new Date(),
      lastActivity: new Date(),
      subscriptions: new Set(),
      rateLimitCount: socket.data.rateLimitCount || 0,
      rateLimitResetTime: socket.data.rateLimitResetTime || 0
    };

    this.connections.set(socket.id, connectionInfo);

    // Track user connections
    if (connectionInfo.userId) {
      if (!this.userConnections.has(connectionInfo.userId)) {
        this.userConnections.set(connectionInfo.userId, new Set());
      }
      this.userConnections.get(connectionInfo.userId)!.add(socket.id);
    }

    logger.info(`WebSocket connection established: ${socket.id}`, {
      userId: connectionInfo.userId,
      ipAddress: connectionInfo.ipAddress,
      totalConnections: this.connections.size
    });

    // Send welcome message
    socket.emit('connected', {
      socketId: socket.id,
      timestamp: new Date().toISOString(),
      user: connectionInfo.user,
      serverInfo: {
        version: '1.0.0',
        features: ['workspace', 'learning', 'adaptive-ui', 'system', 'ai-routing', 'search']
      }
    });

    // Setup event handlers for this socket
    this.setupSocketHandlers(socket, connectionInfo);

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      this.handleDisconnection(socket, reason);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`WebSocket error for ${socket.id}:`, error);
    });

    // Activity tracking
    socket.use((packet, next) => {
      const connection = this.connections.get(socket.id);
      if (connection) {
        connection.lastActivity = new Date();
      }
      next();
    });
  }

  private setupSocketHandlers(socket: any, connectionInfo: ConnectionInfo): void {
    // Workspace events
    this.workspaceHandler.setupHandlers(socket, connectionInfo);

    // Learning events
    this.learningHandler.setupHandlers(socket, connectionInfo);

    // Adaptive UI events
    this.adaptiveUIHandler.setupHandlers(socket, connectionInfo);

    // System events
    this.systemHandler.setupHandlers(socket, connectionInfo);

    // AI Routing events
    this.aiRoutingHandler.setupHandlers(socket, connectionInfo);\n\n    // Search events\n    this.searchHandler.setupHandlers(socket, connectionInfo);

    // Generic subscription management
    socket.on('subscribe', async (data: { channel: string; params?: any }) => {
      try {
        await this.handleSubscription(socket, connectionInfo, data.channel, data.params);
      } catch (error) {
        logger.error('Subscription error:', error);
        socket.emit('error', { message: 'Subscription failed', error: error.message });
      }
    });

    socket.on('unsubscribe', async (data: { channel: string }) => {
      try {
        await this.handleUnsubscription(socket, connectionInfo, data.channel);
      } catch (error) {
        logger.error('Unsubscription error:', error);
        socket.emit('error', { message: 'Unsubscription failed', error: error.message });
      }
    });

    // Ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Get connection info
    socket.on('get_info', () => {
      socket.emit('connection_info', {
        socketId: socket.id,
        userId: connectionInfo.userId,
        connectedAt: connectionInfo.connectedAt,
        subscriptions: Array.from(connectionInfo.subscriptions),
        rateLimitInfo: {
          count: connectionInfo.rateLimitCount,
          resetTime: connectionInfo.rateLimitResetTime
        }
      });
    });
  }

  private async handleSubscription(socket: any, connectionInfo: ConnectionInfo, channel: string, params?: any): Promise<void> {
    // Validate subscription permissions
    if (this.config.enableAuth && !await this.canSubscribeToChannel(connectionInfo.user, channel, params)) {
      throw new Error('Insufficient permissions for subscription');
    }

    // Add to subscriptions
    connectionInfo.subscriptions.add(channel);
    
    // Join Socket.IO room
    await socket.join(channel);

    // Store subscription in Redis for cross-instance support
    await this.redis.sadd(`ws_subscriptions:${channel}`, socket.id);
    await this.redis.expire(`ws_subscriptions:${channel}`, 3600); // 1 hour TTL

    logger.info(`Socket ${socket.id} subscribed to ${channel}`);
    socket.emit('subscribed', { channel, timestamp: Date.now() });
  }

  private async handleUnsubscription(socket: any, connectionInfo: ConnectionInfo, channel: string): Promise<void> {
    // Remove from subscriptions
    connectionInfo.subscriptions.delete(channel);
    
    // Leave Socket.IO room
    await socket.leave(channel);

    // Remove from Redis
    await this.redis.srem(`ws_subscriptions:${channel}`, socket.id);

    logger.info(`Socket ${socket.id} unsubscribed from ${channel}`);
    socket.emit('unsubscribed', { channel, timestamp: Date.now() });
  }

  private handleDisconnection(socket: any, reason: string): void {
    const connectionInfo = this.connections.get(socket.id);
    if (!connectionInfo) return;

    logger.info(`WebSocket disconnection: ${socket.id}`, {
      userId: connectionInfo.userId,
      reason,
      duration: Date.now() - connectionInfo.connectedAt.getTime(),
      totalConnections: this.connections.size - 1
    });

    // Clean up user connections
    if (connectionInfo.userId) {
      const userSockets = this.userConnections.get(connectionInfo.userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          this.userConnections.delete(connectionInfo.userId);
        }
      }
    }

    // Clean up subscriptions from Redis
    this.cleanupSocketSubscriptions(socket.id, connectionInfo.subscriptions);

    // Remove connection
    this.connections.delete(socket.id);
  }

  private async cleanupSocketSubscriptions(socketId: string, subscriptions: Set<string>): Promise<void> {
    for (const channel of subscriptions) {
      try {
        await this.redis.srem(`ws_subscriptions:${channel}`, socketId);
      } catch (error) {
        logger.error(`Failed to cleanup subscription ${channel} for socket ${socketId}:`, error);
      }
    }
  }

  private setupRedisSubscriptions(): void {
    // Subscribe to Redis channels for cross-instance communication
    const subscriber = this.redis.duplicate();
    
    subscriber.subscribe(
      'ws_broadcast',
      'ws_workspace_updates',
      'ws_system_alerts',
      'ws_ai_routing_updates',
      'ws_learning_updates',
      'ws_adaptive_ui_updates',\n      'ws_search_updates'
    );

    subscriber.on('message', (channel, message) => {
      try {
        const data = JSON.parse(message);
        this.handleRedisMessage(channel, data);
      } catch (error) {
        logger.error('Failed to parse Redis message:', error);
      }
    });
  }

  private handleRedisMessage(channel: string, data: any): void {
    switch (channel) {
      case 'ws_broadcast':
        this.io.emit(data.event, data.payload);
        break;
      case 'ws_workspace_updates':
        this.io.to(`workspace:${data.workspaceId}`).emit('workspace_update', data.payload);
        break;
      case 'ws_system_alerts':
        this.io.emit('system_alert', data.payload);
        break;
      case 'ws_ai_routing_updates':
        this.io.emit('ai_routing_update', data.payload);
        break;
      case 'ws_learning_updates':
        if (data.userId) {
          this.emitToUser(data.userId, 'learning_update', data.payload);
        }
        break;
      case 'ws_adaptive_ui_updates':
        if (data.userId) {
          this.emitToUser(data.userId, 'adaptive_ui_update', data.payload);
        }
        break;
    }
  }

  private async authenticateToken(token: string): Promise<SocketUser | null> {
    try {
      // Remove 'Bearer ' prefix if present
      const cleanToken = token.replace('Bearer ', '');
      
      // This would typically validate JWT token or API key
      // For now, we'll return a mock user
      if (cleanToken === 'valid_token') {
        return {
          id: 'user_123',
          email: 'user@example.com',
          role: 'user',
          workspaces: ['workspace_1', 'workspace_2'],
          connectedAt: new Date(),
          lastActivity: new Date()
        };
      }
      
      return null;
    } catch (error) {
      logger.error('Token authentication error:', error);
      return null;
    }
  }

  private async canSubscribeToChannel(user: SocketUser | undefined, channel: string, params?: any): Promise<boolean> {
    if (!user) return false;

    // Check permissions based on channel type
    if (channel.startsWith('workspace:')) {
      const workspaceId = channel.split(':')[1];
      return user.workspaces?.includes(workspaceId) || false;
    }

    if (channel.startsWith('user:')) {
      const userId = channel.split(':')[1];
      return user.id === userId;
    }

    // Allow system channels for authenticated users
    if (['system_alerts', 'ai_routing_updates'].includes(channel)) {
      return true;
    }

    return false;
  }

  private startCleanupInterval(): void {
    // Clean up inactive connections every 5 minutes
    setInterval(() => {
      this.cleanupInactiveConnections();
    }, 5 * 60 * 1000);

    // Clean up Redis subscriptions every hour
    setInterval(() => {
      this.cleanupRedisSubscriptions();
    }, 60 * 60 * 1000);
  }

  private cleanupInactiveConnections(): void {
    const now = Date.now();
    const inactiveThreshold = 30 * 60 * 1000; // 30 minutes

    for (const [socketId, connection] of this.connections) {
      if (now - connection.lastActivity.getTime() > inactiveThreshold) {
        logger.info(`Cleaning up inactive connection: ${socketId}`);
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.disconnect(true);
        }
      }
    }
  }

  private async cleanupRedisSubscriptions(): Promise<void> {
    try {
      const keys = await this.redis.keys('ws_subscriptions:*');
      for (const key of keys) {
        const members = await this.redis.smembers(key);
        const validMembers = members.filter(socketId => this.connections.has(socketId));
        
        if (validMembers.length !== members.length) {
          await this.redis.del(key);
          if (validMembers.length > 0) {
            await this.redis.sadd(key, ...validMembers);
            await this.redis.expire(key, 3600);
          }
        }
      }
    } catch (error) {
      logger.error('Redis subscription cleanup error:', error);
    }
  }

  // Public methods for broadcasting
  public broadcast(event: string, data: any): void {
    this.io.emit(event, data);
  }

  public broadcastToRoom(room: string, event: string, data: any): void {
    this.io.to(room).emit(event, data);
  }

  public emitToUser(userId: string, event: string, data: any): void {
    const userSockets = this.userConnections.get(userId);
    if (userSockets) {
      for (const socketId of userSockets) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit(event, data);
        }
      }
    }
  }

  public async publishToRedis(channel: string, data: any): Promise<void> {
    await this.redis.publish(channel, JSON.stringify(data));
  }

  // Statistics and monitoring
  public getStats(): any {
    const userCount = this.userConnections.size;
    const totalConnections = this.connections.size;
    const anonymousConnections = totalConnections - Array.from(this.userConnections.values())
      .reduce((sum, sockets) => sum + sockets.size, 0);

    return {
      totalConnections,
      authenticatedUsers: userCount,
      anonymousConnections,
      totalSubscriptions: Array.from(this.connections.values())
        .reduce((sum, conn) => sum + conn.subscriptions.size, 0),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    };
  }

  public getConnectionInfo(socketId: string): ConnectionInfo | undefined {
    return this.connections.get(socketId);
  }

  public getUserConnections(userId: string): string[] {
    const sockets = this.userConnections.get(userId);
    return sockets ? Array.from(sockets) : [];
  }

  public async shutdown(): Promise<void> {
    logger.info('Shutting down WebSocket gateway...');
    
    // Disconnect all clients
    this.io.disconnectSockets(true);
    
    // Close server
    this.io.close();
    
    logger.info('WebSocket gateway shutdown complete');
  }
}

// Default configuration
export const defaultWebSocketConfig: WebSocketConfig = {
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  connectionTimeout: 20000, // 20 seconds
  pingTimeout: 60000, // 1 minute
  pingInterval: 25000, // 25 seconds
  maxConnections: parseInt(process.env.WS_MAX_CONNECTIONS || '1000'),
  enableAuth: process.env.WS_ENABLE_AUTH === 'true',
  enableRateLimit: process.env.WS_ENABLE_RATE_LIMIT === 'true',
  rateLimitMax: parseInt(process.env.WS_RATE_LIMIT_MAX || '100'),
  rateLimitWindow: parseInt(process.env.WS_RATE_LIMIT_WINDOW || '60000') // 1 minute
};