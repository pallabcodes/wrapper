import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.orm-entity';
import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
    ) { }

    async findById(id: string): Promise<User | null> {
        const entity = await this.userRepo.findOne({ where: { id } });
        return entity ? this.toGraphQL(entity) : null;
    }

    async findAll(): Promise<User[]> {
        const entities = await this.userRepo.find();
        return entities.map(e => this.toGraphQL(e));
    }

    async findByEmail(email: string): Promise<User | null> {
        const entity = await this.userRepo.findOne({ where: { email } });
        return entity ? this.toGraphQL(entity) : null;
    }

    async create(input: CreateUserInput): Promise<User> {
        const entity = new UserEntity();
        entity.email = input.email;
        entity.name = input.name;
        // TODO: Add password hashing
        // entity.password = await this.hashPassword(input.password);

        const savedEntity = await this.userRepo.save(entity);
        return this.toGraphQL(savedEntity);
    }

    private toGraphQL(entity: UserEntity): User {
        return {
            id: entity.id,
            email: entity.email,
            name: entity.name,
            avatarUrl: entity.avatarUrl,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}
