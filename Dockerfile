# Stage 1: Build the React frontend
FROM node:20-alpine as frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build the FastAPI backend
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies required for psycopg2 (PostgreSQL)
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend/ ./backend/
COPY run.py .

# Copy the built frontend from Stage 1 into the expected directory
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Expose the port FastAPI runs on
EXPOSE 8000

# Run a custom startup script or use uvicorn directly.
# We will just run uvicorn. In production, we don't use --reload.
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
