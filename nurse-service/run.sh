#!/bin/bash
# Script untuk menjalankan Nurse Call Service

echo "🏥 Starting Nurse Call Service..."

# Check if running in Docker or local
if [ "$1" == "docker" ]; then
    echo "📦 Running in Docker mode..."
    
    # Build the image if it doesn't exist or rebuild flag is set
    if [ "$2" == "--rebuild" ] || [ -z "$(docker images -q nurse-service 2>/dev/null)" ]; then
        echo "🔨 Building Docker image..."
        docker build -t nurse-service .
    fi
    
    # Stop existing container if running
    docker stop nurse-call-service 2>/dev/null
    docker rm nurse-call-service 2>/dev/null
    
    # Run the container
    docker run -d \
        --name nurse-call-service \
        --network host \
        -e DB_HOST=localhost \
        -e DB_PORT=5432 \
        -e DB_USER=sysadmin_smartcall \
        -e DB_PASSWORD=sys4dm1n_Sm4rTtCaLL@26 \
        -e DB_NAME=nurse_db \
        -p 8001:8001 \
        nurse-service
    
    echo "✅ Nurse Call Service started on http://localhost:8001"
    echo "📖 Swagger UI: http://localhost:8001/docs"
    echo ""
    echo "To view logs: docker logs -f nurse-call-service"

else
    echo "🐍 Running in local Python mode..."
    
    # Activate virtual environment if exists
    if [ -d ".venv" ]; then
        source .venv/bin/activate
        echo "✅ Virtual environment activated"
    fi
    
    # Install dependencies if needed
    if ! python3 -c "import fastapi" 2>/dev/null; then
        echo "📦 Installing dependencies..."
        pip install -r requirements.txt
    fi
    
    # Set environment variables
    export DB_HOST=localhost
    export DB_PORT=5432
    export DB_USER=hospital_admin
    export DB_PASSWORD=secure_hospital_pass
    export DB_NAME=nurse_db
    
    echo "🚀 Starting server on http://localhost:8001"
    echo "📖 Swagger UI: http://localhost:8001/docs"
    echo ""
    
    # Run the application
    python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8001
fi
