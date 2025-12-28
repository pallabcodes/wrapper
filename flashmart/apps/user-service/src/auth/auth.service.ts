import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../entities/user.orm-entity';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        private readonly jwtService: JwtService,
    ) { }

    async register(email: string, password: string, name: string) {
        // Check if user exists
        const existing = await this.userRepo.findOne({ where: { email } });
        if (existing) {
            throw new ConflictException('Email already registered');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const user = this.userRepo.create({
            email,
            name,
            passwordHash,
        });
        await this.userRepo.save(user);

        // Generate token
        const token = this.generateToken(user);

        return { user, token };
    }

    async login(email: string, password: string) {
        const user = await this.userRepo.findOne({ where: { email } });
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const token = this.generateToken(user);

        return { user, token };
    }

    private generateToken(user: UserEntity): string {
        return this.jwtService.sign({
            sub: user.id,
            email: user.email,
        });
    }
}
