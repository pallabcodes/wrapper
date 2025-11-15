# Generic CRUD Module

## Overview

This module provides a **generic CRUD (Create, Read, Update, Delete) system** that works with **any Sequelize model** without writing entity-specific code. Perfect for rapid development during interviews or when you need to quickly add CRUD operations for new entities.

## Architecture

```
┌─────────────────────────────────────────┐
│  GenericCrudController                 │
│  Route: /api/:entity                    │
│  - GET    /api/:entity        (list)    │
│  - GET    /api/:entity/:id    (get)     │
│  - POST   /api/:entity        (create)  │
│  - PUT    /api/:entity/:id    (update)  │
│  - DELETE /api/:entity/:id    (delete) │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  GenericCrudService                    │
│  - Pagination, search, filters         │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  GenericCrudRepository                 │
│  - Works with any Sequelize model       │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  EntityRegistryService                  │
│  - Maps entity names to models          │
└─────────────────────────────────────────┘
```

## Quick Start (2 Steps)

### Step 1: Create Your Model

```typescript
// src/database/models/product.model.ts
import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({ tableName: 'products', timestamps: true })
export class Product extends Model<Product> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  name: string;

  @Column({ type: DataType.DECIMAL(10, 2) })
  price: number;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
```

### Step 2: Register in CrudModule

```typescript
// src/modules/crud/crud.module.ts
import { Product } from '../../database/models/product.model';

@Module({
  imports: [SequelizeModule.forFeature([Product])], // Add Product here
  // ...
})
export class CrudModule implements OnModuleInit {
  onModuleInit() {
    // Register Product entity
    this.entityRegistry.register('products', {
      model: Product,
      searchFields: ['name'], // Fields to search in
      defaultOrder: [['id', 'DESC']],
    });
  }
}
```

**That's it!** Full CRUD is now available at `/api/products`

## API Endpoints

Once registered, all entities get these endpoints:

### List Records (with pagination & search)
```
GET /api/:entity?page=1&limit=10&search=keyword
```

**Example:**
```bash
GET /api/students?page=1&limit=10&search=john
```

**Response:**
```json
{
  "data": [...],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

### Get One Record
```
GET /api/:entity/:id
```

**Example:**
```bash
GET /api/students/1
```

### Create Record
```
POST /api/:entity
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com"
}
```

### Update Record
```
PUT /api/:entity/:id
Content-Type: application/json

{
  "name": "Jane Doe"
}
```

### Delete Record
```
DELETE /api/:entity/:id
```

## Currently Registered Entities

- **students** - `/api/students`
- **courses** - `/api/courses`

## Adding a New Entity (Interview Scenario)

**Scenario:** Interviewer asks you to build CRUD for "orders"

**Time:** ~5 minutes

1. **Create Order model** (3 min)
   ```typescript
   @Table({ tableName: 'orders' })
   export class Order extends Model { ... }
   ```

2. **Add to CrudModule** (1 min)
   - Import Order
   - Add to `SequelizeModule.forFeature([Order])`
   - Register in `onModuleInit()`

3. **Create migration** (1 min)
   ```bash
   npx sequelize-cli migration:generate --name create-orders
   ```

**Done!** Full CRUD available at `/api/orders` ✅

## Features

- ✅ **Pagination** - Built-in pagination support
- ✅ **Search** - Multi-field search across specified fields
- ✅ **Filtering** - Custom where conditions
- ✅ **Sorting** - Configurable default ordering
- ✅ **Validation** - Automatic Sequelize validation
- ✅ **Error Handling** - Proper HTTP status codes
- ✅ **Type Safety** - TypeScript support
- ✅ **JWT Auth** - Protected endpoints (requires authentication)

## Configuration Options

When registering an entity:

```typescript
this.entityRegistry.register('entityName', {
  model: YourModel,
  searchFields: ['field1', 'field2'], // Fields to search in
  defaultOrder: [['id', 'DESC']],      // Default sorting
});
```

## Benefits for Interviews

1. **Speed** - Add CRUD in minutes, not hours
2. **Consistency** - Same API pattern for all entities
3. **Professional** - Shows understanding of generic patterns
4. **Scalable** - Easy to extend with custom logic
5. **Maintainable** - DRY principle, single source of truth

