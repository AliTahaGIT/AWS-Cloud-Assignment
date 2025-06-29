Setup Guide 

Windows
- Install uv (Write this in powershell):
```
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

- Run the following command to start the backend:
```
uv run fastapi dev
```