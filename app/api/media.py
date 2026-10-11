import os
import hashlib
import json
import logging
from pathlib import Path
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException, Query, Response
from fastapi.responses import FileResponse

from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/media", tags=["Media"])

MEDIA_CACHE_DIR = Path("/app/data/media_cache")


def get_cache_paths(file_id: str) -> tuple[Path, Path, Path]:
    digest = hashlib.sha256(file_id.encode()).hexdigest()
    bin_path = MEDIA_CACHE_DIR / f"{digest}.bin"
    meta_path = MEDIA_CACHE_DIR / f"{digest}.json"
    mp3_path = MEDIA_CACHE_DIR / f"{digest}.mp3"
    return bin_path, meta_path, mp3_path


def detect_mime(content: bytes, default: str = "application/octet-stream") -> str:
    if content.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if content.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if content.startswith(b"GIF8"):
        return "image/gif"
    if content.startswith(b"RIFF") and b"WEBP" in content[:16]:
        return "image/webp"
    if content.startswith(b"OggS"):
        return "audio/ogg"
    if content.startswith(b"ID3") or content[:2] == b"\xff\xfb":
        return "audio/mpeg"
    if len(content) > 12 and content[4:8] == b"ftyp":
        return "video/mp4"
    return default


@router.get("")
async def get_telegram_media(
    file_id: str = Query(..., description="Telegram file_id"),
    kind: Optional[str] = Query(None, description="Media kind: photo, voice, video, document")
):
    """
    Serves Telegram media files by file_id:
    1. Checks local cache in /app/data/media_cache
    2. If not cached, fetches via Telegram Bot API and saves to cache
    3. Returns binary stream with proper MIME type and cache headers
    """
    if not file_id:
        raise HTTPException(status_code=400, detail="file_id is required")

    MEDIA_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    bin_path, meta_path, mp3_path = get_cache_paths(file_id)

    # 1. For audio/voice, prefer already transcoded .mp3 if available
    if kind in ("voice", "audio") and mp3_path.exists():
        return FileResponse(
            path=str(mp3_path),
            media_type="audio/mpeg",
            headers={"Cache-Control": "public, max-age=31536000, immutable"}
        )

    # 2. Check if .bin is cached locally
    if bin_path.exists():
        media_type = "application/octet-stream"
        if meta_path.exists():
            try:
                meta = json.loads(meta_path.read_text(encoding="utf-8"))
                media_type = meta.get("media_type") or media_type
            except Exception:
                pass

        if media_type == "application/octet-stream" or not media_type:
            try:
                header = bin_path.read_bytes()[:32]
                media_type = detect_mime(header, "image/jpeg" if kind == "photo" else "application/octet-stream")
            except Exception:
                media_type = "image/jpeg" if kind == "photo" else "application/octet-stream"

        return FileResponse(
            path=str(bin_path),
            media_type=media_type,
            headers={"Cache-Control": "public, max-age=31536000, immutable"}
        )

    # 3. Not in cache: fetch on the fly from Telegram Bot API
    token = settings.TELEGRAM_BOT_TOKEN
    if not token:
        raise HTTPException(status_code=500, detail="TELEGRAM_BOT_TOKEN is not configured")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Step A: getFile
            info_res = await client.get(f"https://api.telegram.org/bot{token}/getFile", params={"file_id": file_id})
            if info_res.status_code != 200:
                raise HTTPException(status_code=404, detail="File info not found in Telegram")

            data = info_res.json()
            if not data.get("ok"):
                raise HTTPException(status_code=404, detail=data.get("description", "Telegram error"))

            file_path = data.get("result", {}).get("file_path")
            if not file_path:
                raise HTTPException(status_code=404, detail="file_path not returned by Telegram")

            # Step B: download binary file
            dl_res = await client.get(f"https://api.telegram.org/file/bot{token}/{file_path}")
            if dl_res.status_code != 200:
                raise HTTPException(status_code=502, detail="Failed to download file from Telegram server")

            content = dl_res.content
            detected_type = dl_res.headers.get("content-type", "").split(";")[0].strip()
            if not detected_type or detected_type == "application/octet-stream":
                detected_type = detect_mime(content, "image/jpeg" if kind == "photo" else "application/octet-stream")

            # Save to local cache
            bin_path.write_bytes(content)
            meta_path.write_text(json.dumps({"media_type": detected_type}), encoding="utf-8")
            logger.info(f"[Media Cache] Cached new file_id={file_id[:16]}... as {detected_type} ({len(content)} bytes)")

            return Response(
                content=content,
                media_type=detected_type,
                headers={"Cache-Control": "public, max-age=31536000, immutable"}
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Media Cache] Error downloading Telegram media for {file_id}: {e}")
        raise HTTPException(status_code=502, detail=f"Error downloading file: {e}")
