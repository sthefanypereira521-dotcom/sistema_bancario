FROM python:3.14-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY database ./database
COPY routes ./routes
COPY schemas ./schemas
COPY services ./services
COPY main.py security.py ./

RUN pip install --no-cache-dir \
    "fastapi>=0.140,<0.141" \
    "uvicorn>=0.51,<0.52" \
    "python-jose>=3.5,<4" \
    "passlib[bcrypt]>=1.7.4,<2" \
    "python-dotenv>=1.2,<2" \
    "pydantic[email]>=2.13,<3" \
    "bcrypt==4.0.1"

EXPOSE 8000

CMD ["sh", "-c", "python -c \"import sqlite3; c=sqlite3.connect('database/banco.sqlite3'); c.executescript(open('database/init.sql', encoding='utf-8').read()); c.close()\" && uvicorn main:app --host 0.0.0.0 --port 8000"]
