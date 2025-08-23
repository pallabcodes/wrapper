/**
 * Authentication Module
 * JWT-based authentication with refresh tokens, rate limiting, and security features
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createModule } = require('../index');
const { CacheUtils } = require('../../infrastructure/cache');

/**
 * Authentication Service
 * Handles user authentication, token management, and security
 */
class AuthService {
  constructor(module) {
    this.module = module;
    this.config = module.config.jwt;
    this.securityConfig = module.config.security;
  }
  
  /**
   * Hash password using bcrypt
   */
  async hashPassword(password) {
    return bcrypt.hash(password, this.securityConfig.bcryptRounds);
  }
  
  /**
   * Verify password against hash
   */
  async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
  }
  
  /**
   * Generate JWT access token
   */
  generateAccessToken(payload) {
    return jwt.sign(payload, this.config.secret, {
      expiresIn: this.config.expiresIn,
      issuer: this.config.issuer,
      audience: this.config.audience,
    });
  }
  
  /**
   * Generate JWT refresh token
   */
  generateRefreshToken(payload) {
    return jwt.sign(payload, this.config.secret, {
      expiresIn: this.config.refreshExpiresIn,
      issuer: this.config.issuer,
      audience: this.config.audience,
    });
  }
  
  /**
   * Verify and decode JWT token
   */
  async verifyToken(token) {
    try {
      return jwt.verify(token, this.config.secret, {
        issuer: this.config.issuer,
        audience: this.config.audience,
      });
    } catch (error) {
      throw new Error(`Invalid token: ${error.message}`);
    }
  }
  
  /**
   * Register new user
   */
  async register(userData) {
    const { email, password, firstName, lastName, role = 'customer' } = userData;
    
    try {
      // Check if user already exists
      const existingUser = await this.module.models.user.findByEmail(email);
      if (existingUser) {
        throw new Error('User already exists with this email');
      }
      
      // Hash password
      const passwordHash = await this.hashPassword(password);
      
      // Create user
      const user = await this.module.models.user.create({
        email,
        passwordHash,
        firstName,
        lastName,
        role,
        isActive: true,
        isEmailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Generate tokens
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };
      
      const accessToken = this.generateAccessToken(tokenPayload);
      const refreshToken = this.generateRefreshToken(tokenPayload);
      
      // Store refresh token in cache
      await this.module.cache.set(
        this.module.cacheKey('refresh_token', user.id),
        refreshToken,
        7 * 24 * 60 * 60 // 7 days
      );
      
      this.module.log('info', `User registered: ${email}`);
      
      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      };
    } catch (error) {
      this.module.handleError(error, { action: 'register', email });
    }
  }
  
  /**
   * Login user
   */
  async login(email, password, userAgent, ip) {
    try {
      // Find user by email
      const user = await this.module.models.user.findByEmail(email);
      if (!user) {
        throw new Error('Invalid credentials');
      }
      
      // Check if user is active
      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }
      
      // Verify password
      const isValidPassword = await this.verifyPassword(password, user.passwordHash);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }
      
      // Generate tokens
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };
      
      const accessToken = this.generateAccessToken(tokenPayload);
      const refreshToken = this.generateRefreshToken(tokenPayload);
      
      // Store refresh token in cache
      await this.module.cache.set(
        this.module.cacheKey('refresh_token', user.id),
        refreshToken,
        7 * 24 * 60 * 60 // 7 days
      );
      
      // Update last login
      await this.module.models.user.updateLastLogin(user.id, ip, userAgent);
      
      this.module.log('info', `User logged in: ${email}`);
      
      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      };
    } catch (error) {
      this.module.handleError(error, { action: 'login', email });
    }
  }
  
  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = await this.verifyToken(refreshToken);
      
      // Check if refresh token exists in cache
      const cachedToken = await this.module.cache.get(
        this.module.cacheKey('refresh_token', decoded.userId)
      );
      
      if (!cachedToken || cachedToken !== refreshToken) {
        throw new Error('Invalid refresh token');
      }
      
      // Get user data
      const user = await this.module.models.user.findById(decoded.userId);
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }
      
      // Generate new tokens
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };
      
      const newAccessToken = this.generateAccessToken(tokenPayload);
      const newRefreshToken = this.generateRefreshToken(tokenPayload);
      
      // Update refresh token in cache
      await this.module.cache.set(
        this.module.cacheKey('refresh_token', user.id),
        newRefreshToken,
        7 * 24 * 60 * 60 // 7 days
      );
      
      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      this.module.handleError(error, { action: 'refresh_token' });
    }
  }
  
  /**
   * Logout user
   */
  async logout(userId) {
    try {
      // Remove refresh token from cache
      await this.module.cache.del(
        this.module.cacheKey('refresh_token', userId)
      );
      
      this.module.log('info', `User logged out: ${userId}`);
      
      return { success: true };
    } catch (error) {
      this.module.handleError(error, { action: 'logout', userId });
    }
  }
  
  /**
   * Validate user session
   */
  async validateSession(token) {
    try {
      const decoded = await this.verifyToken(token);
      
      // Get user data from cache or database
      const cacheKey = this.module.cacheKey('user_session', decoded.userId);
      let user = await this.module.cache.get(cacheKey);
      
      if (!user) {
        user = await this.module.models.user.findById(decoded.userId);
        if (user) {
          // Cache user session for 5 minutes
          await this.module.cache.set(cacheKey, user, 300);
        }
      }
      
      if (!user || !user.isActive) {
        throw new Error('Invalid session');
      }
      
      return {
        userId: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      };
    } catch (error) {
      throw new Error('Invalid session');
    }
  }
}

/**
 * User Model
 * Database operations for user management
 */
class UserModel {
  constructor(module) {
    this.module = module;
    this.db = module.db;
  }
  
  /**
   * Create new user
   */
  async create(userData) {
    const { query, values } = this.module.db.constructor.buildInsertQuery('users', userData);
    const result = await this.db.query(query, values);
    return result.rows[0];
  }
  
  /**
   * Find user by ID
   */
  async findById(id) {
    const result = await this.db.query(
      'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    return result.rows[0];
  }
  
  /**
   * Find user by email
   */
  async findByEmail(email) {
    const result = await this.db.query(
      'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL',
      [email]
    );
    return result.rows[0];
  }
  
  /**
   * Update last login
   */
  async updateLastLogin(userId, ip, userAgent) {
    await this.db.query(
      'UPDATE users SET last_login_at = NOW(), last_login_ip = $2, last_login_user_agent = $3 WHERE id = $1',
      [userId, ip, userAgent]
    );
  }
  
  /**
   * Update user
   */
  async update(id, userData) {
    userData.updatedAt = new Date();
    const { query, values } = this.module.db.constructor.buildUpdateQuery(
      'users',
      userData,
      { id }
    );
    const result = await this.db.query(query, values);
    return result.rows[0];
  }
}

/**
 * Authentication Routes
 */
const createAuthRoutes = (module) => {
  return async function authRoutes(fastify) {
    // Rate limiting for auth endpoints
    const rateLimitConfig = {
      max: 5,
      timeWindow: '1 minute',
      errorResponseBuilder: (request, context) => ({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many authentication attempts. Please try again later.',
          retryAfter: Math.round(context.ttl / 1000),
        },
      }),
    };
    
    // Register endpoint
    fastify.post('/register', {
      config: { rateLimit: rateLimitConfig },
      schema: {
        description: 'Register new user',
        tags: ['auth'],
        body: {
          type: 'object',
          required: ['email', 'password', 'firstName', 'lastName'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            firstName: { type: 'string', minLength: 1 },
            lastName: { type: 'string', minLength: 1 },
            role: { type: 'string', enum: ['customer', 'vendor'] },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  role: { type: 'string' },
                },
              },
              tokens: {
                type: 'object',
                properties: {
                  accessToken: { type: 'string' },
                  refreshToken: { type: 'string' },
                },
              },
            },
          },
        },
      },
    }, async (request, reply) => {
      const result = await module.services.auth.register(request.body);
      return reply.code(201).send(result);
    });
    
    // Login endpoint
    fastify.post('/login', {
      config: { rateLimit: rateLimitConfig },
      schema: {
        description: 'User login',
        tags: ['auth'],
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  role: { type: 'string' },
                },
              },
              tokens: {
                type: 'object',
                properties: {
                  accessToken: { type: 'string' },
                  refreshToken: { type: 'string' },
                },
              },
            },
          },
        },
      },
    }, async (request, reply) => {
      const { email, password } = request.body;
      const userAgent = request.headers['user-agent'];
      const ip = request.ip;
      
      const result = await module.services.auth.login(email, password, userAgent, ip);
      return reply.send(result);
    });
    
    // Token refresh endpoint
    fastify.post('/refresh', {
      schema: {
        description: 'Refresh access token',
        tags: ['auth'],
        body: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              accessToken: { type: 'string' },
              refreshToken: { type: 'string' },
            },
          },
        },
      },
    }, async (request, reply) => {
      const { refreshToken } = request.body;
      const result = await module.services.auth.refreshToken(refreshToken);
      return reply.send(result);
    });
    
    // Logout endpoint
    fastify.post('/logout', {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'User logout',
        tags: ['auth'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
            },
          },
        },
      },
    }, async (request, reply) => {
      const result = await module.services.auth.logout(request.user.userId);
      return reply.send(result);
    });
    
    // Profile endpoint
    fastify.get('/profile', {
      onRequest: [fastify.authenticate],
      schema: {
        description: 'Get user profile',
        tags: ['auth'],
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              role: { type: 'string' },
            },
          },
        },
      },
    }, async (request, reply) => {
      return reply.send(request.user);
    });
  };
};

// Create and export the auth module
module.exports = createModule('auth', {
  services: {
    auth: AuthService,
  },
  models: {
    user: UserModel,
  },
  routes: createAuthRoutes,
  
  async init(module) {
    // Register authentication decorator
    module.app.decorate('authenticate', async (request, reply) => {
      try {
        const authorization = request.headers.authorization;
        if (!authorization || !authorization.startsWith('Bearer ')) {
          throw new Error('Missing or invalid authorization header');
        }
        
        const token = authorization.slice(7); // Remove 'Bearer ' prefix
        const user = await module.services.auth.validateSession(token);
        
        request.user = user;
      } catch (error) {
        reply.code(401).send({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }
    });
    
    module.log('info', 'Authentication module initialized');
  },
});
