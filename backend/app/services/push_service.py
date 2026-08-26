"""
Push Notification Service — wraps Firebase Cloud Messaging (FCM).
"""
from __future__ import annotations
import logging
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

FCM_ENDPOINT = "https://fcm.googleapis.com/fcm/send"


class PushService:
    def send(self, token: str, title: str, body: str, data: dict | None = None):
        if not settings.FCM_SERVER_KEY:
            logger.warning("FCM_SERVER_KEY not set — skipping push notification")
            return

        payload = {
            "to": token,
            "notification": {
                "title": title,
                "body": body,
                "sound": "default",
            },
            "data": data or {},
        }
        headers = {
            "Authorization": f"key={settings.FCM_SERVER_KEY}",
            "Content-Type": "application/json",
        }
        try:
            resp = httpx.post(FCM_ENDPOINT, json=payload, headers=headers, timeout=10)
            resp.raise_for_status()
            logger.info(f"Push sent to token ...{token[-6:]}: {title}")
        except Exception as e:
            logger.error(f"Push failed: {e}")
