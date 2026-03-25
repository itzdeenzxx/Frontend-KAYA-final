FROM python:3.11-slim

WORKDIR /app

# คัดลอกเฉพาะไฟล์ requirements
COPY fastapi_service/requirements.txt ./requirements.txt

# อัปเดตและติดตั้งไลบรารี
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir tensorflow-cpu

# คัดลอกเฉพาะโฟลเดอร์ Backend และ Models
COPY fastapi_service/ ./fastapi_service/
COPY models/ ./models/

# ตั้งค่าพอร์ต
EXPOSE 8000

# รัน FastAPI โดยรับค่า PORT จากสภาพแวดล้อม (Railway จะจอง Port มาให้)
CMD ["sh", "-c", "uvicorn fastapi_service.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
