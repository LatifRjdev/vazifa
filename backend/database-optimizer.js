import mongoose from 'mongoose';

// Database optimization utilities for MongoDB performance
export class DatabaseOptimizer {
  
  // Create indexes for better query performance
  static async createIndexes() {
    try {
      console.log('🔧 Creating database indexes for performance optimization...');
      
      // Users collection indexes
      const User = mongoose.model('User');
      await User.collection.createIndex({ email: 1 }, { unique: true });
      await User.collection.createIndex({ createdAt: -1 });
      await User.collection.createIndex({ isVerified: 1 });
      await User.collection.createIndex({ role: 1 });
      console.log('✅ User indexes created');
      
      // Tasks collection indexes
      const Task = mongoose.model('Task');
      await Task.collection.createIndex({ projectId: 1 });
      await Task.collection.createIndex({ assignedTo: 1 });
      await Task.collection.createIndex({ status: 1 });
      await Task.collection.createIndex({ priority: 1 });
      await Task.collection.createIndex({ dueDate: 1 });
      await Task.collection.createIndex({ createdAt: -1 });
      await Task.collection.createIndex({ 
        projectId: 1, 
        status: 1, 
        assignedTo: 1 
      }); // Compound index for common queries
      console.log('✅ Task indexes created');
      
      // Projects collection indexes
      const Project = mongoose.model('Project');
      await Project.collection.createIndex({ workspaceId: 1 });
      await Project.collection.createIndex({ createdBy: 1 });
      await Project.collection.createIndex({ status: 1 });
      await Project.collection.createIndex({ createdAt: -1 });
      await Project.collection.createIndex({ 
        workspaceId: 1, 
        status: 1 
      }); // Compound index
      console.log('✅ Project indexes created');
      
      // Workspaces collection indexes
      const Workspace = mongoose.model('Workspace');
      await Workspace.collection.createIndex({ createdBy: 1 });
      await Workspace.collection.createIndex({ 'members.userId': 1 });
      await Workspace.collection.createIndex({ createdAt: -1 });
      console.log('✅ Workspace indexes created');
      
      // Comments collection indexes
      const Comment = mongoose.model('Comment');
      await Comment.collection.createIndex({ taskId: 1 });
      await Comment.collection.createIndex({ userId: 1 });
      await Comment.collection.createIndex({ createdAt: -1 });
      await Comment.collection.createIndex({ 
        taskId: 1, 
        createdAt: -1 
      }); // Compound index for task comments
      console.log('✅ Comment indexes created');
      
      // Notifications collection indexes
      const Notification = mongoose.model('Notification');
      await Notification.collection.createIndex({ userId: 1 });
      await Notification.collection.createIndex({ isRead: 1 });
      await Notification.collection.createIndex({ createdAt: -1 });
      await Notification.collection.createIndex({ 
        userId: 1, 
        isRead: 1, 
        createdAt: -1 
      }); // Compound index for user notifications
      console.log('✅ Notification indexes created');
      
      console.log('🎉 All database indexes created successfully!');
      
    } catch (error) {
      console.error('❌ Error creating database indexes:', error);
      throw error;
    }
  }
  
  // Analyze database performance
  static async analyzePerformance() {
    try {
      console.log('📊 Analyzing database performance...');
      
      const db = mongoose.connection.db;
      
      // Get database stats
      const dbStats = await db.stats();
      console.log('📈 Database Statistics:', {
        collections: dbStats.collections,
        dataSize: `${Math.round(dbStats.dataSize / 1024 / 1024)}MB`,
        indexSize: `${Math.round(dbStats.indexSize / 1024 / 1024)}MB`,
        totalSize: `${Math.round(dbStats.storageSize / 1024 / 1024)}MB`,
      });
      
      // Analyze each collection
      const collections = ['users', 'tasks', 'projects', 'workspaces', 'comments', 'notifications'];
      
      for (const collectionName of collections) {
        try {
          const collection = db.collection(collectionName);
          const stats = await collection.stats();
          const indexes = await collection.indexes();
          
          console.log(`📋 ${collectionName.toUpperCase()} Collection:`, {
            documents: stats.count,
            avgDocSize: `${Math.round(stats.avgObjSize)}B`,
            dataSize: `${Math.round(stats.size / 1024)}KB`,
            indexCount: indexes.length,
            indexes: indexes.map(idx => Object.keys(idx.key).join(', ')),
          });
        } catch (error) {
          console.log(`⚠️ Collection ${collectionName} not found or error:`, error.message);
        }
      }
      
    } catch (error) {
      console.error('❌ Error analyzing database performance:', error);
    }
  }
  
  // Clean up old data
  static async cleanupOldData() {
    try {
      console.log('🧹 Cleaning up old data...');
      
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
      
      // Clean old notifications (older than 30 days)
      const Notification = mongoose.model('Notification');
      const oldNotifications = await Notification.deleteMany({
        createdAt: { $lt: thirtyDaysAgo },
        isRead: true
      });
      console.log(`🗑️ Deleted ${oldNotifications.deletedCount} old read notifications`);
      
      // Clean old activity logs if they exist (older than 6 months)
      try {
        const ActivityLog = mongoose.model('ActivityLog');
        const oldLogs = await ActivityLog.deleteMany({
          createdAt: { $lt: sixMonthsAgo }
        });
        console.log(`🗑️ Deleted ${oldLogs.deletedCount} old activity logs`);
      } catch (error) {
        console.log('ℹ️ ActivityLog model not found, skipping cleanup');
      }
      
      // Clean old verification tokens (older than 24 hours)
      try {
        const Verification = mongoose.model('Verification');
        const oldTokens = await Verification.deleteMany({
          createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });
        console.log(`🗑️ Deleted ${oldTokens.deletedCount} old verification tokens`);
      } catch (error) {
        console.log('ℹ️ Verification model not found, skipping cleanup');
      }
      
      console.log('✅ Data cleanup completed');
      
    } catch (error) {
      console.error('❌ Error during data cleanup:', error);
    }
  }
  
  // Optimize database connections
  static getOptimizedConnectionOptions() {
    return {
      maxPoolSize: 10, // Maximum number of connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close connections after 45 seconds of inactivity
      bufferMaxEntries: 0, // Disable mongoose buffering
      bufferCommands: false, // Disable mongoose buffering
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
      // Connection pool monitoring
      monitorCommands: process.env.NODE_ENV === 'development',
    };
  }
  
  // Monitor slow queries
  static enableSlowQueryLogging() {
    if (process.env.NODE_ENV === 'development') {
      mongoose.set('debug', (collectionName, method, query, doc) => {
        const start = Date.now();
        console.log(`🔍 MongoDB Query: ${collectionName}.${method}`, {
          query: JSON.stringify(query),
          doc: doc ? JSON.stringify(doc).substring(0, 100) + '...' : undefined,
        });
        
        // Log execution time (this is a simplified version)
        setTimeout(() => {
          const duration = Date.now() - start;
          if (duration > 100) {
            console.warn(`🐌 Slow Query: ${collectionName}.${method} took ${duration}ms`);
          }
        }, 0);
      });
    }
  }
  
  // Database health check
  static async healthCheck() {
    try {
      const start = Date.now();
      
      // Test connection
      const state = mongoose.connection.readyState;
      const stateNames = ['disconnected', 'connected', 'connecting', 'disconnecting'];
      
      if (state !== 1) {
        throw new Error(`Database not connected. State: ${stateNames[state]}`);
      }
      
      // Test query performance
      const User = mongoose.model('User');
      await User.findOne().limit(1);
      
      const duration = Date.now() - start;
      
      return {
        status: 'healthy',
        connectionState: stateNames[state],
        responseTime: `${duration}ms`,
        timestamp: new Date().toISOString(),
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
  
  // Get database metrics
  static async getMetrics() {
    try {
      const db = mongoose.connection.db;
      const admin = db.admin();
      
      // Get server status
      const serverStatus = await admin.serverStatus();
      
      return {
        connections: {
          current: serverStatus.connections.current,
          available: serverStatus.connections.available,
          totalCreated: serverStatus.connections.totalCreated,
        },
        memory: {
          resident: `${Math.round(serverStatus.mem.resident)}MB`,
          virtual: `${Math.round(serverStatus.mem.virtual)}MB`,
          mapped: serverStatus.mem.mapped ? `${Math.round(serverStatus.mem.mapped)}MB` : 'N/A',
        },
        operations: {
          insert: serverStatus.opcounters.insert,
          query: serverStatus.opcounters.query,
          update: serverStatus.opcounters.update,
          delete: serverStatus.opcounters.delete,
        },
        uptime: `${Math.floor(serverStatus.uptime / 3600)} hours`,
      };
      
    } catch (error) {
      console.error('❌ Error getting database metrics:', error);
      return { error: error.message };
    }
  }
}

// Export utility functions
export const createDatabaseIndexes = DatabaseOptimizer.createIndexes;
export const analyzeDatabasePerformance = DatabaseOptimizer.analyzePerformance;
export const cleanupOldData = DatabaseOptimizer.cleanupOldData;
export const getDatabaseHealth = DatabaseOptimizer.healthCheck;
export const getDatabaseMetrics = DatabaseOptimizer.getMetrics;
export const optimizedConnectionOptions = DatabaseOptimizer.getOptimizedConnectionOptions();

// Auto-run optimizations on import in production
if (process.env.NODE_ENV === 'production') {
  // Enable slow query logging
  DatabaseOptimizer.enableSlowQueryLogging();
  
  // Create indexes when the connection is ready
  mongoose.connection.once('open', async () => {
    try {
      await DatabaseOptimizer.createIndexes();
      console.log('🎉 Database optimization completed on startup');
    } catch (error) {
      console.error('❌ Database optimization failed on startup:', error);
    }
  });
}
