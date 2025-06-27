# Database Setup

## Development Database

This project uses PostgreSQL with Docker Compose for local development.

### Quick Start

```bash
# Start the database
./scripts/dev-db.sh start

# Check status
./scripts/dev-db.sh status

# Connect to database
./scripts/dev-db.sh connect

# Stop the database
./scripts/dev-db.sh stop
```

### Database Details

- **Host**: localhost
- **Port**: 5434 (to avoid conflicts with default PostgreSQL)
- **Database**: quizai_dev
- **Username**: quizai_user
- **Password**: quizai_dev_password
- **URL**: `postgresql://quizai_user:quizai_dev_password@localhost:5434/quizai_dev`

### Test User

A test user is automatically created:
- **Email**: test@quizai.nl
- **Password**: password123

### Available Commands

```bash
# Database management
./scripts/dev-db.sh start     # Start PostgreSQL
./scripts/dev-db.sh stop      # Stop PostgreSQL  
./scripts/dev-db.sh restart   # Restart PostgreSQL
./scripts/dev-db.sh reset     # Reset database (destroys data)
./scripts/dev-db.sh logs      # Show database logs
./scripts/dev-db.sh connect   # Connect via psql
./scripts/dev-db.sh status    # Show status

# Optional: Web interface
./scripts/dev-db.sh pgadmin   # Start PgAdmin at http://localhost:5050
```

### Database Schema

#### Users Table
- `id` (UUID, Primary Key)
- `email` (VARCHAR, Unique)
- `password_hash` (VARCHAR)
- `first_name`, `last_name` (VARCHAR)
- `is_verified`, `is_active` (BOOLEAN)
- `created_at`, `updated_at`, `last_login_at` (TIMESTAMP)

#### User Sessions Table
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `token_hash`, `refresh_token_hash` (VARCHAR)
- `expires_at` (TIMESTAMP)
- `user_agent`, `ip_address` (TEXT, INET)

#### Quizzes Table (Enhanced)
- `id` (UUID, Primary Key)
- `magic_link` (VARCHAR, Unique)
- `title`, `description` (VARCHAR, TEXT)
- `user_id` (UUID, Foreign Key) - Quiz ownership
- `source_filename` (VARCHAR)
- `total_questions`, `total_pages` (INTEGER)
- `language`, `difficulty` (VARCHAR)
- `quiz_data` (JSONB) - Quiz content
- `metadata` (JSONB) - Additional data
- `is_public` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMP)

#### Quiz Attempts Table
- `id` (UUID, Primary Key)
- `quiz_id` (UUID, Foreign Key)
- `user_id` (UUID, Foreign Key) - Nullable for anonymous
- `session_id` (VARCHAR) - For anonymous users
- `score`, `max_score` (INTEGER)
- `answers` (JSONB)
- `completed_at`, `started_at` (TIMESTAMP)
- `time_spent` (INTEGER) - Seconds

### Extensions Enabled

- `uuid-ossp` - UUID generation
- `pgcrypto` - Password hashing

### Indexes

Performance indexes are created for:
- User email lookups
- Session management
- Quiz ownership queries
- Quiz attempts tracking

### Environment Variables

Copy `.env.development` and configure:

```env
DATABASE_URL="postgresql://quizai_user:quizai_dev_password@localhost:5434/quizai_dev"
DATABASE_HOST=localhost
DATABASE_PORT=5434
DATABASE_USERNAME=quizai_user
DATABASE_PASSWORD=quizai_dev_password
DATABASE_NAME=quizai_dev
```

### Troubleshooting

**Port already in use?**
Change the port in `docker-compose.dev.yml` and `.env.development`

**Database not starting?**
```bash
./scripts/dev-db.sh logs  # Check logs
./scripts/dev-db.sh reset # Reset if needed
```

**Connection issues?**
```bash
./scripts/dev-db.sh status # Check if running
docker ps                  # Check containers
```

### Production Notes

- This setup is for **development only**
- Use proper secrets management in production
- Configure SSL/TLS for production databases
- Set up proper backup strategies
- Use connection pooling for production loads