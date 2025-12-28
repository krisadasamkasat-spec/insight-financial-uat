# Insight Financial

ระบบจัดการการเงินสำหรับธุรกิจฝึกอบรม (Training Business Financial Management System)

## 🚀 Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 19 + Vite + TailwindCSS |
| Backend | Express 5 + Node.js |
| Database | PostgreSQL |

## 📁 Project Structure

```
insight-financial/
├── client/          # React Frontend
├── server/          # Express Backend API
│   └── database/    # SQL schema files
└── README.md
```

## 🛠️ Local Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 1. Database Setup
```bash
# Create database
psql -U postgres -c "CREATE DATABASE insight_financial_db;"

# Run schema
psql -U postgres -d insight_financial_db -f server/database/schema.sql
```

### 2. Backend Setup
```bash
cd server
cp .env.example .env
# Edit .env with your database credentials
npm install
npm run dev
```

### 3. Frontend Setup
```bash
cd client
cp .env.example .env.development
npm install
npm run dev
```

## 🌐 Environment Variables

### Server (.env)
```
PORT=3000
NODE_ENV=development
DB_USER=postgres
DB_HOST=localhost
DB_NAME=insight_financial_db
DB_PASSWORD=your_password
DB_PORT=5432
```

### Client (.env.development)
```
VITE_API_URL=http://localhost:3000/api
```

## 📚 Features
- 📊 Dashboard with financial overview
- 📁 Project management
- 💰 Income & Expense tracking
- 👥 Team member management
- 📈 Financial reports
- 🏦 Bank account management

## 📄 License
Private - All Rights Reserved
