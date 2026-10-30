# Backend integration

Install in the existing backend virtual environment:
    pip install fastapi uvicorn numpy pydantic

Copy anti_noise_engine.py and anti_noise_router.py into the same Python package/directory as your FastAPI main.py.

In your existing main.py, after creating `app = FastAPI(...)`, add:
    from anti_noise_router import router as noise_challenge_router
    app.include_router(noise_challenge_router)

Do not replace your existing main.py or routers.

Run your existing FastAPI server, for example:
    uvicorn main:app --reload

Check:
    GET  http://127.0.0.1:8000/api/noise-challenge/health
    POST http://127.0.0.1:8000/api/noise-challenge/evaluate

See sample_request.json for the POST body.
