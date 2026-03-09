# ExamWise

ExamWise is a web application designed for smart exam preparation.

This project uses a monorepo setup to manage both the backend API and the frontend client within a single repository using npm workspaces.

## Tech Stack
*   **Backend (`/server`)**: Node.js, Express, SQLite
*   **Frontend (`/client`)**: Vue 3, Vite, Vue Router

## Directory Structure
```text
ExamWise/
├── package.json          # Workspace root, manages npm workspaces
├── server/               # Express Backend
│   ├── package.json      # Backend dependencies (express, sqlite3, etc.)
│   ├── src/
│   │   ├── config/       # Db configuration (SQLite connection)
│   │   ├── controllers/  # Route handlers and business logic
│   │   ├── models/       # Data models and database queries
│   │   ├── routes/       # Express API routes definition
│   │   └── index.js      # Main entry point for backend
└── client/               # Vue 3 Frontend
    ├── package.json      # Frontend dependencies (vue, vue-router, vite)
    ├── vite.config.js    # Vite configuration & dev server proxy
    ├── index.html        # Main HTML file
    └── src/
        ├── App.vue       # Root Vue component
        ├── main.js       # Vue application initialization
        ├── components/   # Reusable Vue components
        ├── views/        # Page-level Vue components
        └── router/       # Vue Router configuration
```

## Getting Started

### Prerequisites
*   [Node.js](https://nodejs.org/) (v22.15.0 recommended)

### Installation
Run the following command from the root directory to install dependencies for both the `server` and `client` workspaces:

```bash
npm install
```

### Running the Application (Development)
To start both the backend server and the frontend client concurrently, run from the root directory:

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173` and the backend API at `http://localhost:3000/api`. The Vite dev server proxies API requests to the Express backend.
