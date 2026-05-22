# ☕ Coffee Management System

A self-hosted, open-source coffee tracking app for your household. Track your beans, grinders, brew methods, and brew logs — all shared between household members.

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Stack](https://img.shields.io/badge/stack-FastAPI%20%2B%20Next.js%20%2B%20PostgreSQL-blue)

---

## Features

- 🏠 **Self-hosted** — Your data, your server
- 👥 **Household sharing** — All members see and edit the same data
- 🔐 **Invite-code onboarding** — First user claims the instance, others join via invite codes
- 🫘 **Bean inventory** — Track origin, roaster, roast date, quantity, and cost
- ⚙️ **Grinder profiles** — Save grinder settings per bean/method combo
- ☕ **Brew logs** — Record water temp, grind size, brew time, rating, and notes
- 📊 **Analytics** — See stats across all your brews (coming in Phase 3)
- 📱 **Responsive** — Works on mobile, tablet, and desktop

---

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Backend   | Python 3.12 + FastAPI + SQLAlchemy  |
| Frontend  | Next.js 14 + TypeScript + Tailwind  |
| Database  | PostgreSQL                          |
| Auth      | JWT (7-day sessions)                |
| Packaging | Docker + docker-compose             |

---

## Quick Start (Local Development)

### Prerequisites
- Python 3.12+
- Node.js 18+
- PostgreSQL 15+

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/cms-coffee-management-system.git
cd cms-coffee-management-system
```

### 2. Backend setup
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET
```

### 3. Frontend setup
```bash
cd frontend
npm install

cp .env.local.example .env.local
# Edit .env.local with your API URL
```

### 4. Start everything
```bash
# Terminal 1 — Backend
cd backend
uvicorn app.main:app --reload

# Terminal 2 — Frontend
cd frontend
npm run dev
```

### 5. Claim your instance
1. Visit `http://localhost:3000/register`
2. Create your admin account (first user claims the instance)
3. Go to **Settings** → generate an invite code for your household members
4. Other users visit `/join` and enter the invite code to sign up

---

## Self-Hosting with Docker

See [DEPLOYMENT.md](DEPLOYMENT.md) for full instructions including:
- Docker + docker-compose setup
- PostgreSQL in Docker
- Nginx reverse proxy
- SSL/HTTPS with Let's Encrypt
- DigitalOcean deployment guide

---

## Project Structure

```
cms-coffee-management-system/
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── main.py           # App entry, CORS, routers
│   │   ├── models.py         # SQLAlchemy ORM models
│   │   ├── schemas.py        # Pydantic request/response schemas
│   │   ├── crud.py           # Database operations
│   │   ├── auth.py           # JWT + password hashing
│   │   ├── dependencies.py   # FastAPI dependencies
│   │   └── routers/          # Route handlers
│   └── requirements.txt
├── frontend/                 # Next.js application
│   ├── app/                  # App Router pages
│   ├── components/           # Shared components
│   └── lib/                  # API client, Zustand store, types
├── docker-compose.yml
├── DEPLOYMENT.md
├── CONTRIBUTING.md
└── LICENSE
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to get set up, the branch strategy, and our PR process.

---

## License

[MIT](LICENSE) — free to use, modify, and self-host.
