#!/bin/bash
# install.sh - install all dependencies

set -e

# Load environment variables from root .env
export $(grep -v '^#' .env | xargs)

cd mainepadfinder-app

# --- Setup Python virtual environment for backend ---
echo "Setting up Python virtual environment for backend..."
cd backend
py venv venv

# Activate venv
source venv/Scripts/activate

# Install backend dependencies inside venv
echo "Installing backend dependencies..."
# pip install --upgrade pip
pip install -r requirements.txt

# Deactivate venv
deactivate
cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Return to root
cd ..


# --- Install mkcert if not found ---
if ! command -v mkcert >/dev/null 2>&1; then
    echo "mkcert not found. Installing mkcert..."
    
    # Check if Chocolatey is installed
    if command -v choco >/dev/null 2>&1; then
        choco install mkcert -y
    else
        echo "Chocolatey not found. Please install it first: https://chocolatey.org/install"
        exit 1
    fi
else
    echo "mkcert already installed."
fi


CERT_DIR="./certs"
mkdir -p "$CERT_DIR"
cd certs

# --- Install local CA ---
mkcert -install

# --- Generate certificates ---
echo "Generating local HTTPS certificates for localhost and 127.0.0.1..."
mkcert -cert-file "frontend.crt" -key-file "frontend.key" localhost 127.0.0.1
mkcert -cert-file "backend.crt" -key-file "backend.key" localhost 127.0.0.1
mkcert -cert-file "database.crt" -key-file "database.key" localhost 127.0.0.1

echo "Certificates generated at $CERT_DIR"
cd ..



# --- Install MySQL if not found ---
if ! command -v mysql >/dev/null 2>&1; then
    echo "Installing MySQL..."
    choco install mysql -y
else
    echo "MySQL already installed."
fi

# Start MySQL service
echo "Starting MySQL service..."
net start MySQL80 || echo "MySQL service already running"

mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" < "./SQL/Database Operations/CREATE_DATABASE.sql"
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -D "$DB_NAME" < "./SQL/Database Operations/ALL_TABLE.sql"
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -D "$DB_NAME" < "./SQL/Database Operations/ADD_INDEXES.sql"
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -D "$DB_NAME" < "./SQL/Database Operations/ADD_STORED.sql"

py "./Web Scraping/Sample Data/add_property.py"
echo "CSV import completed successfully."