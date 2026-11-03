# Start from a Python base image
FROM python:3.10

WORKDIR /app

# Install dependencies first so they are cached between code changes
COPY setup.py .
RUN pip install --no-cache-dir .

# Copy the backend source; it is imported as the `backend` package from /app
COPY backend/ ./backend/

EXPOSE 8000
CMD ["uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "8000"]
