# StreamVault OTT Platform

## Tech Stack
- **Backend:** NestJS (TypeScript), Mongoose, MongoDB, JWT Auth (`@nestjs/jwt`, `passport-jwt`), `class-validator`, Jest.
- **Frontend:** React + TypeScript (Vite), Tailwind CSS, Zustand for state management, Axios, React Router.
- **Infra:** Docker, docker-compose, GitHub Actions CI.

## Engineering Rules
- Strict TypeScript everywhere. Avoid `any`.
- Backend must use modular NestJS architecture (`auth`, `users`, `movies`, `watchlist`, `playback`).
- All endpoints must use DTOs with `class-validator` and a global exception filter.
- Never expose TMDB API keys to the frontend; seed or proxy catalog data through NestJS + MongoDB.
- Write Jest unit tests for core backend services.