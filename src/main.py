from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import random

app = FastAPI()

# Configure CORS to allow communication from the Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/test")
def test_api():
    return {"message": "My name is optimus prime. Leader of the autobots"}

# 1. A list of colours to pick from.
#    These are soft pastel hex codes so the text stays readable.
COLOURS = [
    "#fde8e8",  # soft red
    "#fef3c7",  # soft yellow
    "#d1fae5",  # soft green
    "#dbeafe",  # soft blue
    "#ede9fe",  # soft purple
    "#fce7f3",  # soft pink
    "#ffedd5",  # soft orange
]

# 2. New endpoint — the frontend calls this when the button is clicked.
#    It picks a random colour from the list and sends it back as JSON.
@app.get("/api/colour")
def get_colour():
    chosen = random.choice(COLOURS)
    return {"colour": chosen}
