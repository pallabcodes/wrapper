# Clean Architecture vs. Traditional 3-Layer: The Concrete Guide

This guide eliminates the subjectivity. It explains **exactly** why Clean Architecture is used and **exactly** how to implement a feature in it compared to the traditional way.

## Part 1: The "Hard" Difference (No Fluff)

The difference is not "cleanliness" or "organization". The difference is **mathematical dependency direction**.

### 1. Traditional 3-Layer (The "Coupled" Way)
**Flow**: `Controller` -> `Service` -> `Repository` (TypeORM/Mongoose)

*   **The Code**: The `UserService` imports `UserRepository`.
*   **The Problem**: The `UserRepository` returns specific Database objects (e.g., Mongoose Documents or TypeORM Entities).
*   **The Consequence**: Your "Business Logic" is now tightly coupled to the database.
    *   *Scenario*: You want to switch from MongoDB to SQL.
    *   *Result*: You have to rewrite the **Service** layer because it was using MongoDB-specific methods (like `.populate()` or `_id`).
    *   *Testing*: To test the Service, you must mock the complex Database library.

### 2. Clean Architecture (The "Inverted" Way)
**Flow**: `Controller` -> `UseCase` -> `IPort` <- `RepositoryImpl`

*   **The Code**: The `CreateUserUseCase` imports an **Interface** (e.g., `IUserRepository`), NOT the class.
*   **The Inversion**: The `RepositoryImpl` (Infrastructure) imports the `IUserRepository` (Domain) and implements it.
*   **The Benefit**:
    *   **Zero Regression Risk**: The *Use Case* generally does not know the database exists. It only knows "I can save a user".
    *   **Switching DBs**: Write a new `PostgresRepository` that implements `IUserRepository`. The Use Case code **does not change a single line**.
    *   **Testing**: You mock a simple JS object `{ save: () => {} }`, not a complex TypeORM connection.

---

## Part 2: Concrete Workflow - "Creating a User"

If an interviewer asks: *"Walk me through adding a 'Create User' feature in Clean Architecture."*

### Step 1: The Core (Domain) - *No Database yet!*
First, define **WHAT** a user is and **HOW** we save them, abstractly.

1.  **Entity**: Create `User.ts` (Plain class).
    ```typescript
    // domain/entities/user.entity.ts
    export class User {
      constructor(public id: string, public name: string) {}
    }
    ```
2.  **Port (Interface)**: Create `i-user.repository.ts`.
    ```typescript
    // domain/repositories/i-user.repository.ts
    export interface IUserRepository {
      save(user: User): Promise<void>;
    }
    ```

### Step 2: The Logic (Application)
Now write the business rule.

3.  **Use Case**: Create `create-user.use-case.ts`.
    ```typescript
    // application/use-cases/create-user.use-case.ts
    export class CreateUserUseCase {
      constructor(private userRepo: IUserRepository) {} // Injected!

      async execute(name: string) {
        if (name.length < 3) throw new Error("Name too short");
        const user = new User(uuid(), name);
        await this.userRepo.save(user); // Doesn't care if it's SQL or File
      }
    }
    ```

### Step 3: The Plumbing (Infrastructure)
Now, and only now, decide on the database.

4.  **Repository Implementation**: Create `typeorm-user.repository.ts`.
    ```typescript
    // infrastructure/repositories/typeorm-user.repository.ts
    import { IUserRepository } from '../../domain/...';

    export class TypeOrmUserRepository implements IUserRepository {
      async save(user: User) {
        // Convert Domain Entity -> DB Entity
        const dbEntity = toDbEntity(user);
        await this.ormRepo.save(dbEntity);
      }
    }
    ```

### Step 4: The Entry Point (Presentation)
Finally, expose it to the world.

5.  **Controller**: Create `user.controller.ts`.
    ```typescript
    // presentation/controllers/user.controller.ts
    export class UserController {
      constructor(private createUserUseCase: CreateUserUseCase) {}

      async handle(req, res) {
        await this.createUserUseCase.execute(req.body.name);
        res.status(201).send();
      }
    }
    ```

### Summary of the Flow
1.  **Domain**: Define `User` + `Interface` (Abstract).
2.  **Application**: Write Logic using the Interface.
3.  **Infrastructure**: Implement Interface with SQL/Mongo.
4.  **Presentation**: Call Logic from HTTP.

**Why go through this trouble?** 
Because `CreateUserUseCase` (Step 2) never touches `typeorm` or `mongoose`. It is pure TypeScript. It lasts forever, regardless of tech trends.
