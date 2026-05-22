# Deployment Guide

This guide covers deploying Coffee Management System to a self-hosted server (e.g. DigitalOcean, Hetzner, or a home server).

---

## Prerequisites

- A Linux server (Ubuntu 22.04 recommended)
- Docker + docker-compose installed
- A domain name pointing to your server (optional but recommended)

---

## 1. Install Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

---

## 2. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/cms-coffee-management-system.git
cd cms-coffee-management-system
```

---

## 3. Configure Environment Variables

```bash
# Backend
cp backend/.env.example backend/.env
nano backend/.env
```

Set these values:
```env
DATABASE_URL=postgresql://coffee_user:STRONG_PASSWORD@db:5432/coffee_db
JWT_SECRET=generate-a-long-random-string-here
JWT_ALGORITHM=HS256
JWT_EXPIRATION_DAYS=7
CORS_ORIGINS=https://coffee.yourdomain.com
```

```bash
# Frontend
cp frontend/.env.local.example frontend/.env.local
nano frontend/.env.local
```

Set:
```env
NEXT_PUBLIC_API_URL=https://coffee.yourdomain.com
```

---

## 4. Start with Docker Compose

```bash
docker-compose up -d
```

This starts:
- **PostgreSQL** on internal port 5432
- **FastAPI backend** on port 8000
- **Next.js frontend** on port 3000

---

## 5. Claim Your Instance

1. Visit `http://YOUR_SERVER_IP:3000/register`
2. Create your admin account — **the first user becomes admin and claims the instance**
3. After registration, `/register` is permanently disabled
4. Go to **Settings** to generate invite codes for your household

---

## 6. Nginx Reverse Proxy (Recommended)

Install Nginx:
```bash
sudo apt install nginx
```

Create `/etc/nginx/sites-available/coffee`:
```nginx
server {
    listen 80;
    server_name coffee.yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable it:
```bash
sudo ln -s /etc/nginx/sites-available/coffee /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 7. SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d coffee.yourdomain.com
```

Certbot will auto-renew. Verify: `sudo certbot renew --dry-run`

---

## 8. Database Backups

Add a daily cron job:
```bash
crontab -e
```

```cron
0 2 * * * docker exec cms-db pg_dump -U coffee_user coffee_db | gzip > /backups/coffee_$(date +\%Y\%m\%d).sql.gz
```

---

## Updating

```bash
git pull origin main
docker-compose down
docker-compose build
docker-compose up -d
```

---

## DigitalOcean Quick Start

1. Create a Droplet: Ubuntu 22.04, 1 GB RAM minimum (2 GB recommended)
2. SSH in: `ssh root@YOUR_IP`
3. Follow steps 1–7 above
4. Optionally point a domain at the droplet IP

Estimated cost: ~$6–12/month for a basic droplet.
