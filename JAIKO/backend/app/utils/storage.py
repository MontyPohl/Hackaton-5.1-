"""
Supabase Storage helper for uploading images.
Usage:
    from app.utils.storage import upload_image
    url = upload_image(file_bytes, filename, folder='profiles')
"""
import os
from supabase import create_client, Client

_client: Client | None = None


def _get_client() -> Client:
    global _client
    if _client is None:
        url  = os.environ.get("SUPABASE_URL")
        key  = os.environ.get("SUPABASE_KEY")
        if not url or not key:
            raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set")
        _client = create_client(url, key)
    return _client


def upload_image(file_bytes: bytes, filename: str, folder: str = "general") -> str:
    """
    Upload bytes to Supabase Storage and return the public URL.
    folder: 'profiles' | 'listings' | 'verification' | 'general'
    """
    client  = _get_client()
    bucket  = os.environ.get("SUPABASE_BUCKET", "jaiko-media")
    path    = f"{folder}/{filename}"

    client.storage.from_(bucket).upload(
        path,
        file_bytes,
        {"content-type": _guess_mime(filename), "upsert": "true"},
    )

    result = client.storage.from_(bucket).get_public_url(path)
    return result


def delete_image(path: str) -> None:
    client = _get_client()
    bucket = os.environ.get("SUPABASE_BUCKET", "jaiko-media")
    client.storage.from_(bucket).remove([path])


def _guess_mime(filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower()
    return {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
            "webp": "image/webp", "gif": "image/gif"}.get(ext, "application/octet-stream")
