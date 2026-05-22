# Changelog

All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] — 2026-05-22

First public release. 🎉

### Added

**Auth & Instance Setup**
- First-user registration claims the instance and becomes admin
- `/register` is permanently disabled once any user exists
- Admin generates single-use invite codes with configurable expiration
- Other users join via `/join` with an invite code
- JWT authentication with 7-day sessions (bcrypt passwords)
- `/api/auth/status` endpoint so the frontend adapts to instance state

**Bean Inventory**
- Track name, roaster, origin, roast date, purchase date, cost
- Record quantity (grams) and mark beans as available/empty
- 1–5 star rating and freeform notes per bean
- Full CRUD — all household members share the same inventory

**Grinders**
- Track grinder name, model, manufacturer, notes
- Save named settings profiles per grinder (e.g. "V60 light roast → 15")
- Full CRUD with nested profile management

**Brew Methods**
- Track methods by name and category (pour-over, espresso, immersion, etc.)
- Full CRUD

**Brew Logs**
- Log every brew: bean, method, grinder (optional), measurements
  - Coffee amount (g), water amount (g), temperature (°C), brew time (s)
  - Grinder setting, grind size description
- 1–5 star rating and notes per brew
- Brew date recorded; user who logged it is always tracked
- Only the original brewer or admin can edit/delete a log
- Paginated list (newest first, 20 per page)
- Detail view with auto-calculated brew ratio

**Analytics**
- Total brews, average rating, total coffee brewed
- Most-used bean and brew method
- Bean inventory table with remaining quantities highlighted when low

**Settings (Admin)**
- Generate invite codes with 1/3/7/30 day expiration
- Copy code to clipboard in one click
- Revoke unused codes
- View history of used codes

**Infrastructure**
- FastAPI backend with SQLAlchemy ORM + PostgreSQL
- Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand
- `docker-compose.yml` for production deployment
- `docker-compose.dev.yml` for local development with hot reload
  - Backend: uvicorn `--reload` (source volume-mounted)
  - Frontend: Next.js dev server (source volume-mounted)
  - PostgreSQL exposed on :5432 for DB tools
- MIT license, README, DEPLOYMENT.md, CONTRIBUTING.md

[0.1.0]: https://github.com/your-username/cms-coffee-management-system/releases/tag/v0.1.0
