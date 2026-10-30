# Frontend integration

Copy NoiseChallenge.jsx and noise-challenge.css into `frontend/src/pages/app/`.

In `frontend/src/App.jsx`, add with the other page imports:
    import NoiseChallenge from "./pages/app/NoiseChallenge";

Inside the existing `/app` parent route, add:
    <Route path="noise-challenge" element={<NoiseChallenge />} />

In `frontend/src/layouts/applayout.jsx`, add exactly one sidebar entry:
    <NavLink to="/app/noise-challenge" className="sidebar-link">
      <span>◎</span> Discovery Challenge
    </NavLink>

If the backend is not at http://127.0.0.1:8000, create `frontend/.env`:
    VITE_API_BASE_URL=http://127.0.0.1:8000

Restart Vite after changing .env.
