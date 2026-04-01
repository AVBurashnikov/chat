"""
FastAPI application setup and configuration.
"""

import logging
import os
from sys import prefix

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi.responses import JSONResponse

from db import Base, engine, run_sqlite_migrations, check_db_connection
from routers import auth as auth_router
from routers import chats as chats_router
from routers import ws as ws_router
from config import settings, setup_logging, app_logger

# Setup logging
setup_logging()

# Initialize database
Base.metadata.create_all(bind=engine)
run_sqlite_migrations()

# Initialize FastAPI app
app = FastAPI(
    title="Mini Telegram Clone - Secure Version",
    version="1.0.0",
    debug=settings.debug
)

# Setup rate limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    """Handle rate limit exceeded errors."""
    app_logger.warning(
        f"Rate limit exceeded for {request.client.host}: {exc.detail}"
    )
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Please try again later."}
    )


# Add CORS middleware with strict configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "PUT"],
    allow_headers=["Content-Type", "Authorization"],
    max_age=3600,
)


# Add security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add security headers to all responses."""
    response = await call_next(request)

    # Prevent MIME type sniffing
    response.headers["X-Content-Type-Options"] = "nosniff"

    # Enable XSS protection
    response.headers["X-XSS-Protection"] = "1; mode=block"

    # Prevent clickjacking
    response.headers["X-Frame-Options"] = "DENY"

    # Strict Transport Security (use only in production with HTTPS)
    if settings.environment == "production":
        response.headers["Strict-Transport-Security"] = \
            "max-age=31536000; includeSubDomains"

    # Content Security Policy
    response.headers["Content-Security-Policy"] = \
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"

    return response


# Register routers
app.include_router(auth_router.router)
app.include_router(chats_router.router)
app.include_router(ws_router.router)


@app.get("/")
def read_root():
    """Health check endpoint."""
    return {"status": "ok"}


@app.get("/health")
def health_check():
    """Detailed health check endpoint."""
    db_status = check_db_connection()
    return {
        "status": "ok" if db_status else "error",
        "database": "connected" if db_status else "disconnected"
    }


# Startup event
@app.on_event("startup")
async def startup_event():
    """Run on application startup."""
    app_logger.info("Application starting up")
    if not check_db_connection():
        app_logger.error("Failed to connect to database on startup")
    else:
        app_logger.info("Database connection established")


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown."""
    app_logger.info("Application shutting down")


if __name__ == "__main__":
    import uvicorn

    # Setup SSL for production
    ssl_kwargs = {}
    if settings.environment == "production":
        ssl_kwargs = {
            "ssl_keyfile": "key.pem",
            "ssl_certfile": "cert.pem"
        }

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level=settings.log_level.lower(),
        **ssl_kwargs
    )