"""Tests for src/logging/logger.py"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from src.logging.logger import (
    info,
    warning,
    error,
    notice,
    debug,
    start_group,
    end_group,
    mask_secret,
    set_failed,
)


def test_info_prints_message(capsys):
    info("hello info")
    captured = capsys.readouterr()
    assert "hello info" in captured.out


def test_warning_prints_workflow_command(capsys):
    warning("something wrong")
    captured = capsys.readouterr()
    assert "::warning::" in captured.out
    assert "something wrong" in captured.out


def test_error_prints_workflow_command(capsys):
    error("something failed")
    captured = capsys.readouterr()
    assert "::error::" in captured.out
    assert "something failed" in captured.out


def test_notice_prints_workflow_command(capsys):
    notice("take note")
    captured = capsys.readouterr()
    assert "::notice::take note" in captured.out


def test_debug_prints_workflow_command(capsys):
    debug("debug detail")
    captured = capsys.readouterr()
    assert "::debug::debug detail" in captured.out


def test_start_group_and_end_group(capsys):
    start_group("My Group")
    end_group()
    captured = capsys.readouterr()
    assert "::group::My Group" in captured.out
    assert "::endgroup::" in captured.out


def test_mask_secret(capsys):
    mask_secret("super_secret")
    captured = capsys.readouterr()
    assert "::add-mask::super_secret" in captured.out


def test_set_failed_raises(capsys):
    with pytest.raises(SystemExit):
        set_failed("fatal error")
    captured = capsys.readouterr()
    assert "fatal error" in captured.out
