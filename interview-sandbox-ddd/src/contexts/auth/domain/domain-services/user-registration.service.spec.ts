import { Test, TestingModule } from '@nestjs/testing';
import { UserRegistrationDomainService } from './user-registration.service';


// Mock repository
const mockUserRepository = {
  save: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findAll: jest.fn(),
  delete: jest.fn(),
  exists: jest.fn(),
};

describe('UserRegistrationDomainService (DDD Domain Service)', () => {
  let service: UserRegistrationDomainService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRegistrationDomainService,
        {
          provide: 'IUserRepository',
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UserRegistrationDomainService>(UserRegistrationDomainService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    const validUserData = {
      userId: 'user-123',
      email: 'john.doe@example.com',
      name: 'John Doe',
      password: 'ValidPass123',
      role: 'USER' as const,
    };

    beforeEach(() => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.save.mockResolvedValue(undefined);
    });

    it('should register a user successfully', async () => {
      const result = await service.registerUser(
        validUserData.userId,
        validUserData.email,
        validUserData.name,
        validUserData.password,
        validUserData.role
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(validUserData.userId);
      expect(result.email.getValue()).toBe(validUserData.email);
      expect(result.name).toBe(validUserData.name);
      expect(result.role).toBe(validUserData.role);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(validUserData.email);
    });

    it('should throw error if user already exists', async () => {
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 'existing-user',
        email: { getValue: () => validUserData.email },
      });

      await expect(service.registerUser(
        validUserData.userId,
        validUserData.email,
        validUserData.name,
        validUserData.password,
        validUserData.role
      )).rejects.toThrow(`User with email ${validUserData.email} already exists`);
    });

    it('should validate user name', async () => {
      await expect(service.registerUser(
        validUserData.userId,
        validUserData.email,
        'A', // Name too short
        validUserData.password,
        validUserData.role
      )).rejects.toThrow('Name must be at least 2 characters long');
    });
  });

  describe('verifyUserEmail', () => {
    it('should verify user email successfully', async () => {
      const mockUserAggregate = {
        verifyEmail: jest.fn(),
      };

      mockUserRepository.findById.mockResolvedValue(mockUserAggregate);

      await service.verifyUserEmail('user-123');

      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-123');
      expect(mockUserAggregate.verifyEmail).toHaveBeenCalled();
      expect(mockUserRepository.save).toHaveBeenCalledWith(mockUserAggregate);
    });

    it('should throw error if user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(service.verifyUserEmail('user-123')).rejects.toThrow('User with ID user-123 not found');
    });
  });
});
