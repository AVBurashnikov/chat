from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db import Base, engine, run_sqlite_migrations
from routers import auth as auth_router
from routers import chats as chats_router
from routers import ws as ws_router

Base.metadata.create_all(bind=engine)
run_sqlite_migrations()

app = FastAPI(title="Mini Telegram Clone")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(chats_router.router)
app.include_router(ws_router.router)


@app.get("/")
def read_root():
    return {"status": "ok"}
