## Cursor Cloud specific instructions

This is a beginner Python practice repository with standalone scripts and two Flask REST APIs. There is no `requirements.txt`, `pyproject.toml`, or formal dependency management — dependencies are inferred from imports.

### Services

| Service | Command | Port | Notes |
|---------|---------|------|-------|
| `api.py` (Employee CRUD API) | `source .venv/bin/activate && python api.py` | 5050 | More complete API with validation |
| `api2.py` (Employee CRUD API) | `source .venv/bin/activate && python api2.py` | 5000 | Simpler version |

Both APIs use in-memory data (no database). No Docker or external services are needed.

### Lint

```
source .venv/bin/activate && flake8 --exclude=venv,.venv,pygame_asteroids *.py
```

The existing code has many style warnings — these are expected for a learning repo. There are no automated tests.

### Caveats

- The repo ships a `venv/` directory created on Windows (has `Scripts/` instead of `bin/`). It is non-functional on Linux. The update script creates a fresh `.venv/` instead.
- `pygame_asteroids/game.py` requires a display and the `pygame` pip package; it cannot run in a headless environment.
- `api2.py` line 13 has a bare `3` statement (no-op); this is in the original code and does not prevent the file from running.
