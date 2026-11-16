"""Storage service interface and implementations for local filesystem and S3/R2."""

import abc
import os
import re
import uuid
from pathlib import Path

from app.core.config import settings


def sanitize_filename(filename: str) -> str:
    """Sanitize a filename to avoid directory traversal and strange characters."""
    clean = os.path.basename(filename)
    clean = re.sub(r"[^\w\.-]", "_", clean)
    return clean or "unnamed_file"


class StorageService(abc.ABC):
    """Abstract storage interface for file asset persistence."""

    @abc.abstractmethod
    def save(self, file_data: bytes, filename: str, content_type: str) -> str:
        """Persist file data and return storage key."""
        pass

    @abc.abstractmethod
    def get_url(self, storage_key: str, expires_in: int = 3600) -> str:
        """Return download or presigned access URL for storage key."""
        pass

    @abc.abstractmethod
    def read(self, storage_key: str) -> bytes:
        """Retrieve raw file content by storage key."""
        pass

    @abc.abstractmethod
    def delete(self, storage_key: str) -> None:
        """Remove file by storage key."""
        pass


class LocalStorageService(StorageService):
    """Local filesystem storage provider for development and testing."""

    def __init__(self, base_dir: str | None = None) -> None:
        target_dir = base_dir or settings.LOCAL_STORAGE_DIR
        self.base_dir = Path(target_dir).resolve()
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def save(self, file_data: bytes, filename: str, content_type: str) -> str:
        safe_name = sanitize_filename(filename)
        storage_key = f"{uuid.uuid4().hex}_{safe_name}"
        file_path = self.base_dir / storage_key
        file_path.write_bytes(file_data)
        return storage_key

    def get_url(self, storage_key: str, expires_in: int = 3600) -> str:
        # Returns API download endpoint relative path
        return f"{settings.API_V1_PREFIX}/files/download/{storage_key}"

    def read(self, storage_key: str) -> bytes:
        safe_key = os.path.basename(storage_key)
        file_path = self.base_dir / safe_key
        if not file_path.exists() or not file_path.is_file():
            raise FileNotFoundError(f"Storage key '{storage_key}' not found on disk.")
        return file_path.read_bytes()

    def delete(self, storage_key: str) -> None:
        safe_key = os.path.basename(storage_key)
        file_path = self.base_dir / safe_key
        if file_path.exists():
            file_path.unlink()


class S3StorageService(StorageService):
    """S3 / Cloudflare R2 / MinIO storage provider with presigned URLs."""

    def __init__(self) -> None:
        import boto3
        from botocore.config import Config

        session = boto3.session.Session()
        client_kwargs = {
            "service_name": "s3",
            "region_name": settings.S3_REGION,
            "aws_access_key_id": settings.S3_ACCESS_KEY_ID,
            "aws_secret_access_key": settings.S3_SECRET_ACCESS_KEY,
            "config": Config(signature_version="s3v4"),
        }
        if settings.S3_ENDPOINT_URL:
            client_kwargs["endpoint_url"] = settings.S3_ENDPOINT_URL

        self.client = session.client(**client_kwargs)
        self.bucket = settings.S3_BUCKET_NAME

    def save(self, file_data: bytes, filename: str, content_type: str) -> str:
        safe_name = sanitize_filename(filename)
        storage_key = f"assets/{uuid.uuid4().hex}/{safe_name}"
        self.client.put_object(
            Bucket=self.bucket,
            Key=storage_key,
            Body=file_data,
            ContentType=content_type,
        )
        return storage_key

    def get_url(self, storage_key: str, expires_in: int = 3600) -> str:
        return self.client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket, "Key": storage_key},
            ExpiresIn=expires_in or settings.S3_PRESIGNED_URL_EXPIRE_SECONDS,
        )

    def read(self, storage_key: str) -> bytes:
        response = self.client.get_object(Bucket=self.bucket, Key=storage_key)
        return response["Body"].read()

    def delete(self, storage_key: str) -> None:
        self.client.delete_object(Bucket=self.bucket, Key=storage_key)


_storage_instance: StorageService | None = None


def get_storage_service() -> StorageService:
    """Return active storage service instance based on application configuration."""
    global _storage_instance
    if _storage_instance is None:
        if settings.STORAGE_PROVIDER.lower() == "s3" and settings.S3_ACCESS_KEY_ID:
            _storage_instance = S3StorageService()
        else:
            _storage_instance = LocalStorageService()
    return _storage_instance
