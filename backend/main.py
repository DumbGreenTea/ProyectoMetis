from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.items import router as items_router
from routers.analytics import router as analytics_router

app = FastAPI(
    title="Metis Backend API",
    description="Backend API for Metis Project",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://10.53.168.29:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(items_router)
app.include_router(analytics_router)

@app.get("/")
async def root():
    return {"message": "Welcome to Metis Backend API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
