import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { RegisterUserUseCase } from './register-user.use-case';


// Mock repository
const mockUserRepository = {
  save: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findAll: jest.fn(),
  delete: jest.fn(),
  exists: jest.fn(),
};

// Mock event bus
const mockEventBus = {
  publish: jest.fn(),
};

describe('RegisterUserUseCase (Hexagonal Architecture)', () => {
  let useCase: RegisterUserUseCase;

  const validDto = {
    userId: 'user-123',
    email: 'john.doe@example.com',
    name: 'John Doe',
    password: 'ValidPass123',
    role: 'USER' as const,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterUserUseCase,
        {
          provide: 'IUserRepository',
          useValue: mockUserRepository,
        },
        {
          provide: EventBus,
          useValue: mockEventBus,
        },
      ],
    }).compile();

    useCase = module.get<RegisterUserUseCase>(RegisterUserUseCase);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('execute', () => {


    beforeEach(() => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.save.mockResolvedValue(undefined);
      mockEventBus.publish.mockResolvedValue(undefined);
    });

    it('should register a user successfully', async () => {
      const result = await useCase.execute(validDto);

      expect(result).toBeDefined();
      expect(result.user.id).toBe(validDto.userId);
      expect(result.user.email.getValue()).toBe(validDto.email);
      expect(result.user.name).toBe(validDto.name);
      expect(result.user.role).toBe(validDto.role);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(validDto.email);
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockEventBus.publish).toHaveBeenCalled();
    });

    it('should throw error if user already exists', async () => {
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 'existing-user',
        email: { getValue: () => validDto.email },
      });

      await expect(useCase.execute(validDto)).rejects.toThrow(
        `User with email ${validDto.email} already exists`
      );

      expect(mockUserRepository.save).not.toHaveBeenCalled();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });

    it('should generate tokens in result', async () => {
      const result = await useCase.execute(validDto);

      expect(result.accessToken).toContain('access_token_');
      expect(result.refreshToken).toContain('refresh_token_');
      expect(result.accessToken).toContain(validDto.userId);
      expect(result.refreshToken).toContain(validDto.userId);
    });

    it('should publish domain events', async () => {
      await useCase.execute(validDto);

      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'UserRegisteredEvent',
          aggregateId: validDto.userId,
        })
      );
    });
  });

  describe('token generation', () => {
    it('should generate unique tokens for different users', async () => {
      const dto1 = { ...validDto, userId: 'user-1' };
      const dto2 = { ...validDto, userId: 'user-2', email: 'jane@example.com' };

      mockUserRepository.findByEmail.mockResolvedValue(null);

      const result1 = await useCase.execute(dto1);
      const result2 = await useCase.execute(dto2);

      expect(result1.accessToken).not.toBe(result2.accessToken);
      expect(result1.refreshToken).not.toBe(result2.refreshToken);
      expect(result1.accessToken).toContain('user-1');
      expect(result2.accessToken).toContain('user-2');
    });
  });
});
