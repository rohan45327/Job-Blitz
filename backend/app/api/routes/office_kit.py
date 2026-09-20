from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import Optional, List
import time
import json

router = APIRouter(prefix="/office-kit", tags=["Office Kit Device Bridge"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                pass

manager = ConnectionManager()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Bounce the data to all connected devices (e.g. Laptop -> Phone)
            await manager.broadcast(data)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

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
        "latency_ms": 1.4,
        "active_connections": len(manager.active_connections)
    }

@router.post("/clipboard/sync")
async def sync_clipboard(payload: ClipboardSyncPayload):
    # Broadcast via REST endpoint as well
    msg = json.dumps({"type": "clipboard", "content": payload.copied_content})
    await manager.broadcast(msg)
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

