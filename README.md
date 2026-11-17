# Tree Field Task Management

A small full-stack app for dispatching tree maintenance work and recording progress in the field. Admins create and reassign tasks; field workers start, complete, or suspend their assigned tasks with feedback.

## Quick start with Docker

**Prerequisite:** Docker Desktop (or Docker Engine with Compose) running.

From this directory:

```bash
docker compose up -d --build
```

Open **http://localhost:8080**. The web container serves the Angular app and forwards `/api` requests to the API container. The API creates and seeds its SQLite database on first run.

To check the containers or see logs:

```bash
docker compose ps
docker compose logs -f web api
```

Stop the app with `docker compose down`. Task data remains in `data/treetask.db` because `data/` is mounted from your machine.

### After changing code

The Docker images contain compiled code. Editing `web/src` or `api/src` does **not** update a running container automatically. Rebuild the service you changed, then reload the browser:

```bash
docker compose up -d --build web
# or, after API changes:
docker compose up -d --build api
docker compose restart web
```

## Try the main workflow

1. In **Admin**, create a task for a tree, choose a task type, and assign a field worker.
2. Switch to **Field worker** and select that worker under **Acting as**.
3. Start the task, then complete it or suspend it with a reason.
4. Switch back to **Admin** to filter tasks by status or reassign an unfinished task.

The role switch is for demonstrating both views; it is not authentication.

## Project layout

| Path | Purpose |
| --- | --- |
| `web/` | Angular 22 frontend. Components are in `web/src/app/`; shared styling is in `web/src/styles.css`. |
| `api/` | .NET 10 Web API. Controllers, services, and repositories are under `api/src/TreeTask.Api/`. |
| `data/` | SQLite database persisted by the Docker setup. |
| `docker-compose.yml` | Starts the web and API containers; exposes the app on port 8080. |

## Local development without Docker

You need the .NET 10 SDK and Node.js 24 with npm. Run the API and frontend in separate terminals from this directory:

```bash
ASPNETCORE_URLS=http://localhost:5080 dotnet run --project api/src/TreeTask.Api/TreeTask.Api.csproj
```

```bash
cd web
npm ci
npm start
```

Open **http://localhost:4200**. Angular's development server reloads frontend edits and proxies `/api` to the API on port 5080.

## Checks

```bash
cd web
npm test -- --watch=false
npm run build
```

```bash
dotnet test api/tests/TreeTask.Api.Tests
```

Run the frontend commands from `web/` and the API test command from this directory.

## Task rules

- `Pending → InProgress → Completed`
- `InProgress → Suspended` requires field feedback.
- `Suspended → InProgress` resumes work; `Completed` is final.
- Admins can reassign any task that is not completed.

The API enforces these rules. It returns validation or problem-detail responses for invalid requests.
