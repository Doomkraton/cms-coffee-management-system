# Changelog

All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- markdownlint-disable MD024 -->

---

## [0.2.0] — 2026-05-22

### Added

#### User Management (Admin)

- Settings → Members tab: list all household members with their brew count and join date
- Edit any member's name or email inline
- Reset any member's password without needing their current one (recovery)
- Delete a member — shows how many brew logs will also be removed before confirming
- Guards: cannot delete yourself, cannot delete other admins
- Settings → My Profile tab: all users can edit their own name, email, and password
  - Own password change requires current password for verification
- Settings reorganised into tabbed layout: My Profile / Members / Invite Codes / Instance

#### Cost Tracking

- Cost per brew displayed on brew list rows and brew detail page
- Analytics → Cost Tracking section: total spent, average cost per brew, coverage ratio
- Bean inventory table extended with purchase price and cost-per-gram columns
- Dashboard: "Total Spent" stat card (replaces Available Beans when cost data exists)
- Settings → Instance tab (admin): toggle cost display on/off household-wide
- 15 supported currencies: USD, EUR, GBP, **CZK**, PLN, CHF, SEK, NOK, DKK, HUF, RON, BGN, JPY, AUD, CAD
  - Correct symbol placement per currency (e.g. `32.00 Kč` vs `$32.00`)

#### Stock Tracking

- Logging a brew automatically subtracts `coffee_amount` from the bean's stock
- Deleting a brew returns the coffee to stock
- Editing a brew adjusts only the delta (handles bean switches too)
- Bean auto-marked as unavailable when stock hits 0g
- New brew form shows live stock preview: `250g → 232g after brew`, turns red below 20g

#### Contextual Grinder Profiles

- Grinder profiles redesigned: attach a setting to a specific bean + method combination
- Profile specificity ranking: exact (bean + method) > bean-only > method-only > general fallback
- New brew form auto-fetches the best matching profile when grinder + bean + method are selected
  - Shows amber suggestion banner `💡 Suggested: 24 clicks (exact match)` with Apply button

### Fixed

- Cost basis now uses `quantity_purchased_grams` exclusively — never falls back to the
  mutable `quantity_grams`, which would silently inflate cost-per-gram after each brew
- `quantity_purchased_grams` is auto-set at bean creation time if not provided, so cost
  tracking works out of the box without users needing to fill in a separate field

---

## [0.1.0] — 2026-05-22

First public release. 🎉

### Added

#### Auth & Instance Setup

- First-user registration claims the instance and becomes admin
- `/register` is permanently disabled once any user exists
- Admin generates single-use invite codes with configurable expiration
- Other users join via `/join` with an invite code
- JWT authentication with 7-day sessions (bcrypt passwords)
- `/api/auth/status` endpoint so the frontend adapts to instance state

#### Bean Inventory

- Track name, roaster, origin, roast date, purchase date, cost
- Record quantity (grams) and mark beans as available/empty
- 1–5 star rating and freeform notes per bean
- Full CRUD — all household members share the same inventory

#### Grinders

- Track grinder name, model, manufacturer, notes
- Save named settings profiles per grinder (e.g. "V60 light roast → 15")
- Full CRUD with nested profile management

#### Brew Methods

- Track methods by name and category (pour-over, espresso, immersion, etc.)
- Full CRUD

#### Brew Logs

- Log every brew: bean, method, grinder (optional), measurements
  - Coffee amount (g), water amount (g), temperature (°C), brew time (s)
  - Grinder setting, grind size description
- 1–5 star rating and notes per brew
- Brew date recorded; user who logged it is always tracked
- Only the original brewer or admin can edit/delete a log
- Paginated list (newest first, 20 per page)
- Detail view with auto-calculated brew ratio

#### Analytics

- Total brews, average rating, total coffee brewed
- Most-used bean and brew method
- Bean inventory table with remaining quantities highlighted when low

#### Settings (Admin)

- Generate invite codes with 1/3/7/30 day expiration
- Copy code to clipboard in one click
- Revoke unused codes
- View history of used codes

#### Infrastructure

- FastAPI backend with SQLAlchemy ORM + PostgreSQL
- Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand
- `docker-compose.yml` for production deployment
- `docker-compose.dev.yml` for local development with hot reload
  - Backend: uvicorn `--reload` (source volume-mounted)
  - Frontend: Next.js dev server (source volume-mounted)
  - PostgreSQL exposed on :5432 for DB tools
- MIT license, README, DEPLOYMENT.md, CONTRIBUTING.md

[0.2.0]: https://github.com/Doomkraton/cms-coffee-management-system/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/Doomkraton/cms-coffee-management-system/releases/tag/v0.1.0
