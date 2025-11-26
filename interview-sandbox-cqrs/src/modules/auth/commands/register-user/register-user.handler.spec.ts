import { Test, TestingModule } from '@nestjs/testing';
import { RegisterUserHandler } from './register-user.handler';
import { RegisterUserCommand } from './register-user.command';
import { WRITE_REPOSITORY_TOKEN, EVENT_BUS_TOKEN } from '../../../../../common/di/tokens';

// Mock repository and event bus
const mockWriteRepository = {
  save: jest.fn(),
  findByEmail: jest.fn(),
};

const mockEventBus = {
  publish: jest.fn(),
};

describe('RegisterUserHandler (CQRS)', () => {
  let handler: RegisterUserHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterUserHandler,
        {
          provide: WRITE_REPOSITORY_TOKEN,
          useValue: mockWriteRepository,
        },
        {
          provide: EVENT_BUS_TOKEN,
          useValue: mockEventBus,
        },
      ],
    }).compile();

    handler = module.get<RegisterUserHandler>(RegisterUserHandler);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validCommand = new RegisterUserCommand(
      'user-123',
      'test@example.com',
      'John Doe',
      'ValidPass123',
      'USER'
    );

    it('should execute command successfully', async () => {
      // Arrange
      mockWriteRepository.findByEmail.mockResolvedValue(null);
      mockWriteRepository.save.mockResolvedValue(undefined);
      mockEventBus.publish.mockResolvedValue(undefined);

      // Act
      const result = await handler.execute(validCommand);

      // Assert
      expect(result).toBe('user-123');
      expect(mockWriteRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockWriteRepository.save).toHaveBeenCalled();
      expect(mockEventBus.publish).toHaveBeenCalled();
    });

    it('should throw error if user already exists', async () => {
      // Arrange
      mockWriteRepository.findByEmail.mockResolvedValue({
        id: 'existing-user',
        email: 'test@example.com',
      });

      // Act & Assert
      await expect(handler.execute(validCommand)).rejects.toThrow(
        'User with email test@example.com already exists'
      );

      expect(mockWriteRepository.save).not.toHaveBeenCalled();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });

    it('should publish events after saving aggregate', async () => {
      // Arrange
      mockWriteRepository.findByEmail.mockResolvedValue(null);
      mockWriteRepository.save.mockResolvedValue(undefined);
      mockEventBus.publish.mockResolvedValue(undefined);

      // Act
      await handler.execute(validCommand);

      // Assert
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'UserCreatedEvent',
          aggregateId: 'user-123',
          email: 'test@example.com',
        })
      );
    });
  });
});
