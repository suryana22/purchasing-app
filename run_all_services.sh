#!/bin/bash

# =============================================================================
# Script untuk menjalankan semua service:
# - auth-service (port 8005) - Docker
# - nurse-service (port 8001) - Local
# - user-management (port 8006) - Local
# - frontend-app (port 5173) - Local
# - roomservice-app (gateway port 8000, food, cleaning, patient services) - Docker
# =============================================================================

# Warna untuk output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Starting Essential Services...      ${NC}"
echo -e "${BLUE}========================================${NC}"

# Direktori base
BASE_DIR="/home/suryana/Projects"

# Function untuk cleanup saat script dihentikan
cleanup() {
    echo -e "\n${YELLOW}Stopping services...${NC}"
    
    # Stop local services using PIDs if available, otherwise pkill
    echo -e "${YELLOW}Stopping local processes...${NC}"
    pkill -f "vite" 2>/dev/null
    pkill -f "uvicorn.*8001" 2>/dev/null
    pkill -f "uvicorn.*8006" 2>/dev/null
    
    # Stop Docker Compose services
    echo -e "${YELLOW}Stopping Docker Compose services...${NC}"
    cd "$BASE_DIR/auth-service" && docker-compose down 2>/dev/null
    cd "$BASE_DIR/roomservice-app" && docker-compose down 2>/dev/null
    
    echo -e "${GREEN}Services stopped.${NC}"
    exit 0
}

# Trap CTRL+C
trap cleanup SIGINT SIGTERM

# Buat network jika belum ada
echo -e "\n${GREEN}[0/7] Creating Docker network...${NC}"
docker network create hospital_network 2>/dev/null || true

# 1. Start RoomService via Docker Compose (includes PostgreSQL, gateway, etc)
echo -e "\n${GREEN}[1/7] Starting RoomService Docker Compose (DB, Gateway, Services)...${NC}"
cd "$BASE_DIR/roomservice-app"
docker-compose down --remove-orphans 2>/dev/null
docker rm -f api_gateway hospital_postgres food_service patient_service cleaning_service 2>/dev/null
docker-compose up -d
echo -e "${GREEN}      RoomService Docker Compose started${NC}"

# Wait for PostgreSQL to be ready
echo -e "\n${GREEN}[2/7] Waiting for PostgreSQL to be ready...${NC}"
sleep 5
until docker exec hospital_postgres pg_isready -U hospital_admin -d postgres > /dev/null 2>&1; do
    echo -e "${YELLOW}      Waiting for PostgreSQL...${NC}"
    sleep 2
done
echo -e "${GREEN}      PostgreSQL is ready!${NC}"

# 3. Start Auth Service via Docker Compose
echo -e "\n${GREEN}[3/7] Starting Auth Service (port 8005)...${NC}"
cd "$BASE_DIR/auth-service"
docker-compose down 2>/dev/null
docker rm -f auth_service 2>/dev/null
docker-compose up -d
echo -e "${GREEN}      Auth Service Docker started${NC}"

# 4. Start Nurse Service (locally)
echo -e "\n${GREEN}[4/7] Starting Nurse Service (port 8001)...${NC}"
cd "$BASE_DIR/nurse-service"
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi
export DATABASE_URL="postgresql://hospital_admin:secure_hospital_pass@localhost:5432/nurse_db"
python3 -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload > nurse_service.log 2>&1 &
echo -e "${GREEN}      Nurse Service started (logs: nurse_service.log)${NC}"

# 5. Start User Management Service (locally)
echo -e "\n${GREEN}[5/7] Starting User Management Service (port 8006)...${NC}"
cd "$BASE_DIR/user-management"
if [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d ".venv" ]; then
    source .venv/bin/activate
fi
export DATABASE_URL="postgresql://hospital_admin:secure_hospital_pass@localhost:5432/auth_db"
python3 -m uvicorn main:app --host 0.0.0.0 --port 8006 --reload > user_mgmt.log 2>&1 &
echo -e "${GREEN}      User Management Service started (logs: user_mgmt.log)${NC}"

# 6. Start Frontend App
echo -e "\n${GREEN}[6/7] Starting Frontend App (port 5173)...${NC}"
cd "$BASE_DIR/frontend-app"
npm run dev > frontend.log 2>&1 &
echo -e "${GREEN}      Frontend App started (logs: frontend.log)${NC}"

# 7. Check if services are actually up
echo -e "\n${GREEN}[7/7] Verifying services...${NC}"
sleep 5
SERVICES=(
    "Frontend:5173"
    "Gateway:8000"
    "Nurse:8001"
    "Food:8002"
    "Cleaning:8003"
    "Patient:8004"
    "Auth:8005"
    "UserMgmt:8006"
)

for service in "${SERVICES[@]}"; do
    NAME="${service%%:*}"
    PORT="${service#*:}"
    if nc -z localhost $PORT; then
        echo -e "   [${GREEN}OK${NC}] $NAME is running on port $PORT"
    else
        echo -e "   [${RED}FAIL${NC}] $NAME is NOT running on port $PORT"
    fi
done

# Tampilkan informasi akses
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}   Essential Services Running!         ${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e ""
echo -e "   ${GREEN}Main Access Point:${NC}   http://localhost:5173"
echo -e "   ${GREEN}API Gateway:${NC}         http://localhost:8000"
echo -e ""
echo -e "${YELLOW}Note: Services are running in background.${NC}"
echo -e "${YELLOW}Check .log files in each directory for details.${NC}"
echo -e "${BLUE}========================================${NC}"

# Keep script running to allow CTRL+C cleanup
wait
