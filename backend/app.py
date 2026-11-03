from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import game_routes, db_routes
from backend.dependencies import get_database
from backend.db import ensure_schema
from backend.game_store import ensure_game_schema

database = get_database()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Connect to the database on startup and disconnect on shutdown.
    await database.connect()
    await ensure_schema(database)
    await ensure_game_schema(database)
    try:
        yield
    finally:
        await database.disconnect()


app = FastAPI(lifespan=lifespan)

# Add middleware configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins, for development only
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Include routers
app.include_router(game_routes.router)
app.include_router(db_routes.router)
