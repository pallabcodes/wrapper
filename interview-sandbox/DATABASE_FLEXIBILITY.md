# Database Flexibility Guide

## Overview

The application supports both **MySQL** and **PostgreSQL** databases. You can switch between them using environment variables without changing any code.

## Quick Start

### Using MySQL (Default)

```bash
# No environment variable needed - MySQL is the default
# Or explicitly set:
export DB_DIALECT=mysql

# Start MySQL with Docker
docker-compose up -d mysql

# Or use locally installed MySQL
# Just ensure MySQL is running on port 3306
```

### Using PostgreSQL

```bash
# Set environment variable
export DB_DIALECT=postgres
# or
export DB_DIALECT=postgresql

# Start PostgreSQL with Docker
docker-compose up -d postgres

# Or use locally installed PostgreSQL
# Just ensure PostgreSQL is running on port 5432
```

## Environment Variables

### Database Selection

| Variable | Values | Default | Description |
|----------|--------|---------|-------------|
| `DB_DIALECT` | `mysql`, `postgres`, `postgresql` | `mysql` | Database dialect to use |

### Connection Configuration

| Variable | MySQL Default | PostgreSQL Default | Description |
|----------|---------------|-------------------|-------------|
| `DB_HOST` | `localhost` | `localhost` | Database host |
| `DB_PORT` | `3306` | `5432` | Database port |
| `DB_USERNAME` | `root` | `postgres` | Database username |
| `DB_PASSWORD` | `` (empty) | `` (empty) | Database password |
| `DB_NAME` | `interview_db` | `interview_db` | Database name |
| `DB_SSL` | N/A | `false` | Enable SSL for PostgreSQL |

## Docker Setup

### MySQL

```bash
docker-compose up -d mysql
```

**Default Credentials:**
- User: `root`
- Password: `rootpassword`
- Database: `interview_db`
- Port: `3306`

**Alternative User:**
- User: `interview_user`
- Password: `interview_password`

### PostgreSQL

```bash
docker-compose up -d postgres
```

**Default Credentials:**
- User: `postgres`
- Password: `postgrespassword`
- Database: `interview_db`
- Port: `5432`

## Example Configurations

### .env for MySQL (Default)

```env
DB_DIALECT=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=rootpassword
DB_NAME=interview_db
```

### .env for PostgreSQL

```env
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgrespassword
DB_NAME=interview_db
DB_SSL=false
```

### .env for Local MySQL

```env
DB_DIALECT=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=your_local_user
DB_PASSWORD=your_local_password
DB_NAME=interview_db
```

### .env for Local PostgreSQL

```env
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_local_user
DB_PASSWORD=your_local_password
DB_NAME=interview_db
```

## Running Migrations

Migrations work with both databases. The application automatically handles dialect-specific differences.

```bash
# Run migrations (works for both MySQL and PostgreSQL)
npm run db:migrate

# Undo last migration
npm run db:migrate:undo
```

## Database-Specific Notes

### MySQL

- **ENUM Types**: Supported natively
- **Auto Increment**: Uses `AUTO_INCREMENT`
- **Case Sensitivity**: Table names are case-insensitive on Windows/Mac, case-sensitive on Linux

### PostgreSQL

- **ENUM Types**: Supported natively (created as custom types)
- **Auto Increment**: Uses `SERIAL` or `BIGSERIAL`
- **Case Sensitivity**: Identifiers are case-insensitive unless quoted

## Migration Compatibility

All migrations are written to be compatible with both databases:

- Uses Sequelize data types (not raw SQL types)
- Handles ENUM differences automatically
- PostgreSQL-specific cleanup in `down()` migrations is conditional

## Switching Between Databases

### During Development

1. **Stop the application**
2. **Set `DB_DIALECT` environment variable**
3. **Start the appropriate database container** (or ensure local DB is running)
4. **Run migrations**: `npm run db:migrate`
5. **Start the application**

### Example: Switch from MySQL to PostgreSQL

```bash
# Stop application
# Stop MySQL container (optional)
docker-compose stop mysql

# Update .env file
echo "DB_DIALECT=postgres" >> .env
echo "DB_PORT=5432" >> .env
echo "DB_USERNAME=postgres" >> .env
echo "DB_PASSWORD=postgrespassword" >> .env

# Start PostgreSQL
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
sleep 5

# Run migrations
npm run db:migrate

# Start application
npm run start:dev
```

## Interview Setup

For interview scenarios:

1. **Check what database is available** on the interview machine
2. **Set the appropriate `DB_DIALECT`** environment variable
3. **Update connection details** if needed (host, port, credentials)
4. **Run migrations** to set up the schema

The application will automatically:
- Use the correct database driver
- Handle dialect-specific differences
- Connect with the right configuration

## Troubleshooting

### Connection Refused

```bash
# Check if database container is running
docker ps | grep -E "mysql|postgres"

# Check if port is available
lsof -i :3306  # MySQL
lsof -i :5432  # PostgreSQL

# Check database logs
docker-compose logs mysql
docker-compose logs postgres
```

### Wrong Database Selected

```bash
# Verify environment variable
echo $DB_DIALECT

# Check application logs for dialect
# Look for: "Database dialect: mysql" or "Database dialect: postgres"
```

### Migration Errors

- Ensure you're using the correct database dialect
- Check that the database exists
- Verify credentials are correct
- For PostgreSQL, ensure the database user has CREATE privileges

## Best Practices

1. **Use environment variables** - Never hardcode database credentials
2. **Use Docker for development** - Consistent environment across team
3. **Test with both databases** - Ensure compatibility before deployment
4. **Document database-specific features** - If you add any database-specific code

