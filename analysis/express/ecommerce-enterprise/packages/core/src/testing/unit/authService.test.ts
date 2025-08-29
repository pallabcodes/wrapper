/**
 * Auth Service Unit Tests
 * 
 * Comprehensive unit tests for authentication service.
 * Following internal team testing standards.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { authService } from '../../modules/auth/authService'
import { userRepository } from '../../database/repositories/userRepository'
import { createTestUser, mockRequest, mockResponse, expectError } from '../setup'
import { hashPassword, comparePassword } from '../../utils/helpers'

// Mock dependencies
jest.mock('../../database/repositories/userRepository')
jest.mock('../../utils/helpers')
jest.mock('../../utils/logger')

const mockedUserRepository = userRepository as jest.Mocked<typeof userRepository>
const mockedHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>
const mockedComparePassword = comparePassword as jest.MockedFunction<typeof comparePassword>

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User'
      }

      const hashedPassword = 'hashedPassword123'
      const createdUser = {
        id: 'user-123',
        ...userData,
        password: hashedPassword,
        role: 'customer',
        isActive: true,
        isEmailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockedHashPassword.mockResolvedValue(hashedPassword)
      mockedUserRepository.findUserByEmail.mockResolvedValue(null)
      mockedUserRepository.createUser.mockResolvedValue(createdUser)

      // Act
      const result = await authService.registerUser(userData)

      // Assert
      expect(mockedHashPassword).toHaveBeenCalledWith(userData.password)
      expect(mockedUserRepository.findUserByEmail).toHaveBeenCalledWith(userData.email)
      expect(mockedUserRepository.createUser).toHaveBeenCalledWith({
        ...userData,
        password: hashedPassword,
        role: 'customer',
        isActive: true,
        isEmailVerified: false
      })
      expect(result).toEqual(createdUser)
    })

    it('should throw error if user already exists', async () => {
      // Arrange
      const userData = {
        email: 'existing@example.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User'
      }

      const existingUser = { id: 'existing-user', email: userData.email }
      mockedUserRepository.findUserByEmail.mockResolvedValue(existingUser)

      // Act & Assert
      await expectError(
        () => authService.registerUser(userData),
        'User with email existing@example.com already exists'
      )
    })

    it('should validate password strength', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'weak',
        firstName: 'Test',
        lastName: 'User'
      }

      // Act & Assert
      await expectError(
        () => authService.registerUser(userData),
        'Password must be at least 8 characters long'
      )
    })
  })

  describe('loginUser', () => {
    it('should login user with valid credentials', async () => {
      // Arrange
      const credentials = {
        email: 'test@example.com',
        password: 'TestPassword123!'
      }

      const user = {
        id: 'user-123',
        email: credentials.email,
        password: 'hashedPassword123',
        firstName: 'Test',
        lastName: 'User',
        role: 'customer',
        isActive: true,
        isEmailVerified: true
      }

      const tokens = {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123'
      }

      mockedUserRepository.findUserByEmail.mockResolvedValue(user)
      mockedComparePassword.mockResolvedValue(true)
      mockedUserRepository.updateLastLogin.mockResolvedValue()

      // Mock JWT generation
      jest.spyOn(authService, 'generateTokens').mockResolvedValue(tokens)

      // Act
      const result = await authService.loginUser(credentials)

      // Assert
      expect(mockedUserRepository.findUserByEmail).toHaveBeenCalledWith(credentials.email)
      expect(mockedComparePassword).toHaveBeenCalledWith(credentials.password, user.password)
      expect(mockedUserRepository.updateLastLogin).toHaveBeenCalledWith(user.id)
      expect(result).toEqual({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        ...tokens
      })
    })

    it('should throw error for invalid email', async () => {
      // Arrange
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'TestPassword123!'
      }

      mockedUserRepository.findUserByEmail.mockResolvedValue(null)

      // Act & Assert
      await expectError(
        () => authService.loginUser(credentials),
        'Invalid email or password'
      )
    })

    it('should throw error for invalid password', async () => {
      // Arrange
      const credentials = {
        email: 'test@example.com',
        password: 'WrongPassword123!'
      }

      const user = {
        id: 'user-123',
        email: credentials.email,
        password: 'hashedPassword123',
        firstName: 'Test',
        lastName: 'User',
        role: 'customer',
        isActive: true,
        isEmailVerified: true
      }

      mockedUserRepository.findUserByEmail.mockResolvedValue(user)
      mockedComparePassword.mockResolvedValue(false)

      // Act & Assert
      await expectError(
        () => authService.loginUser(credentials),
        'Invalid email or password'
      )
    })

    it('should throw error for inactive user', async () => {
      // Arrange
      const credentials = {
        email: 'test@example.com',
        password: 'TestPassword123!'
      }

      const user = {
        id: 'user-123',
        email: credentials.email,
        password: 'hashedPassword123',
        firstName: 'Test',
        lastName: 'User',
        role: 'customer',
        isActive: false,
        isEmailVerified: true
      }

      mockedUserRepository.findUserByEmail.mockResolvedValue(user)

      // Act & Assert
      await expectError(
        () => authService.loginUser(credentials),
        'Account is deactivated'
      )
    })
  })

  describe('refreshToken', () => {
    it('should refresh access token with valid refresh token', async () => {
      // Arrange
      const refreshToken = 'valid-refresh-token'
      const userId = 'user-123'
      const newTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      }

      // Mock JWT verification
      jest.spyOn(authService, 'verifyToken').mockResolvedValue({
        userId,
        type: 'refresh'
      })

      // Mock user retrieval
      const user = {
        id: userId,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'customer',
        isActive: true
      }
      mockedUserRepository.findUserById.mockResolvedValue(user)

      // Mock token generation
      jest.spyOn(authService, 'generateTokens').mockResolvedValue(newTokens)

      // Act
      const result = await authService.refreshToken(refreshToken)

      // Assert
      expect(authService.verifyToken).toHaveBeenCalledWith(refreshToken)
      expect(mockedUserRepository.findUserById).toHaveBeenCalledWith(userId)
      expect(result).toEqual(newTokens)
    })

    it('should throw error for invalid refresh token', async () => {
      // Arrange
      const refreshToken = 'invalid-refresh-token'

      jest.spyOn(authService, 'verifyToken').mockRejectedValue(new Error('Invalid token'))

      // Act & Assert
      await expectError(
        () => authService.refreshToken(refreshToken),
        'Invalid refresh token'
      )
    })
  })

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      // Arrange
      const userId = 'user-123'
      const passwordData = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!'
      }

      const user = {
        id: userId,
        email: 'test@example.com',
        password: 'hashedOldPassword',
        firstName: 'Test',
        lastName: 'User',
        role: 'customer',
        isActive: true
      }

      const hashedNewPassword = 'hashedNewPassword'

      mockedUserRepository.findUserById.mockResolvedValue(user)
      mockedComparePassword.mockResolvedValue(true)
      mockedHashPassword.mockResolvedValue(hashedNewPassword)
      mockedUserRepository.updateUser.mockResolvedValue({
        ...user,
        password: hashedNewPassword
      })

      // Act
      const result = await authService.changePassword(userId, passwordData)

      // Assert
      expect(mockedUserRepository.findUserById).toHaveBeenCalledWith(userId)
      expect(mockedComparePassword).toHaveBeenCalledWith(passwordData.currentPassword, user.password)
      expect(mockedHashPassword).toHaveBeenCalledWith(passwordData.newPassword)
      expect(mockedUserRepository.updateUser).toHaveBeenCalledWith(userId, {
        password: hashedNewPassword
      })
      expect(result).toBe(true)
    })

    it('should throw error for incorrect current password', async () => {
      // Arrange
      const userId = 'user-123'
      const passwordData = {
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewPassword123!'
      }

      const user = {
        id: userId,
        email: 'test@example.com',
        password: 'hashedOldPassword',
        firstName: 'Test',
        lastName: 'User',
        role: 'customer',
        isActive: true
      }

      mockedUserRepository.findUserById.mockResolvedValue(user)
      mockedComparePassword.mockResolvedValue(false)

      // Act & Assert
      await expectError(
        () => authService.changePassword(userId, passwordData),
        'Current password is incorrect'
      )
    })
  })

  describe('getUserById', () => {
    it('should return user by ID', async () => {
      // Arrange
      const userId = 'user-123'
      const user = {
        id: userId,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'customer',
        isActive: true
      }

      mockedUserRepository.findUserById.mockResolvedValue(user)

      // Act
      const result = await authService.getUserById(userId)

      // Assert
      expect(mockedUserRepository.findUserById).toHaveBeenCalledWith(userId)
      expect(result).toEqual(user)
    })

    it('should return null for non-existent user', async () => {
      // Arrange
      const userId = 'non-existent-user'
      mockedUserRepository.findUserById.mockResolvedValue(null)

      // Act
      const result = await authService.getUserById(userId)

      // Assert
      expect(mockedUserRepository.findUserById).toHaveBeenCalledWith(userId)
      expect(result).toBeNull()
    })
  })
})
