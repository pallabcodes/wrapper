import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

/**
 * Session Strategy
 * 
 * Handles session-based authentication
 * Used with express-session
 */
@Injectable()
export class SessionStrategy extends PassportStrategy(Strategy, 'session') {
  constructor() {
    super();
  }

  async validate(user: any): Promise<any> {
    // User is already authenticated via session
    return user;
  }
}

