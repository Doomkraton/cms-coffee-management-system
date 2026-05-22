# Contributing to Coffee Management System

Thanks for your interest in contributing! This is a self-hosted household coffee tracker — contributions that improve usability, performance, or self-hosting experience are very welcome.

---

## Getting Started

1. **Fork** the repo on GitHub
2. **Clone** your fork locally
3. Follow the setup steps in [README.md](README.md)
4. Create a feature branch: `git checkout -b feature/your-feature`

---

## Branch Strategy

```
main          ← production-ready releases only
  └── develop ← integration branch
      ├── feature/auth-household
      ├── feature/beans-crud
      └── fix/invite-code-expiry
```

- Always branch off `develop`
- PR target: `develop`
- `main` is only updated for releases

---

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <short description>

<optional body>

<optional footer>
```

Types:
- `feat` — new feature
- `fix` — bug fix
- `docs` — documentation only
- `chore` — tooling, config, non-code
- `refactor` — code change, no new feature or fix
- `test` — adding or fixing tests
- `style` — formatting (no logic changes)

Examples:
```
feat(auth): implement invite code validation
fix(beans): correct quantity calculation on update
docs: add docker-compose setup to DEPLOYMENT.md
```

---

## Pull Request Checklist

Before opening a PR, make sure:

- [ ] Code runs locally without errors
- [ ] New API routes tested in Swagger UI (`http://localhost:8000/docs`)
- [ ] Frontend tested in browser at mobile (375px) and desktop widths
- [ ] No `console.log()` / `print()` debug statements left in code
- [ ] Environment variables added to `.env.example` / `.env.local.example`
- [ ] Database migrations created with `alembic revision --autogenerate`
- [ ] Commit messages follow the convention above

---

## Code Style

**Python (backend):**
- Follow PEP 8
- Type hints on all function signatures
- Docstrings on public functions

**TypeScript (frontend):**
- Use TypeScript strictly — avoid `any`
- Components in `PascalCase`, utilities in `camelCase`
- Keep components small and focused

---

## Questions?

Open a GitHub issue or start a discussion. We're friendly.
