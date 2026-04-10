# Multi-Sport Tournament Management System

Fresh standalone project built in `newchatgpt` with:

- Frontend: React + Vite
- Backend: Django + Django REST Framework
- Auth: JWT with role-based access
- Database: PostgreSQL-ready with SQLite fallback
- Deployment: Dockerfiles and `docker-compose.yml`

## Features

- Organizer and Team Captain / Player roles
- Signup, login, logout, profile, token refresh
- Organizer tournament creation, editing, deletion, and registration review
- Team registration flow and personal registration tracking
- Tournament banner upload support
- Support for cricket, football, kabaddi, volleyball, badminton, basketball, hockey, and custom sports

## Run Backend

1. `cd backend`
2. Create a virtual environment and activate it
3. `pip install -r requirements.txt`
4. Set environment variables from `../.env.example`
5. `python manage.py migrate`
6. `python manage.py runserver`

## Run Frontend

1. `cd frontend`
2. `npm install`
3. Create `.env` from `.env.example`
4. `npm run dev`

## Docker

From `newchatgpt`:

```bash
docker compose up --build
```
