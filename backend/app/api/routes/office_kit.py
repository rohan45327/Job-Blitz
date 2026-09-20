from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
import time

router = APIRouter(prefix="/office-kit", tags=["Office Kit Device Bridge"])

class ClipboardSyncPayload(BaseModel):
    device_id: str = "iqoo-loaner-402"
    source_platform: str = "laptop"
    copied_content: str
    content_type: str = "url"

class FileTransferPayload(BaseModel):
    device_id: str = "iqoo-loaner-402"
    file_name: str
    file_type: str = "pdf"
    file_size_bytes: int

@router.get("/status")
def get_office_kit_status():
    return {
        "paired": True,
        "device_model": "iQOO Flagship Loaner",
        "bridge_protocol": "Snapdragon Low-Latency Mesh",
        "npu_accelerated": True,
        "active_features": ["clipboard_sync", "file_bridge", "screen_mirror", "remote_pitch"],
        "latency_ms": 1.4
    }

@router.post("/clipboard/sync")
def sync_clipboard(payload: ClipboardSyncPayload):
    return {
        "status": "synced",
        "timestamp": time.time(),
        "received_from": payload.source_platform,
        "processed_url": payload.copied_content if "http" in payload.copied_content else None,
        "message": "Copied content auto-injected into JobBlitz match pipeline."
    }

@router.post("/file/transfer")
def transfer_file(payload: FileTransferPayload):
    return {
        "status": "completed",
        "file_name": payload.file_name,
        "size_kb": payload.file_size_bytes / 1024,
        "delivered_to": "Connected Laptop Desktop",
        "checksum_verified": True
    }
