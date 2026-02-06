# Nurse Call Service (Smart Call System)

Database-nya terpisah dan dirancang untuk integrasi dengan perangkat IoT ESP32.

## Database Configuration
- **Database**: `nurse_call_db`
- **User**: `sysadmin_smartcall`
- **Password**: `sys4dm1n_Sm4rTtCaLL@26`
- **Port**: `5432`

## Tables
1. `nurse_stations` - Pos perawat
2. `rooms` - Kamar/bed pasien
3. `patients` - Data pasien
4. `discharge_requests` - Permintaan pulang
5. `log_calls` - Log panggilan darurat

## Running
```bash
# Via Docker
docker build -t nurse-service .
docker run -p 8001:8001 -e DB_HOST=host.docker.internal nurse-service

# Local (jika ada pip)
pip install -r requirements.txt
python3 -m uvicorn main:app --reload --port 8001
```

## API Docs
Akses Swagger UI: `http://localhost:8001/docs`

## IoT Endpoints
- `POST /iot/call?room_number=301&bed_number=A` - Trigger panggilan dari ESP32
- `POST /iot/reset?room_number=301&bed_number=A` - Reset panggilan dari ESP32
