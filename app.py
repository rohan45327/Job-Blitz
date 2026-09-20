import sys
import os
import spaces

# Add backend source directory to python path
sys.path.insert(0, os.path.abspath("backend"))

import gradio as gr
from app.main import app as fastapi_app

# Create a minimal Gradio UI wrapper for health check / demo testing
@spaces.GPU
def api_status_check():
    return "🚀 JobBlitz FastAPI Backend is LIVE with Neon PostgreSQL & Open-Source AI Engine!"

demo = gr.Interface(
    fn=api_status_check,
    inputs=[],
    outputs="text",
    title="JobBlitz AI Co-Pilot Backend",
    description="FastAPI Backend running with Gradio + Neon Serverless PostgreSQL"
)

# Mount the complete FastAPI app onto Gradio at root path "/"
app = gr.mount_gradio_app(fastapi_app, demo, path="/gradio")
