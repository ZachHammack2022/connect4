import psycopg2

# Database connection parameters
db_params = {
    "dbname": "mydatabase",
    "user": "user",
    "password": "password",
    "host": "localhost",  # Adjust if the DB is hosted elsewhere
    "port": 5432  # Default port for PostgreSQL
}

# Attempting to connect to the database
try:
    conn = psycopg2.connect(**db_params)
    print("Connection successful")
except Exception as e:
    print(f"Connection failed: {e}")
finally:
    if conn:
        conn.close()
