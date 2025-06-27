#!/bin/bash

# Development Database Management Script for QuizAI

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
}

# Start the database
start_db() {
    print_status "Starting PostgreSQL development database..."
    docker-compose -f docker-compose.dev.yml up -d postgres
    
    print_status "Waiting for database to be ready..."
    sleep 10
    
    # Check if database is ready
    if docker-compose -f docker-compose.dev.yml exec postgres pg_isready -U quizai_user -d quizai_dev > /dev/null 2>&1; then
        print_success "Database is ready!"
        print_status "Database URL: postgresql://quizai_user:quizai_dev_password@localhost:5434/quizai_dev"
    else
        print_warning "Database might still be starting up. Please wait a moment and try connecting."
    fi
}

# Stop the database
stop_db() {
    print_status "Stopping PostgreSQL development database..."
    docker-compose -f docker-compose.dev.yml down
    print_success "Database stopped."
}

# Reset the database (stops, removes containers and volumes, then starts fresh)
reset_db() {
    print_warning "This will destroy all data in the development database!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Resetting database..."
        docker-compose -f docker-compose.dev.yml down -v
        docker-compose -f docker-compose.dev.yml up -d postgres
        sleep 10
        print_success "Database reset complete!"
    else
        print_status "Reset cancelled."
    fi
}

# Show database logs
logs_db() {
    docker-compose -f docker-compose.dev.yml logs -f postgres
}

# Connect to database
connect_db() {
    print_status "Connecting to database..."
    docker-compose -f docker-compose.dev.yml exec postgres psql -U quizai_user -d quizai_dev
}

# Start PgAdmin
start_pgadmin() {
    print_status "Starting PgAdmin..."
    docker-compose -f docker-compose.dev.yml up -d pgadmin
    sleep 5
    print_success "PgAdmin is starting up!"
    print_status "Access PgAdmin at: http://localhost:5050"
    print_status "Email: admin@quizai.local"
    print_status "Password: admin123"
    print_status "To connect to database in PgAdmin:"
    print_status "  Host: postgres"
    print_status "  Port: 5432"
    print_status "  Database: quizai_dev"
    print_status "  Username: quizai_user"
    print_status "  Password: quizai_dev_password"
}

# Show status
status_db() {
    print_status "Database container status:"
    docker-compose -f docker-compose.dev.yml ps
    
    print_status "Database connection test:"
    if docker-compose -f docker-compose.dev.yml exec postgres pg_isready -U quizai_user -d quizai_dev > /dev/null 2>&1; then
        print_success "Database is ready and accepting connections"
    else
        print_warning "Database is not ready or not running"
    fi
}

# Show help
show_help() {
    echo "QuizAI Development Database Management"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  start     Start the PostgreSQL database"
    echo "  stop      Stop the PostgreSQL database"
    echo "  restart   Restart the PostgreSQL database"
    echo "  reset     Reset database (destroys all data)"
    echo "  logs      Show database logs"
    echo "  connect   Connect to database via psql"
    echo "  pgadmin   Start PgAdmin web interface"
    echo "  status    Show database status"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start"
    echo "  $0 reset"
    echo "  $0 connect"
}

# Main script logic
check_docker

case "${1:-help}" in
    start)
        start_db
        ;;
    stop)
        stop_db
        ;;
    restart)
        stop_db
        sleep 2
        start_db
        ;;
    reset)
        reset_db
        ;;
    logs)
        logs_db
        ;;
    connect)
        connect_db
        ;;
    psql)
        connect_db
        ;;
    pgadmin)
        start_pgadmin
        ;;
    status)
        status_db
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac