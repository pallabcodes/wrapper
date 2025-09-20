import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { randomInt, randomUUID } from 'crypto';

export interface OtpOptions {
  issuer?: string;
  redisUrl?: string;
  codeLength?: number; // numeric length, e.g., 6
  ttlSeconds?: number; // validity window
  maxAttempts?: number; // retry attempts per ticket
  cooldownSeconds?: number; // min gap between sends to the same identity
}

export interface OtpTicket {
  ticketId: string;
  subject: string; // email or phone
  channel: 'email' | 'sms' | 'totp';
  createdAt: number;
  ttlSeconds: number;
  attempts: number;
}

export interface OtpSender {
  sendCode(subject: string, channel: 'email' | 'sms', code: string): Promise<void>;
}

@Injectable()
export class OtpService {
  private client?: Redis;
  private opts: Required<OtpOptions>;
  private sender?: OtpSender;

  constructor(@Inject('AUTHX_OPTIONS') options: any) {
    const cfg: OtpOptions | undefined = options.otp;
    const merged: Required<OtpOptions> = {
      issuer: cfg?.issuer ?? 'AuthX',
      redisUrl: cfg?.redisUrl ?? '',
      codeLength: Math.min(Math.max(cfg?.codeLength ?? 6, 4), 8),
      ttlSeconds: cfg?.ttlSeconds ?? 300,
      maxAttempts: cfg?.maxAttempts ?? 5,
      cooldownSeconds: cfg?.cooldownSeconds ?? 60,
    };
    this.opts = merged;
    if (merged.redisUrl) this.client = new Redis(merged.redisUrl);
  }

  setSender(sender: OtpSender) {
    this.sender = sender;
  }

  async requestCode(subject: string, channel: 'email' | 'sms' | 'totp'): Promise<{ ticketId: string; expiresIn: number }> {
    this.ensureClient();
    // cooldown key per subject
    const cooldownKey = this.cooldownKey(subject);
    const cd = await this.client!.get(cooldownKey);
    if (cd) {
      throw new Error('OTP_COOLDOWN_ACTIVE');
    }

    const code = this.generateNumericCode(this.opts.codeLength);
    const ticketId = randomUUID();
    const ticket: OtpTicket = {
      ticketId,
      subject,
      channel,
      createdAt: Date.now(),
      ttlSeconds: this.opts.ttlSeconds,
      attempts: 0,
    };
    await this.client!.setex(this.ticketKey(ticketId), this.opts.ttlSeconds, JSON.stringify(ticket));
    await this.client!.setex(this.codeKey(ticketId), this.opts.ttlSeconds, code);
    await this.client!.setex(cooldownKey, this.opts.cooldownSeconds, '1');

    if (channel !== 'totp' && this.sender) {
      await this.sender.sendCode(subject, channel, code);
    }

    return { ticketId, expiresIn: this.opts.ttlSeconds };
  }

  async verifyCode(ticketId: string, code: string): Promise<{ ok: boolean; subject?: string }> {
    this.ensureClient();
    const tRaw = await this.client!.get(this.ticketKey(ticketId));
    if (!tRaw) return { ok: false };
    const ticket = JSON.parse(tRaw) as OtpTicket;
    if (ticket.attempts >= this.opts.maxAttempts) return { ok: false };

    const storedCode = await this.client!.get(this.codeKey(ticketId));
    const ok = storedCode !== null && this.timingSafeEqual(code, storedCode);
    ticket.attempts += 1;
    // Update attempts with remaining ttl
    const ttl = await this.client!.ttl(this.ticketKey(ticketId));
    if (ttl > 0) await this.client!.setex(this.ticketKey(ticketId), ttl, JSON.stringify(ticket));
    if (ok) {
      await this.client!.del(this.ticketKey(ticketId));
      await this.client!.del(this.codeKey(ticketId));
      return { ok: true, subject: ticket.subject };
    }
    return { ok: false };
  }

  private generateNumericCode(length: number): string {
    let s = '';
    for (let i = 0; i < length; i++) s += String(randomInt(0, 10));
    return s;
  }

  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }

  private ticketKey(id: string) { return `authx:otp:t:${id}`; }
  private codeKey(id: string) { return `authx:otp:c:${id}`; }
  private cooldownKey(subject: string) { return `authx:otp:cd:${subject}`; }
  private ensureClient() {
    if (!this.client) throw new Error('OTP_REDIS_NOT_CONFIGURED');
  }
}


