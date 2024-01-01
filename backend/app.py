from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import game_routes, db_routes
from backend.dependencies import database # lifespan
from backend.types.db_types import AppLifespan

app = FastAPI()
lifespan = AppLifespan(app, database)


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

# Lifespan events for database connection
app.add_event_handler("startup", lifespan.startup)
app.add_event_handler("shutdown", lifespan.shutdown)
