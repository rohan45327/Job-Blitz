import sys
import os

# Ensure the backend directory is in the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv

# Ensure environment variables are loaded from .env
load_dotenv()

# Fallback to env variable
if "DATABASE_URL" not in os.environ:
    raise ValueError("DATABASE_URL environment variable is not set. Please set it in your .env file.")

print("Triggering real ingestion via RemoteOK, Internshala, and ATS Adapters...")
run_ingestion()
print("Ingestion complete!")
