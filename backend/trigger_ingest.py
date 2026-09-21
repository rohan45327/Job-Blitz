import sys
import os

# Ensure the backend directory is in the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set DB URL
os.environ["DATABASE_URL"] = "postgresql://job-db_owner:npg_WB9vQhgzTi2N@ep-young-cell-aze0ma36-pooler.c-3.ap-southeast-1.aws.neon.tech/job-db?sslmode=require"

from app.worker.tasks import run_ingestion
from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv()

print("Triggering real ingestion via RemoteOK, Internshala, and ATS Adapters...")
run_ingestion()
print("Ingestion complete!")
