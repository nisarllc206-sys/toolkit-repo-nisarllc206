"""Input/output helper functions for GitHub Actions."""

import os


def get_input(name: str, required: bool = False, default: str = "") -> str:
    """Read an action input from the environment.

    GitHub Actions sets inputs as environment variables with the prefix
    ``INPUT_`` and the name uppercased.

    Args:
        name: The name of the input variable.
        required: Raise an error when ``True`` and the input is missing.
        default: Fallback value when the input is not set.

    Returns:
        The value of the input.

    Raises:
        ValueError: When *required* is ``True`` and the input is absent.
    """
    env_name = f"INPUT_{name.upper().replace(' ', '_')}"
    value = os.environ.get(env_name, default)
    if required and not value:
        raise ValueError(f"Input required and not supplied: {name}")
    return value


def set_output(name: str, value: str) -> None:
    """Write an output variable for subsequent workflow steps.

    Args:
        name: The output variable name.
        value: The value to assign.
    """
    output_file = os.environ.get("GITHUB_OUTPUT")
    if output_file:
        with open(output_file, "a") as f:
            f.write(f"{name}={value}\n")
    else:
        # Fallback for local testing (GITHUB_OUTPUT not set outside a runner)
        print(f"[local] output: {name}={value}")


def set_env(name: str, value: str) -> None:
    """Export an environment variable for subsequent workflow steps.

    Args:
        name: The environment variable name.
        value: The value to assign.
    """
    env_file = os.environ.get("GITHUB_ENV")
    if env_file:
        with open(env_file, "a") as f:
            f.write(f"{name}={value}\n")
    else:
        print(f"[local] env: {name}={value}")


def add_path(path: str) -> None:
    """Prepend *path* to PATH for subsequent workflow steps.

    Args:
        path: The directory to prepend to PATH.
    """
    path_file = os.environ.get("GITHUB_PATH")
    if path_file:
        with open(path_file, "a") as f:
            f.write(f"{path}\n")
    else:
        print(f"[local] path: {path}")
