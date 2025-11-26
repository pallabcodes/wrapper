import { Test, TestingModule } from '@nestjs/testing';
import { LoginUserUseCase } from './login-user.use-case';
import { USER_REPOSITORY_PORT } from '@domain/ports/output/user.repository.port';
import { InvalidCredentialsException } from '@domain/exceptions/invalid-credentials.exception';

// Mock repository
const mockUserRepository = {
  findByEmail: jest.fn(),
};

// Mock JWT service
const mockJwtService = {
  generateTokens: jest.fn(),
};

describe('LoginUserUseCase', () => {
  let useCase: LoginUserUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginUserUseCase,
        {
          provide: USER_REPOSITORY_PORT,
          useValue: mockUserRepository,
        },
        {
          provide: 'JwtService' as any,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    useCase = module.get<LoginUserUseCase>(LoginUserUseCase);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validDto = {
      email: 'test@example.com',
      password: 'ValidPass123',
    };

    it('should login user successfully and return tokens', async () => {
      // Arrange
      const mockUser = {
        id: 'user-123',
        email: { getValue: () => 'test@example.com' },
        name: 'John Doe',
        role: 'USER',
        isEmailVerified: true,
        passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewfLkIwF/HTQXvGi',
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockJwtService.generateTokens.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      // Act
      const result = await useCase.execute(validDto);

      // Assert
      expect(result.user.id).toBe('user-123');
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.name).toBe('John Doe');
      expect(result.user.role).toBe('USER');
      expect(result.user.isEmailVerified).toBe(true);

      expect(result.tokens.accessToken).toBe('access-token');
      expect(result.tokens.refreshToken).toBe('refresh-token');

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        expect.objectContaining({ getValue: expect.any(Function) })
      );
      expect(mockJwtService.generateTokens).toHaveBeenCalledWith(
        'user-123',
        'test@example.com',
        'USER'
      );
    });

    it('should throw InvalidCredentialsException for non-existent user', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(validDto)).rejects.toThrow(InvalidCredentialsException);
      expect(mockJwtService.generateTokens).not.toHaveBeenCalled();
    });

    it('should throw InvalidCredentialsException for wrong password', async () => {
      // Arrange
      const mockUser = {
        id: 'user-123',
        email: { getValue: () => 'test@example.com' },
        passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewfLkIwF/HTQXvGi',
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(useCase.execute({
        ...validDto,
        password: 'WrongPass456'
      })).rejects.toThrow(InvalidCredentialsException);

      expect(mockJwtService.generateTokens).not.toHaveBeenCalled();
    });
  });
});
