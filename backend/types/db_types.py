from fastapi import FastAPI
from pydantic import BaseModel
from databases import Database
from pydantic import BaseModel

class GameResult(BaseModel):
    username: str
    won: bool

    
class AppLifespan:
    def __init__(self, app: FastAPI, db: Database):
        self.app = app
        self.db = db
        self.app.add_event_handler("startup", self.startup)
        self.app.add_event_handler("shutdown", self.shutdown)

    async def startup(self):
        await self.db.connect()

    async def shutdown(self):
        await self.db.disconnect()
