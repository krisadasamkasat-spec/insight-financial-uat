# Insight Financial - UAT Deployment Guide

## Overview
คู่มือนี้จะช่วยให้คุณ deploy ระบบ Insight Financial ขึ้น UAT server สำหรับให้ผู้บริหารทดสอบ

---

## Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- UAT Server (VPS หรือ Cloud VM)

---

## Step 1: Prepare Database

```bash
# บน UAT server - สร้าง database
psql -U postgres -c "CREATE DATABASE insight_financial_db;"

# Import schema และ reference data
psql -U postgres -d insight_financial_db -f setup_reference_data.sql
```

---

## Step 2: Configure Server (Backend)

### 2.1 สร้างไฟล์ `.env` สำหรับ UAT
```env
PORT=3000
NODE_ENV=production

# Database - ใส่ค่าของ UAT server
DB_USER=postgres
DB_HOST=localhost          # หรือ IP ของ database server
DB_NAME=insight_financial_db
DB_PASSWORD=your_secure_password
DB_PORT=5432
```

### 2.2 Install และ Run
```bash
cd server
npm install --production
npm start
# หรือใช้ PM2 สำหรับ production
npm install -g pm2
pm2 start index.js --name "insight-api"
```

---

## Step 3: Configure Client (Frontend)

### 3.1 สร้างไฟล์ `.env.production` 
```env
VITE_API_URL=http://YOUR_UAT_SERVER_IP:3000/api
```

### 3.2 Build สำหรับ Production
```bash
cd client
npm install
npm run build
```

### 3.3 Deploy static files
ไฟล์ build จะอยู่ใน `client/dist/` สามารถ deploy ไปบน:
- **Nginx** (แนะนำ)
- Apache
- Cloud Storage (S3, Firebase Hosting)

---

## Step 4: Nginx Configuration (แนะนำ)

```nginx
# /etc/nginx/sites-available/insight-financial

server {
    listen 80;
    server_name your-uat-domain.com;

    # Frontend
    location / {
        root /var/www/insight-financial/dist;
        try_files $uri $uri/ /index.html;
    }

    # API Proxy
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/insight-financial /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Quick Deploy Script

สร้างไฟล์ `deploy.sh`:

```bash
#!/bin/bash
echo "🚀 Deploying Insight Financial..."

# Build frontend
cd client
npm run build

# Copy to server (adjust path)
scp -r dist/* username@SERVER_IP:/var/www/insight-financial/dist/

# Restart backend
ssh username@SERVER_IP "cd /app/server && pm2 restart insight-api"

echo "✅ Deployment complete!"
```

---

## Checklist Before UAT

- [ ] Database migrated with correct schema
- [ ] Reference data loaded (roles, project_types, financial_statuses)
- [ ] `.env` files configured correctly
- [ ] CORS enabled for UAT domain (if different from API server)
- [ ] API tested via Postman/curl
- [ ] Frontend loads correctly
- [ ] Login/Authentication working (if applicable)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS Error | เพิ่ม domain ใน `cors()` config ใน `server/index.js` |
| 404 on refresh | ตรวจสอบ `try_files` ใน Nginx config |
| Database connection failed | ตรวจสอบ `.env` และ firewall rules |
| API returns 500 | ดู logs ด้วย `pm2 logs insight-api` |

---

## Contact
หากมีปัญหาในการ deploy ติดต่อทีมพัฒนา
