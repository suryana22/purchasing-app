#!/bin/bash

# ==========================================================================
# SCRIPT INSTALLASI PURCHASING APP (SERVER PRODUCTION)
# ==========================================================================

# 1. Update System
echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# 2. Install Dependency Dasar
echo "Installing base dependencies..."
sudo apt install -y curl git build-essential

# 3. Install Docker (Jika belum ada)
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
else
    echo "Docker already installed."
fi

# 4. Install Docker Compose
echo "Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 5. Install Node.js & NVM (Untuk maintenance/troubleshooting lokal)
if ! command -v nvm &> /dev/null; then
    echo "Installing NVM & Node.js..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    nvm install 20
else
    echo "NVM/Node already installed."
fi

# 6. Setup Environment Variables Template
echo "Setting up .env template..."
PROJECT_ROOT=$(pwd)

# Fungsi untuk membuat .env jika belum ada
create_env_template() {
    local target_dir=$1
    if [ ! -f "$target_dir/.env" ]; then
        echo "Creating .env template in $target_dir"
        cat <<EOT > "$target_dir/.env"
# Database Configuration
DB_HOST=purchasing_db
DB_USER=postgres
DB_PASSWORD=Suryana@130221
DB_NAME=purchasing_db
DB_PORT=5432

# Security
JWT_SECRET=purchasing_app_secret_key_2024

# Server Config
PORT=4000
EOT
    fi
}

# Buat env untuk setiap service
create_env_template "$PROJECT_ROOT/master-data-service"
create_env_template "$PROJECT_ROOT/purchasing-service"

# Khusus Frontend .env
if [ ! -f "$PROJECT_ROOT/purchasing-app/frontend/.env.local" ]; then
    cat <<EOT > "$PROJECT_ROOT/purchasing-app/frontend/.env.local"
NEXT_PUBLIC_MASTER_DATA_API=http://localhost:4001
NEXT_PUBLIC_PURCHASING_API=http://localhost:4002
EOT
fi

echo "=========================================================================="
echo "INSTALLASI SELESAI!"
echo "=========================================================================="
echo "Langkah berikutnya:"
echo "1. Sesuaikan file .env di setiap folder service jika diperlukan."
echo "2. Masuk ke folder: cd purchasing-app"
echo "3. Jalankan aplikasi: docker-compose up -d --build"
echo "=========================================================================="
