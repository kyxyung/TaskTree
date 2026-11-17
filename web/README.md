# TreeTask frontend

See the [project README](../README.md) for the Docker quick start, project layout, and main workflow.

## Run the frontend locally

Start the API on `http://localhost:5080` as described in the project README. Then, from this directory:

```bash
npm ci
npm start
```

Open `http://localhost:4200`. The Angular dev server reloads source changes and proxies `/api` through `proxy.conf.json`.

Use Node.js 24 and npm. To run the frontend checks:

```bash
npm test -- --watch=false
npm run build
```

For the Docker version on `http://localhost:8080`, run `docker compose up -d --build web` from the project root after frontend changes.
