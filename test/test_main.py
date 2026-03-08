from src.main import app
from fastapi.testclient import TestClient

client = TestClient(app)

def test_root():
    r = client.get("/")
    assert r.status_code == 200
    assert r.json() == {"message": "Hello, World!"}