"""Main FastAPI application."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from app.core.config import settings
from app.core.logging import configure_logging
from app.db.database import init_db
from app.api import messages, assessments, alerts, learning, auth, students, temporal, outcomes, admin
from app.api import community as community_api
from app.api import journal
from app.tasks.outcome_checker import check_symptom_improvement

# Import all models to ensure relationships are properly registered
# Import in order: student first (base), then others that reference it
from app.models import student
from app.models import assessment
from app.models import analysis
from app.models import learning as learning_models
from app.models import community
from app.models import intervention_outcome

# Configure logging
logger = configure_logging(settings.log_level)

# Initialize scheduler for background tasks
scheduler = BackgroundScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle - startup and shutdown."""
    # Startup: Start the scheduler
    logger.info("Starting background task scheduler...")
    
    # Schedule automated outcome checking - runs daily at 2 AM
    scheduler.add_job(
        check_symptom_improvement,
        CronTrigger(hour=2, minute=0),
        id="outcome_checker",
        name="Daily Symptom Improvement Check",
        replace_existing=True
    )
    
    scheduler.start()
    logger.info("Background scheduler started with outcome_checker job")
    
    yield
    
    # Shutdown: Stop the scheduler
    logger.info("Shutting down background scheduler...")
    scheduler.shutdown(wait=False)
    logger.info("Background scheduler stopped")

# Initialize database
init_db()

# Create FastAPI app with lifespan manager
app = FastAPI(
    title="Mental Health Monitoring System",
    description="Comprehensive mental health monitoring with explicit assessment and continuous learning",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
app.include_router(students.router)
app.include_router(temporal.router)
app.include_router(outcomes.router)
app.include_router(admin.router)
app.include_router(journal.router)


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
