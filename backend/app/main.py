"""Main FastAPI application."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging import configure_logging
from app.db.database import init_db
from app.api import messages, assessments, alerts, learning, auth
from app.api import community as community_api

# Import all models to ensure relationships are properly registered
# Import in order: student first (base), then others that reference it
from app.models import student
from app.models import assessment
from app.models import analysis
from app.models import learning as learning_models
from app.models import community

# Configure logging
logger = configure_logging(settings.log_level)

# Initialize database
init_db()

# Create FastAPI app
app = FastAPI(
    title="Mental Health Monitoring System",
    description="Comprehensive mental health monitoring with explicit assessment and continuous learning",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",  # Vite dev server
        "http://localhost:3000",  # Common React port
        "http://127.0.0.1:8080",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(messages.router)
app.include_router(assessments.router)
app.include_router(alerts.router)
app.include_router(learning.router)
app.include_router(community_api.router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Mental Health Monitoring System API",
        "version": "1.0.0",
        "status": "operational"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

