# CLAUDE.md - Coffee Management System

## Project Overview

**Coffee Management System** — Full-stack app for tracking coffee beans, grinders, brew methods, and brew logs. One household per self-hosted instance. First user claims the instance, then new users join via invite code. All users share equipment. Open source, self-hostable.

**Stack:** Python FastAPI + Next.js + PostgreSQL

**Timeline:** 1 month

---

## Development Setup

### Backend (Python FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend (Next.js)
```bash
cd frontend
npm install
```

### Environment Files
Create `.env` in backend/:
```
DATABASE_URL=postgresql://user:password@localhost/coffee_db
JWT_SECRET=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
```

Create `.env.local` in frontend/:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Common Commands

### Backend
```bash
# Run development server (with auto-reload)
uvicorn app.main:app --reload

# Run on specific port
uvicorn app.main:app --reload --port 8000

# Generate database migrations (once alembic is set up)
alembic revision --autogenerate -m "message"
alembic upgrade head
```

### Frontend
```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint/format
npm run lint
npm run format  # if prettier is set up
```

### Database
```bash
# Connect to PostgreSQL (assuming postgres is running)
psql -U postgres -d coffee_db

# Common psql commands:
# \dt          - list tables
# \d <table>   - describe table
# \q           - quit
```

---

## Key Development Notes

**Database:**
- Use SQLAlchemy ORM for all models
- Always run migrations before pushing code
- Test both create and update operations with new fields

**API:**
- Test all endpoints via Swagger UI at http://localhost:8000/docs
- Include proper error responses (400, 401, 403, 404, 500)
- Validate all input with Pydantic schemas

**Frontend:**
- Test localStorage behavior in incognito mode
- Verify protected routes redirect to /login when token missing
- Check responsive design at 375px (mobile), 768px (tablet), 1024px (desktop)

**Auth Flow Priority:**
- Register flow (first user) blocks after first user exists
- /register endpoint must check user count
- /join endpoint must validate invite code format and expiration
- All protected routes require valid JWT token

---

## Data Model

**User** (Multiple accounts per instance)
- id, email, password_hash, name
- is_admin (first user who claims instance)
- created_at

**Bean**
- id, name, roaster, origin
- roast_date, purchase_date, purchase_cost
- quantity_grams, quantity_purchased_grams
- rating, notes, is_available

**Grinder**
- id, name, model, manufacturer, notes

**GrinderSettingsProfile**
- id, grinder_id (FK), name, setting, description

**BrewMethod**
- id, name, category, description

**BrewLog**
- id, user_id (FK), bean_id (FK), grinder_id (FK, optional), method_id (FK)
- water_temperature, grind_size, grinder_setting, brew_time
- water_amount, coffee_amount, rating, notes
- brew_date, created_at

**InviteCode**
- id, code (unique), created_by (user_id), used_by (user_id, nullable), created_at, expires_at

---

## Instance Setup Flow

```
Blank Server:
  1. First user visits /register
  2. Can register freely (no users exist yet)
  3. Becomes admin, instance is "claimed"
  4. /register endpoint now returns 403 for new registrations
  
  5. Admin generates invite code in settings
  6. Shares code with other household members
  
  7. Other users visit /join with invite code
  8. Create account and join instance
  9. Can now login and see all shared data

Production:
  - /register only works if no users exist (blank instance)
  - After first user: /register disabled, only /join with code works
  - Admin can generate multiple codes
  - Each code can be one-time use or multi-use (decide)
```

---

## How It Works

```
Your household's server (self-hosted at home):
  ├── Admin User: Jacek (first user, claimed instance)
  ├── User: Girlfriend (joined via invite code)
  ├── User: Parent (joined via invite code, optional)
  └── Shared Equipment:
      ├── Beans (all users view/edit)
      ├── Grinders (all users view/edit)
      ├── Methods (all users view/edit)
      └── BrewLogs (all users view, user_id tracks who logged it)

Another household's server (their own completely separate instance):
  ├── Admin User: Alice (first user, claimed that instance)
  ├── User: Bob (joined via invite code)
  └── Shared Equipment (completely different database, zero access from Jacek's instance)
```

**Key Design:**
- **One instance = One household forever**
- **First registered user = Admin, claims the instance**
- **After first user, /register is disabled globally**
- **New users join with invite codes only** (Admin generates in settings)
- **All users share all data** (beans, grinders, methods)
- **Each instance is isolated** (separate databases, no cross-instance access)

---

## Backend Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry, routes
│   ├── database.py          # SQLAlchemy engine, session
│   ├── models.py            # ORM models
│   ├── schemas.py           # Pydantic validation
│   ├── crud.py              # CRUD operations
│   ├── auth.py              # JWT, password hashing
│   ├── dependencies.py      # get_current_user, get_db
│   └── routers/
│       ├── __init__.py
│       ├── auth.py          # Login, register
│       ├── beans.py         # Bean endpoints
│       ├── grinders.py      # Grinder endpoints
│       ├── methods.py       # Method endpoints
│       └── brews.py         # Brew log endpoints
├── requirements.txt
├── .env.example
├── Dockerfile
└── .gitignore
```

### Key Tasks

- [ ] Setup FastAPI app with CORS
- [ ] Implement JWT authentication
- [ ] Create InviteCode model and CRUD
- [ ] Register endpoint: Check if users exist
  - [ ] If no users: Allow registration (first user = admin)
  - [ ] If users exist: Return 403 (use /join instead)
- [ ] Join endpoint: Validate invite code, create user
- [ ] Login endpoint: Standard JWT login
- [ ] Admin settings: Generate/view/revoke invite codes
- [ ] Database models (User, Bean, Grinder, Method, BrewLog, InviteCode)
- [ ] CRUD for each entity (all users share all data)
- [ ] Hash passwords securely
- [ ] Validate all user input
- [ ] Test endpoints (Swagger UI)

---

## Frontend Structure

```
frontend/
├── app/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Public home page
│   ├── login/
│   │   └── page.tsx         # Login page
│   ├── register/
│   │   └── page.tsx         # Register page (only if no users exist)
│   ├── join/
│   │   └── page.tsx         # Join with invite code
│   ├── (auth)/              # Protected routes (require login)
│   │   ├── dashboard/
│   │   │   └── page.tsx     # Dashboard
│   │   ├── beans/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── brews/
│   │   │   ├── page.tsx
│   │   │   └── new/
│   │   │       └── page.tsx
│   │   ├── grinders/
│   │   │   └── page.tsx
│   │   ├── methods/
│   │   │   └── page.tsx
│   │   ├── analytics/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx     # Admin: Generate invite codes
├── components/
│   ├── Header.tsx
│   ├── ProtectedRoute.tsx   # Check auth, redirect to login
│   └── (forms, cards, etc.)
├── lib/
│   ├── api.ts               # Axios with auth headers
│   ├── store.ts             # Zustand (auth + API)
│   └── types.ts
├── public/
├── styles/
├── .env.local.example
├── next.config.js
├── tsconfig.json
├── tailwind.config.ts
└── package.json
```

### Key Tasks

- [ ] Setup Next.js, TypeScript, Tailwind
- [ ] Create login/register/join pages
- [ ] Register page: Check if users exist, show conditional UI
- [ ] Join page: Input for invite code, form for email/password
- [ ] Implement protected routes (check token)
- [ ] Zustand store for auth + API calls
- [ ] API client with JWT token in headers
- [ ] All pages + components
- [ ] Handle logout
- [ ] Settings page (admin only): Generate/view/revoke invite codes

---

## Authentication Flow

### First User: Register & Claim Instance
1. User visits /register (instance is blank, no users exist)
2. Backend checks: "Any users exist?" → No
3. Allows registration (becomes admin, instance claimed)
4. Email, password entered
5. Backend creates User with is_admin=True
6. Returns user + token
7. Frontend saves token, redirects to dashboard
8. **After this, /register disabled globally (returns 403)**

### Other Users: Join with Invite Code
1. Admin generates invite code in /settings
2. Admin shares code with household member
3. User visits /join, enters code + email + password
4. Frontend POST /api/auth/join with code
5. Backend validates code (exists, not expired, not used if one-time)
6. Creates user, marks code as used
7. Returns user + token
8. Frontend saves token, redirects to dashboard

### Login (All Users)
1. User enters email, password
2. Frontend POST /api/auth/login
3. Backend: Verify credentials, return token
4. Frontend: Save token, redirect to dashboard
5. All subsequent requests include Authorization header

### Protected Routes
- Frontend checks localStorage for token
- If missing, redirect to /login
- Backend validates token on every request (middleware)
- All users access all data (no filtering)
- If invalid, return 401 → Frontend clears token, redirects

---

## Git Workflow (Professional)

### Initial Setup
```bash
git init
git add .
git commit -m "Initial commit: project structure"
git branch -M main
```

### Branch Strategy

```
main (production-ready)
  └── develop (integration branch)
      ├── feature/auth-household
      ├── feature/beans-crud
      ├── feature/brews-crud
      ├── feature/analytics
      └── feature/shared-data
```

### Workflow

1. **Create feature branch from develop**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/auth-household
   ```

2. **Commit frequently with clear messages**
   ```bash
   git commit -m "auth: implement household creation on register"
   git commit -m "auth: add invite code system for second user"
   ```

3. **Push to remote**
   ```bash
   git push origin feature/auth-household
   ```

4. **Create PR on GitHub** (describe changes, link issues)

5. **Merge to develop after review**
   ```bash
   git checkout develop
   git pull origin develop
   git merge --no-ff feature/auth-household
   git push origin develop
   ```

6. **Release to main when ready**
   ```bash
   git checkout main
   git pull origin main
   git merge --no-ff develop
   git tag -a v0.1.0 -m "First release: household auth + shared beans"
   git push origin main --tags
   ```

### Commit Message Convention

```
<type>: <description>

<body (optional)>

<footer (optional)>
```

Examples:
- `auth: implement JWT token validation`
- `feat: add bean inventory CRUD`
- `fix: ensure BrewLog tracks correct user`
- `docs: update README with setup instructions`

---

## Open Source Setup

### README.md (Root)
- Project description
- Features (two-user shared instance)
- Installation (local dev)
- Usage
- Self-hosting guide
- Contributing guidelines
- License (MIT)

### LICENSE
Use MIT (permissive, good for self-hosting)

### CONTRIBUTING.md
- Fork → Branch → PR workflow
- Code style guidelines
- Local setup steps
- Testing requirements

### DEPLOYMENT.md
- DigitalOcean instructions
- Docker setup
- Environment variables
- Database setup
- Nginx reverse proxy
- HTTPS/SSL

### .env.example (both backend + frontend)
Show what env vars are needed

### .gitignore
- `__pycache__/`, `*.pyc`
- `.venv/`, `venv/`
- `node_modules/`
- `.next/`, `dist/`
- `.env`, `.env.local`
- `*.db`, `*.sqlite`
- IDE files (`.vscode/`, `.idea/`)

---

## Development Phases

### Phase 1: Auth + Setup (Days 1-3)
- [ ] Backend: FastAPI, SQLAlchemy, User model
- [ ] Backend: JWT auth (register, login, middleware)
- [ ] Frontend: Next.js, Tailwind, TypeScript
- [ ] Frontend: Login/register pages
- [ ] Frontend: Protected routes, token management

**Goal:** Two users can login and see dashboard

### Phase 2: Core CRUD (Days 4-10)
- [ ] Backend: Bean, Grinder, Method models with household_id + CRUD
- [ ] Backend: BrewLog model with user_id (who logged it) + CRUD
- [ ] Frontend: List pages for all entities
- [ ] Frontend: Create/edit forms
- [ ] Frontend: Delete functionality
- [ ] Frontend: Show who brewed each log

**Goal:** Full CRUD for shared data

### Phase 3: Polish + Features (Days 11-20)
- [ ] Backend: Cost calculations, analytics queries
- [ ] Frontend: Analytics dashboard with charts
- [ ] Frontend: Inventory stats
- [ ] Frontend: Error handling, loading states
- [ ] Frontend: Responsive design
- [ ] Frontend: Settings page to manage household members

**Goal:** Beautiful, functional, shared app

### Phase 4: Deployment + Open Source (Days 21-30)
- [ ] Docker setup (backend + frontend)
- [ ] docker-compose for local dev
- [ ] Documentation (README, DEPLOYMENT, CONTRIBUTING)
- [ ] GitHub repo setup
- [ ] Deploy to DigitalOcean
- [ ] Test with two users in production

**Goal:** Live, self-hostable, multi-user app

---

## Key Implementation Details to Decide

### Backend
- [ ] Password hashing: bcrypt or Argon2?
- [ ] JWT secret: environment variable?
- [ ] Token expiration: 24h? 7 days?
- [ ] Invite code format and expiration?
- [ ] Rate limiting?
- [ ] CORS: allow frontend domain only?

### Frontend
- [ ] Token storage: localStorage, sessionStorage, or cookies?
- [ ] Auto-logout on token expiration?
- [ ] Error toast/alert UI?
- [ ] Loading skeleton UI or spinners?

### Database
- [ ] Soft delete or hard delete?
- [ ] Cascade deletes (delete user → delete their BrewLogs)?
- [ ] Indexes on frequently queried fields?
- [ ] Database backups strategy?

---

## Testing Checklist

- [ ] First user can register (no users exist)
- [ ] After first user, /register returns 403
- [ ] Second user cannot register, must use /join
- [ ] Admin can generate invite codes
- [ ] Users can join with valid invite code
- [ ] Invalid/expired codes rejected
- [ ] All can login independently
- [ ] All see same beans/grinders/methods
- [ ] Can create bean (visible to all household users)
- [ ] Can log brew (shows who logged it)
- [ ] Can edit/delete shared equipment
- [ ] Logout clears token, redirects to login
- [ ] All responsive on mobile

---

## Self-Hosting Instructions (For Users)

Create DEPLOYMENT.md covering:
1. Clone repo
2. Setup .env files
3. Create PostgreSQL database
4. Run docker-compose up
5. **First user:** Visit /register to claim the instance (becomes admin)
6. **Other users:** Admin generates invite code in /settings, share with household members
7. **Others join:** They visit /join with the invite code
8. All users access on same domain (e.g., coffee.yourdomain.com)
9. For production: buy domain, use Nginx, get SSL cert

---

## Testing Strategy

### Backend API Tests
Once Phase 1 (auth) is complete, test these routes:
- `POST /api/auth/register` - First user registration (should succeed if no users exist)
- `POST /api/auth/register` - Second user registration (should fail with 403)
- `POST /api/auth/join` - Valid invite code (should succeed)
- `POST /api/auth/join` - Invalid/expired code (should fail with 400)
- `POST /api/auth/login` - Valid credentials (should return token)
- `POST /api/auth/login` - Invalid credentials (should fail with 401)
- All other routes with missing/invalid token (should fail with 401)

### Frontend Testing (Manual)
- Blank instance: Can register as first user
- After first user: /register shows "Registration closed" or similar
- Can login with registered credentials
- Token persists across page reload
- Logout clears token and redirects to /login
- Protected pages redirect to /login if not authenticated
- Each phase adds more pages to test (beans, grinders, etc.)

---

## Debugging Tips

**Backend Issues:**
- Check CORS settings in main.py if frontend can't connect
- Use `print()` or logging to debug request/response in routers
- Test endpoints directly in Swagger UI (http://localhost:8000/docs)
- Check PostgreSQL connection: `psql -U postgres -d coffee_db`
- JWT decode errors usually mean token expired or secret mismatch

**Frontend Issues:**
- Check browser DevTools → Network tab for API responses
- Check localStorage for token: `localStorage.getItem('token')`
- Use `console.log()` to debug state in components
- Check next.config.js for CORS/proxy settings if needed
- Clear .next/ folder if hot reload fails: `rm -rf .next`

**Database Issues:**
- Check constraints: `\d table_name` in psql
- View logs: `docker logs <container_id>` if using Docker
- Ensure migrations are run: `alembic current` shows current version

---

## PR Checklist (Before Pushing)

- [ ] Code runs locally without errors
- [ ] All new routes tested in Swagger UI or via curl
- [ ] Frontend pages tested in browser
- [ ] No console errors in browser DevTools
- [ ] Environment variables documented in .env.example
- [ ] Database migrations created and tested
- [ ] Commit message follows convention: `<type>: <description>`
- [ ] No debug console.log() or print() statements left in code
- [ ] Related documentation (CLAUDE.md, etc.) updated if needed

---

## File & Folder Purpose (Once Created)

| Path | Purpose |
|------|---------|
| `backend/app/main.py` | FastAPI app initialization, route includes, CORS setup |
| `backend/app/models.py` | SQLAlchemy ORM models (User, Bean, Grinder, etc.) |
| `backend/app/schemas.py` | Pydantic validation schemas for request/response bodies |
| `backend/app/crud.py` | Database operations (create, read, update, delete) |
| `backend/app/auth.py` | JWT, password hashing, token validation |
| `backend/app/dependencies.py` | `get_current_user()`, `get_db()` dependency functions |
| `frontend/app/page.tsx` | Public home page (shows login/register/join buttons) |
| `frontend/app/login/page.tsx` | Login form, calls `/api/auth/login` |
| `frontend/app/register/page.tsx` | Register form, calls `/api/auth/register` |
| `frontend/app/join/page.tsx` | Join form (invite code + password), calls `/api/auth/join` |
| `frontend/lib/api.ts` | Axios instance with auth headers, wraps API calls |
| `frontend/lib/store.ts` | Zustand store for auth state and API cache |

---

## Bare-Bones Reminders

- **No final code here.** Structure only.
- **One instance per household, forever.** First user claims it, registration disabled after.
- **Invite codes for new users.** Admin generates, shares codes to add household members.
- **All users share all data.** No filtering, no isolation.
- **BrewLog tracks who.** So you know who brewed each cup.
- **Test the flow:** Blank → Register first user → /register disabled → Generate code → Second user joins.
- **Decide as you go.** You'll know better what's needed once you start.
- **Test in browser frequently.** Don't build in isolation.
- **Commit regularly.** Small, meaningful commits.
- **Git is your safety net.** Experiment fearlessly.

---

Good luck building! ☕