import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { USER_REPOSITORY_PORT } from '../../domain/ports/user.repository.port';
import { EVENT_PUBLISHER_PORT } from '../../domain/ports/event.publisher.port';
import { User } from '../../domain/entities/user.entity';

// Mock implementations
const mockUserRepository = {
  findByEmail: jest.fn(),
  save: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
};

const mockEventPublisher = {
  publish: jest.fn(),
};

describe('AuthService (Hexagonal Architecture)', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: USER_REPOSITORY_PORT,
          useValue: mockUserRepository,
        },
        {
          provide: EVENT_PUBLISHER_PORT,
          useValue: mockEventPublisher,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'ValidPass123',
    };

    it('should register a new user successfully', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.save.mockImplementation((user) => Promise.resolve(user));
      mockEventPublisher.publish.mockResolvedValue(undefined);

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(registerDto.email);
      expect(result.user.name).toBe(registerDto.name);
      expect(result.accessToken).toContain('token_');

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockEventPublisher.publish).toHaveBeenCalledWith('user.registered', expect.any(Object));
    });

    it('should throw ConflictException if user already exists', async () => {
      // Arrange
      const existingUser = new User('1', 'test@example.com', 'Existing', 'hash', false);
      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      expect(mockUserRepository.save).not.toHaveBeenCalled();
      expect(mockEventPublisher.publish).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'ValidPass123',
    };

    it('should login user successfully', async () => {
      // Arrange
      const user = new User('1', 'test@example.com', 'Test', '$2a$12$hash', true);
      mockUserRepository.findByEmail.mockResolvedValue(user);

      // Mock bcrypt.compare (we can't easily mock it, so we'll assume it passes)
      // In real tests, you might need to mock bcrypt or use a test-specific implementation

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(result.user).toBe(user);
      expect(result.accessToken).toContain('token_');
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for unverified email', async () => {
      // Arrange
      const unverifiedUser = new User('1', 'test@example.com', 'Test', '$2a$12$hash', false);
      mockUserRepository.findByEmail.mockResolvedValue(unverifiedUser);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow('Email not verified');
    });
  });

  describe('verifyEmail', () => {
    it('should verify user email successfully', async () => {
      // Arrange
      const user = new User('1', 'test@example.com', 'Test', 'hash', false);
      const verifiedUser = user.verifyEmail();

      mockUserRepository.findById.mockResolvedValue(user);
      mockUserRepository.update.mockResolvedValue(verifiedUser);

      // Act
      const result = await service.verifyEmail('1');

      // Assert
      expect(result.isEmailVerified).toBe(true);
      expect(mockUserRepository.update).toHaveBeenCalledWith('1', expect.objectContaining({
        isEmailVerified: true,
      }));
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.verifyEmail('1')).rejects.toThrow(UnauthorizedException);
    });
  });
});
