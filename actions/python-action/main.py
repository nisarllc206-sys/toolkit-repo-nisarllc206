import os
import sys


def set_output(name: str, value: str) -> None:
    """Write a key=value pair to GITHUB_OUTPUT."""
    output_file = os.environ.get("GITHUB_OUTPUT")
    if output_file:
        with open(output_file, "a") as f:
            f.write(f"{name}={value}\n")


def main() -> None:
    name = sys.argv[1] if len(sys.argv) > 1 else "World"
    greeting = f"Hello, {name}! — running Python action."
    print(f"::notice::{greeting}")
    set_output("greeting", greeting)


if __name__ == "__main__":
    main()
