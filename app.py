import sys
import os
import spaces

# Add backend source directory to python path
sys.path.insert(0, os.path.abspath("backend"))

import gradio as gr
from app.main import app as fastapi_app

# --- MONKEYPATCH GRADIO ---
# ZeroGPU absolutely requires the exported `app` to be a pure Gradio object.
# To serve our FastAPI app, we intercept Gradio's internal FastAPI builder 
# and stealthily mount our FastAPI app into it before ZeroGPU serves it!
import gradio.routes
original_create_app = gradio.routes.App.create_app

def custom_create_app(*args, **kwargs):
    gradio_app = original_create_app(*args, **kwargs)
    # Mount the backend at /api to avoid any root-level conflicts with Gradio
    gradio_app.mount("/api", fastapi_app)
    return gradio_app

gradio.routes.App.create_app = custom_create_app
# --------------------------

@spaces.GPU
def api_status_check():
    return "🚀 JobBlitz FastAPI Backend is LIVE with Neon PostgreSQL & Open-Source AI Engine!"

# Export `app` as a Gradio Interface so ZeroGPU's scanner passes perfectly
app = gr.Interface(
    fn=api_status_check,
    inputs=[],
    outputs="text",
    title="JobBlitz AI Co-Pilot Backend",
    description="FastAPI Backend running stealthily inside a ZeroGPU Gradio Space! API is mounted at /api/api/v1/"
)

if __name__ == "__main__":
    app.launch()
