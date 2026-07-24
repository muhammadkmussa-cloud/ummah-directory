import json
from app.main import app

with open("/home/muhammad-mussa/.gemini/antigravity-ide/brain/b12bae1b-875b-4081-ba06-19dcc048ee6d/scratch/backend_openapi.json", "w") as f:
    json.dump(app.openapi(), f)
