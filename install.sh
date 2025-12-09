#!/bin/bash
# install.sh - install all dependencies

set -e

# Load environment variables from root .env
export $(grep -v '^#' .env | xargs)

cd mainepadfinder-app

# --- Setup Python virtual environment for backend ---
echo "Setting up Python virtual environment for backend..."
cd backend
py -m venv venv

# Activate venv
source venv/Scripts/activate

# Install backend dependencies inside venv
echo "Installing backend dependencies..."
# pip install --upgrade pip
pip install -r requirements.txt

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
CAROOT="." mkcert -install

powershell.exe -Command \
    "Import-Certificate -FilePath './rootCA.pem' -CertStoreLocation Cert:\LocalMachine\Root | Out-Null"

# --- Generate certificates ---
echo "Generating local HTTPS certificates for localhost and 127.0.0.1..."
CAROOT="." mkcert -cert-file "frontend.crt" -key-file "frontend.key" localhost 127.0.0.1
CAROOT="." mkcert -cert-file "backend.crt" -key-file "backend.key" localhost 127.0.0.1
CAROOT="." mkcert -cert-file "database.crt" -key-file "database.key" localhost 127.0.0.1

for f in frontend.crt backend.crt database.crt; do
    powershell.exe -Command "Import-Certificate -FilePath './$f' -CertStoreLocation Cert:\LocalMachine\Root | Out-Null"
done

echo "Certificates generated at $CERT_DIR, CA installed, Certs installed"
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

MySQL -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" < "./SQL/Database Operations/CREATE_DATABASE.sql"
MySQL -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -D "$DB_NAME" < "./SQL/Database Operations/ALL_TABLE.sql"
MySQL -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -D "$DB_NAME" < "./SQL/Database Operations/ADD_INDEXES.sql"
MySQL -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -D "$DB_NAME" < "./SQL/Database Operations/ADD_STORED.sql"

py "./Web Scraping/add_properties.py"
echo "CSV import completed successfully."

# Deactivate venv
cd mainepadfinder-app/backend
deactivate
cd ../..