import { Test, TestingModule } from '@nestjs/testing';
import { RegisterUserUseCase } from './register-user.use-case';
import { USER_REPOSITORY_PORT } from '@domain/ports/output/user.repository.port';
import { UserAlreadyExistsException } from '@domain/exceptions/user-already-exists.exception';

// Mock repository
const mockUserRepository = {
  findByEmail: jest.fn(),
  save: jest.fn(),
};

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterUserUseCase,
        {
          provide: USER_REPOSITORY_PORT,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    useCase = module.get<RegisterUserUseCase>(RegisterUserUseCase);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validDto = {
      email: 'test@example.com',
      name: 'John Doe',
      password: 'ValidPass123',
      role: 'USER' as const,
    };

    it('should register user successfully', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.save.mockResolvedValue({
        id: 'user-123',
        email: { getValue: () => 'test@example.com' },
        name: 'John Doe',
        role: 'USER',
        isEmailVerified: false,
      });

      // Act
      const result = await useCase.execute(validDto);

      // Assert
      expect(result.id).toBe('user-123');
      expect(result.email).toBe('test@example.com');
      expect(result.name).toBe('John Doe');
      expect(result.role).toBe('USER');
      expect(result.isEmailVerified).toBe(false);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        expect.objectContaining({ getValue: expect.any(Function) })
      );
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should throw UserAlreadyExistsException when email exists', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 'existing-user',
        email: { getValue: () => 'test@example.com' },
      });

      // Act & Assert
      await expect(useCase.execute(validDto)).rejects.toThrow(UserAlreadyExistsException);
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should default to USER role when not specified', async () => {
      // Arrange
      const dtoWithoutRole = {
        email: 'test@example.com',
        name: 'John Doe',
        password: 'ValidPass123',
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.save.mockResolvedValue({
        id: 'user-123',
        email: { getValue: () => 'test@example.com' },
        name: 'John Doe',
        role: 'USER',
        isEmailVerified: false,
      });

      // Act
      await useCase.execute(dtoWithoutRole);

      // Assert
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should hash password before saving', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.save.mockResolvedValue({
        id: 'user-123',
        email: { getValue: () => 'test@example.com' },
        name: 'John Doe',
        role: 'USER',
        isEmailVerified: false,
      });

      // Act
      await useCase.execute(validDto);

      // Assert
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          passwordHash: expect.stringMatching(/^\$2/), // bcrypt hash
        })
      );
    });
  });
});
