# GitHub Actions Toolkit - nisarllc206

[![GitHub Repo Size](https://img.shields.io/github/repo-size/nisarllc206/toolkit-repo-nisarllc206)](https://github.com/nisarllc206/toolkit-repo-nisarllc206)
[![License](https://img.shields.io/github/license/nisarllc206/toolkit-repo-nisarllc206)](LICENSE)
[![Actions Status](https://github.com/nisarllc206/toolkit-repo-nisarllc206/workflows/CI/badge.svg)](https://github.com/nisarllc206/toolkit-repo-nisarllc206/actions)

## 🚀 Overview
This repository is a **GitHub Actions Toolkit** designed to help developers **create, test, and deploy custom GitHub Actions** quickly. It contains reusable templates, workflow examples, and utilities for CI/CD automation.

Use this toolkit to:
- Scaffold GitHub Actions (JavaScript, Python, Docker)
- Standardize workflows across multiple projects
- Automate tests, builds, and deployments
- Learn best practices for GitHub Actions development

---

## 🛠 Features
- Action templates (JavaScript, Docker, Python) in `actions/`
- Workflow examples ready-to-use in `.github/workflows/`
- Input/output helper functions (`src/helpers/io.py`)
- Logging utilities for debugging actions (`src/logging/logger.py`)
- CI/CD examples for testing and deployment

---

## 📦 Installation
Clone the repository to your local machine:

```bash
git clone https://github.com/nisarllc206/toolkit-repo-nisarllc206.git
cd toolkit-repo-nisarllc206
```

Install Python dependencies:

```bash
pip install -r requirements.txt
```

---

## 📁 Repository Structure

```
toolkit-repo-nisarllc206/
│
├── .github/
│   └── workflows/
│       ├── ci.yml              # General CI workflow (Node.js)
│       └── python-ci.yml       # Python CI workflow
│
├── actions/
│   ├── javascript-action/      # JavaScript action template
│   │   ├── action.yml
│   │   ├── index.js
│   │   └── package.json
│   ├── docker-action/          # Docker action template
│   │   ├── action.yml
│   │   ├── Dockerfile
│   │   └── entrypoint.sh
│   └── python-action/          # Python action template
│       ├── action.yml
│       ├── Dockerfile
│       └── main.py
│
├── src/
│   ├── helpers/
│   │   └── io.py               # Input/output helper functions
│   └── logging/
│       └── logger.py           # Logging utilities
│
├── tests/
│   ├── test_io.py              # Tests for I/O helpers
│   └── test_logger.py          # Tests for logging utilities
│
├── requirements.txt
└── README.md
```

---

## 🔹 Example Workflow: `.github/workflows/python-ci.yml`

```yaml
name: Python CI

# 1️⃣ Trigger events
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

# 2️⃣ Jobs
jobs:
  build:
    # 3️⃣ Runner environment
    runs-on: ubuntu-latest

    # 4️⃣ Steps to execute
    steps:
      # 4a. Check out repository code
      - name: Checkout repository
        uses: actions/checkout@v3

      # 4b. Set up Python
      - name: Set up Python 3.11
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      # 4c. Install dependencies
      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt

      # 4d. Run tests
      - name: Run tests
        run: |
          pytest
```

---

## 🔹 Line-by-Line Explanation

**`name: Python CI`** — The workflow name shown in the Actions tab on GitHub.

**`on:`** — Defines when the workflow runs:
- `push` to `main`
- `pull_request` targeting `main`

**`jobs:`** — Workflows can contain multiple jobs; each runs independently. `build` is the name of this job.

**`runs-on: ubuntu-latest`** — The runner OS. Options: `ubuntu-latest`, `windows-latest`, `macos-latest`.

**`steps:`** — Each job is made of steps executed sequentially.

| Step | Action | Purpose |
|------|--------|---------|
| 1 | `actions/checkout@v3` | Downloads repo code to the runner |
| 2 | `actions/setup-python@v4` | Installs Python 3.11 on the runner |
| 3 | `pip install -r requirements.txt` | Installs all project dependencies |
| 4 | `pytest` | Runs the test suite; fails the workflow on any test failure |

---

## 🔹 Using the Action Templates

### JavaScript Action

```yaml
- name: Run JavaScript action
  uses: ./actions/javascript-action
  with:
    greeting: 'Hello from the toolkit!'
```

### Docker Action

```yaml
- name: Run Docker action
  uses: ./actions/docker-action
  with:
    message: 'Running inside a container!'
```

### Python Action

```yaml
- name: Run Python action
  uses: ./actions/python-action
  with:
    name: 'nisarllc206'
```

---

## 🔹 Running Tests Locally

```bash
pytest tests/
```

---

## 📄 License

This project is licensed under the terms of the [LICENSE](LICENSE) file.
