"""Logging utilities for GitHub Actions."""

import os


def _log(level: str, message: str) -> None:
    print(f"::{level}::{message}")


def info(message: str) -> None:
    """Log an informational message visible in the workflow log.

    Args:
        message: The message to log.
    """
    print(message)


def warning(message: str, file: str = "", line: int = 0, col: int = 0) -> None:
    """Create a warning annotation in the workflow log.

    Args:
        message: The warning message.
        file: Optional source file path.
        line: Optional line number.
        col: Optional column number.
    """
    params = []
    if file:
        params.append(f"file={file}")
    if line:
        params.append(f"line={line}")
    if col:
        params.append(f"col={col}")
    param_str = ",".join(params)
    if param_str:
        print(f"::warning {param_str}::{message}")
    else:
        print(f"::warning::{message}")


def error(message: str, file: str = "", line: int = 0, col: int = 0) -> None:
    """Create an error annotation in the workflow log.

    Args:
        message: The error message.
        file: Optional source file path.
        line: Optional line number.
        col: Optional column number.
    """
    params = []
    if file:
        params.append(f"file={file}")
    if line:
        params.append(f"line={line}")
    if col:
        params.append(f"col={col}")
    param_str = ",".join(params)
    if param_str:
        print(f"::error {param_str}::{message}")
    else:
        print(f"::error::{message}")


def notice(message: str) -> None:
    """Create a notice annotation in the workflow log.

    Args:
        message: The notice message.
    """
    print(f"::notice::{message}")


def debug(message: str) -> None:
    """Log a debug message (visible only when debug logging is enabled).

    Args:
        message: The debug message.
    """
    print(f"::debug::{message}")


def start_group(name: str) -> None:
    """Begin a collapsible log group.

    Args:
        name: The group heading displayed in the log.
    """
    print(f"::group::{name}")


def end_group() -> None:
    """End the current collapsible log group."""
    print("::endgroup::")


def mask_secret(value: str) -> None:
    """Mask *value* so it is redacted in workflow logs.

    Args:
        value: The sensitive string to mask.
    """
    print(f"::add-mask::{value}")


def set_failed(message: str) -> None:
    """Log an error and signal workflow failure.

    Args:
        message: The failure message.
    """
    error(message)
    raise SystemExit(1)
