from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.tp069502_posts import router as tp069502_router
from app.routers.tp070007_auth import router as tp070007_router
from app.routers.tp065584_users import router as tp065584_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tp069502_router)
app.include_router(tp070007_router)
app.include_router(tp065584_router)
