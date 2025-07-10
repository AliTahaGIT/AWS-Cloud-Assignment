from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://admin:password@localhost:5432/cloud60_admin"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Admin RDS Models
class AdminLog(Base):
    """Store admin activity logs in RDS for audit trail"""
    __tablename__ = "admin_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False)  # CREATE, UPDATE, DELETE, READ
    resource_type = Column(String(50), nullable=False)  # notification, contact, config
    resource_id = Column(String(100), nullable=True)
    details = Column(JSON, nullable=True)  # Store additional details as JSON
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

class SystemMetrics(Base):
    """Store system performance metrics in RDS"""
    __tablename__ = "system_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    metric_name = Column(String(100), nullable=False)
    metric_value = Column(String(255), nullable=False)
    metric_type = Column(String(50), default="counter")  # counter, gauge, histogram
    tags = Column(JSON, nullable=True)  # Store tags as JSON
    recorded_at = Column(DateTime, default=datetime.utcnow)


# Database session dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create all tables
def create_tables():
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    create_tables()
    print("RDS tables created successfully!")