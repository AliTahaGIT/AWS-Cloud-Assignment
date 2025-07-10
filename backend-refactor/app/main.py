from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.tp069502_posts import router as tp069502_router
from app.routers.tp070007_auth import router as tp070007_router
from app.routers.tp065584_users import router as tp065584_router
from app.routers.tp070572_admin import router as tp_admin_router

app = FastAPI(
    title="Cloud60 Flood Management System",
    description="Backend API for flood management and emergency response system",
    version="1.0.0"
)

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
app.include_router(tp_admin_router)
