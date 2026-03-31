"""Tests for src/helpers/io.py"""

import os
import sys
import tempfile

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from src.helpers.io import get_input, set_output, set_env, add_path


def test_get_input_returns_env_value(monkeypatch):
    monkeypatch.setenv("INPUT_MY_NAME", "Alice")
    assert get_input("my_name") == "Alice"


def test_get_input_default_when_missing(monkeypatch):
    monkeypatch.delenv("INPUT_MISSING", raising=False)
    assert get_input("missing", default="default_val") == "default_val"


def test_get_input_required_raises_when_missing(monkeypatch):
    monkeypatch.delenv("INPUT_REQUIRED_VAR", raising=False)
    with pytest.raises(ValueError, match="Input required"):
        get_input("required_var", required=True)


def test_set_output_writes_to_file(monkeypatch, tmp_path):
    out_file = tmp_path / "output"
    out_file.write_text("")
    monkeypatch.setenv("GITHUB_OUTPUT", str(out_file))
    set_output("my_key", "my_value")
    assert "my_key=my_value" in out_file.read_text()


def test_set_env_writes_to_file(monkeypatch, tmp_path):
    env_file = tmp_path / "env"
    env_file.write_text("")
    monkeypatch.setenv("GITHUB_ENV", str(env_file))
    set_env("MY_VAR", "hello")
    assert "MY_VAR=hello" in env_file.read_text()


def test_add_path_writes_to_file(monkeypatch, tmp_path):
    path_file = tmp_path / "path"
    path_file.write_text("")
    monkeypatch.setenv("GITHUB_PATH", str(path_file))
    add_path("/usr/local/custom/bin")
    assert "/usr/local/custom/bin" in path_file.read_text()
