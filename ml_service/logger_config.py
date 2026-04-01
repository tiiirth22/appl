"""Logging configuration for ML Service"""
import logging
import logging.handlers
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
import sys

# Log directory setup
LOG_DIR = Path(__file__).parent / "logs"
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
        
        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        # Add extra fields if present (for context)
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
    
    def _add_context(self, record: logging.LogRecord):
        """Add context to log record"""
        if self.manual_id:
            record.manual_id = self.manual_id
        if self.request_id:
            record.request_id = self.request_id
    
    def info(self, message: str, **kwargs):
        """Log info with context"""
        extra = {"manual_id": self.manual_id, "request_id": self.request_id}
        self.logger.info(message, extra=extra, **kwargs)
    
    def warning(self, message: str, **kwargs):
        """Log warning with context"""
        extra = {"manual_id": self.manual_id, "request_id": self.request_id}
        self.logger.warning(message, extra=extra, **kwargs)
    
    def error(self, message: str, **kwargs):
        """Log error with context"""
        extra = {"manual_id": self.manual_id, "request_id": self.request_id}
        self.logger.error(message, extra=extra, **kwargs)
    
    def debug(self, message: str, **kwargs):
        """Log debug with context"""
        extra = {"manual_id": self.manual_id, "request_id": self.request_id}
        self.logger.debug(message, extra=extra, **kwargs)


def setup_logging(log_level: str = "INFO", use_json: bool = True) -> None:
    """Configure logging for the ML service"""
    
    # Root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level))
    
    # Remove existing handlers
    root_logger.handlers.clear()
    
    # Console handler (always include)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, log_level))
    
    if use_json:
        console_formatter = JSONFormatter()
    else:
        console_formatter = logging.Formatter(
            fmt="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
    console_handler.setFormatter(console_formatter)
    root_logger.addHandler(console_handler)
    
    # File handler (JSON format only)
    try:
        file_handler = logging.handlers.RotatingFileHandler(
            LOG_DIR / "ml_service.log",
            maxBytes=100 * 1024 * 1024,  # 100MB
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
            maxBytes=50 * 1024 * 1024,  # 50MB
            backupCount=3,
        )
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(JSONFormatter())
        root_logger.addHandler(error_handler)
    except Exception as e:
        root_logger.warning(f"Could not setup error file logging: {e}")


# Get logger for modules
def get_logger(name: str) -> logging.Logger:
    """Get logger for a module"""
    return logging.getLogger(name)


def get_processing_logger(
    name: str, manual_id: Optional[str] = None, request_id: Optional[str] = None
) -> ProcessingLogger:
    """Get processing logger with context"""
    return ProcessingLogger(name, manual_id, request_id)
