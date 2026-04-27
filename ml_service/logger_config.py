"""Logging configuration for the Unified ML Service"""
import logging
import logging.handlers
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional


# Log directory setup — handle read-only filesystems (Railway, etc.)
LOG_DIR = Path(__file__).parent / "logs"
try:
    LOG_DIR.mkdir(exist_ok=True)
except (OSError, PermissionError):
    import tempfile
    LOG_DIR = Path(tempfile.gettempdir()) / "ml_service_logs"
    LOG_DIR.mkdir(exist_ok=True)


class JSONFormatter(logging.Formatter):
    """JSON formatter for structured logging"""

    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id
        if hasattr(record, "manual_id"):
            log_data["manual_id"] = record.manual_id
        if hasattr(record, "processing_time_ms"):
            log_data["processing_time_ms"] = record.processing_time_ms

        return json.dumps(log_data)


class ProcessingLogger:
    """Context-aware logger for processing stages"""

    def __init__(self, name: str, manual_id: Optional[str] = None, request_id: Optional[str] = None):
        self.logger = logging.getLogger(name)
        self.manual_id = manual_id
        self.request_id = request_id

    def _extra(self):
        return {"manual_id": self.manual_id, "request_id": self.request_id}

    def info(self, message: str, **kwargs):
        extra = self._extra()
        if "extra" in kwargs:
            extra.update(kwargs.pop("extra"))
        self.logger.info(message, extra=extra, **kwargs)

    def warning(self, message: str, **kwargs):
        extra = self._extra()
        if "extra" in kwargs:
            extra.update(kwargs.pop("extra"))
        self.logger.warning(message, extra=extra, **kwargs)

    def error(self, message: str, **kwargs):
        extra = self._extra()
        if "extra" in kwargs:
            extra.update(kwargs.pop("extra"))
        self.logger.error(message, extra=extra, **kwargs)

    def debug(self, message: str, **kwargs):
        extra = self._extra()
        if "extra" in kwargs:
            extra.update(kwargs.pop("extra"))
        self.logger.debug(message, extra=extra, **kwargs)

    def critical(self, message: str, **kwargs):
        extra = self._extra()
        if "extra" in kwargs:
            extra.update(kwargs.pop("extra"))
        self.logger.critical(message, extra=extra, **kwargs)


def setup_logging(log_level: str = "INFO", use_json: bool = True) -> None:
    """Configure logging for the ML service"""

    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level))
    root_logger.handlers.clear()

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, log_level))

    if use_json:
        console_handler.setFormatter(JSONFormatter())
    else:
        console_handler.setFormatter(logging.Formatter(
            fmt="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        ))
    root_logger.addHandler(console_handler)

    # File handler (best-effort, may fail on read-only FS)
    try:
        file_handler = logging.handlers.RotatingFileHandler(
            LOG_DIR / "ml_service.log",
            maxBytes=100 * 1024 * 1024,
            backupCount=5,
        )
        file_handler.setLevel(logging.INFO)
        file_handler.setFormatter(JSONFormatter())
        root_logger.addHandler(file_handler)
    except Exception as e:
        root_logger.warning(f"Could not setup file logging: {e}")

    # Error file handler
    try:
        error_handler = logging.handlers.RotatingFileHandler(
            LOG_DIR / "ml_service_errors.log",
            maxBytes=50 * 1024 * 1024,
            backupCount=3,
        )
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(JSONFormatter())
        root_logger.addHandler(error_handler)
    except Exception as e:
        root_logger.warning(f"Could not setup error file logging: {e}")


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)


def get_processing_logger(
    name: str, manual_id: Optional[str] = None, request_id: Optional[str] = None
) -> ProcessingLogger:
    return ProcessingLogger(name, manual_id, request_id)
