import { authService } from "../../modules/auth/authService"

describe("Auth Integration Tests", () => {
  it("should register a new user", async () => {
    const userData = {
      email: "test@example.com",
      password: "StrongPass123!",
      firstName: "John",
      lastName: "Doe"
    }

    const result = await authService.register(userData)
    
    expect(result).toMatchObject({
      user: {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        isEmailVerified: false
      },
      tokens: {
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        expiresIn: expect.any(Number)
      }
    })
  })

  it("should login existing user", async () => {
    // First register a user
    const userData = {
      email: "test2@example.com",
      password: "StrongPass123!",
      firstName: "John",
      lastName: "Doe"
    }
    await authService.register(userData)

    // Then login
    const loginData = {
      email: "test2@example.com",
      password: "StrongPass123!"
    }

    const result = await authService.login(loginData)
    
    expect(result).toMatchObject({
      user: {
        email: loginData.email,
        firstName: "John",
        lastName: "Doe"
      },
      tokens: {
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        expiresIn: expect.any(Number)
      }
    })
  })

  it("should handle duplicate registration", async () => {
    const userData = {
      email: "test3@example.com",
      password: "StrongPass123!",
      firstName: "John",
      lastName: "Doe"
    }

    // Register first time
    await authService.register(userData)

    // Try to register again
    await expect(authService.register(userData)).rejects.toThrow("User already exists")
  })
})
