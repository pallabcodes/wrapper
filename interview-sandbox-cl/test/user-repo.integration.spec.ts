import { Test } from '@nestjs/testing';
import { Sequelize } from 'sequelize-typescript';
import { AppModule } from '../src/app.module';
import { SequelizeUserRepositoryAdapter } from '../src/infrastructure/persistence/adapters/user.repository.adapter';
import { Email } from '../src/domain/value-objects/email.vo';
import { User } from '../src/domain/entities/user.entity';
import { AuthConfig } from '../src/infrastructure/config/auth.config';

describe('UserRepositoryAdapter Integration', () => {
  let repo: SequelizeUserRepositoryAdapter;
  let sequelize: Sequelize;

  const authConfig: AuthConfig = {
    JWT: {
      SECRET: 'unused',
      ACCESS_TOKEN_EXPIRATION: '15m',
      REFRESH_TOKEN_EXPIRATION: '7d',
    },
    BCRYPT: {
      SALT_ROUNDS: 4,
    },
    PASSWORD: {
      MIN_LENGTH: 8,
      REQUIRE_UPPERCASE: true,
      REQUIRE_LOWERCASE: true,
      REQUIRE_NUMBER: true,
    },
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    repo = moduleRef.get(SequelizeUserRepositoryAdapter);
    sequelize = moduleRef.get(Sequelize);
  });

  afterAll(async () => {
    if (sequelize) {
      await sequelize.close();
    }
  });

  it('create, find, update, delete user', async () => {
    const email = Email.create(`user${Date.now()}@example.com`);
    const user = await User.create(email, 'Repo Test', 'SecurePass123!', authConfig);

    const saved = await repo.save(user);
    expect(saved.id).toBeDefined();

    const found = await repo.findByEmail(email);
    expect(found?.email.getValue()).toBe(email.getValue());

    const updated = await repo.update(saved.updateProfile('Updated Name'));
    expect(updated.name).toBe('Updated Name');

    await repo.delete(updated.id);
    const gone = await repo.findById(updated.id);
    expect(gone).toBeNull();
  });
});


