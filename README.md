# FinTrack — Personal Finance Tracker

A production-ready, full-stack personal finance tracker built with modern technologies. Track income, expenses, and budgets with beautiful visualizations.

![FinTrack Dashboard](https://via.placeholder.com/1200x600/0f0f11/6ee7b7?text=FinTrack+Dashboard)

## ✨ Features

### Authentication
- JWT access + refresh token rotation (access: 15m, refresh: 7d)
- HttpOnly cookie for refresh token (CSRF protection)
- Bcrypt password hashing
- Persistent login with automatic token refresh

### Transactions
- Full CRUD with pagination and sorting
- Filter by date range, category, and type
- Monthly, weekly, and rolling 3-month summaries
- Category-level spending breakdown
- CSV export

### Budgets
- Per-category monthly budgets
- Real-time usage calculation with alerts
- Visual progress indicators
- Exceeded budget notifications

### Dashboard
- Income vs expense area charts
- Category pie chart breakdown
- Weekly bar chart
- 3-month rolling average trend
- Budget usage indicators
- Savings rate calculation

---

## 🗂 Project Structure

```
fintrack/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── src/
│   │   ├── config/                # env, database, logger, swagger
│   │   ├── controllers/           # Request handlers
│   │   ├── middleware/            # Auth, error, validation, logging
│   │   ├── repositories/         # Database access layer
│   │   ├── routes/                # Express routes
│   │   ├── services/              # Business logic
│   │   ├── utils/                 # JWT, errors, response helpers
│   │   ├── validators/            # Zod schemas
│   │   ├── jobs/                  # Background cron jobs
│   │   ├── app.ts                 # Express app setup
│   │   └── server.ts              # Server entry point
│   ├── tests/
│   │   ├── unit/                  # Service unit tests
│   │   └── integration/           # API integration tests
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/                   # Axios client + service functions
│   │   ├── components/
│   │   │   ├── forms/             # React Hook Form components
│   │   │   ├── layout/            # AppLayout, ProtectedRoute
│   │   │   └── ui/                # Reusable components
│   │   ├── context/               # Auth + Theme context
│   │   ├── hooks/                 # React Query hooks
│   │   ├── pages/                 # Page components
│   │   ├── types/                 # TypeScript types
│   │   ├── utils/                 # Formatters, helpers
│   │   └── styles/                # Global CSS
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
└── docker-compose.yml
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Docker (optional)

### Option 1: Docker Compose (Recommended)

```bash
# Clone the repo
git clone https://github.com/yourusername/fintrack.git
cd fintrack

# Set JWT secrets
echo "JWT_ACCESS_SECRET=your-super-secret-access-key-minimum-32-chars-long
JWT_REFRESH_SECRET=your-super-secret-refresh-key-minimum-32-chars-long" > .env

# Start everything
docker-compose up -d

# Access:
# Frontend: http://localhost:5173
# Backend:  http://localhost:5000
# API Docs: http://localhost:5000/api-docs
```

### Option 2: Manual Setup

#### Backend

```bash
cd backend

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database URL and JWT secrets

# Run database migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Start development server
npm run dev
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## 🔑 API Documentation

Interactive Swagger docs available at `http://localhost:5000/api-docs`

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Register new user |
| `POST` | `/auth/login` | Login user |
| `POST` | `/auth/logout` | Logout (revoke refresh token) |
| `POST` | `/auth/refresh` | Rotate tokens |
| `GET`  | `/auth/me` | Get current user |

### Transaction Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/transactions` | List with filters + pagination |
| `POST` | `/transactions` | Create transaction |
| `GET`  | `/transactions/:id` | Get by ID |
| `PUT`  | `/transactions/:id` | Update |
| `DELETE` | `/transactions/:id` | Delete |
| `GET`  | `/transactions/summary/monthly?month=&year=` | Monthly summary |
| `GET`  | `/transactions/summary/weekly?startDate=&endDate=` | Weekly summary |
| `GET`  | `/transactions/summary/category-breakdown` | Category breakdown |
| `GET`  | `/transactions/summary/rolling-average` | 3-month rolling avg |

### Budget Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/budgets?month=&year=` | List budgets with usage |
| `POST` | `/budgets` | Create budget |
| `GET`  | `/budgets/:id` | Get by ID |
| `PUT`  | `/budgets/:id` | Update budget amount |
| `DELETE` | `/budgets/:id` | Delete budget |

### Category Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/categories` | List all categories |
| `POST` | `/categories` | Create custom category |
| `PUT`  | `/categories/:id` | Update category |
| `DELETE` | `/categories/:id` | Delete (if no transactions) |

---

## 🧪 Testing

```bash
cd backend

# Run all tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# With coverage report
npm run test:coverage
```

---

## 🐳 Docker

### Build images

```bash
# Build backend
docker build -t fintrack-backend ./backend

# Build frontend
docker build -t fintrack-frontend ./frontend
```

### Production deployment

```bash
docker-compose -f docker-compose.yml up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

---

## 🌍 Environment Variables

### Backend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost/db` |
| `JWT_ACCESS_SECRET` | Access token secret (min 32 chars) | `your-secret-key` |
| `JWT_REFRESH_SECRET` | Refresh token secret (min 32 chars) | `your-secret-key` |
| `JWT_ACCESS_EXPIRES_IN` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL | `7d` |
| `CORS_ORIGIN` | Frontend URL | `http://localhost:5173` |
| `BCRYPT_SALT_ROUNDS` | Password hashing rounds | `12` |
| `PORT` | API port | `5000` |

### Frontend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:5000/api/v1` |

---

## 🏗 Architecture

### Backend
- **Clean Architecture**: Controllers → Services → Repositories
- **SOLID Principles**: Single responsibility, dependency injection
- **Error handling**: Centralized middleware with typed AppError hierarchy
- **Security**: Helmet, CORS, rate limiting, JWT with rotation

### Frontend
- **Feature-based structure**: Organized by feature domain
- **API layer separation**: Services abstracted from components
- **State management**: React Query for server state, Context for client state
- **Type safety**: Full TypeScript coverage with Zod validation

---

## 🔒 Security

- Passwords hashed with bcrypt (12 rounds)
- JWT access tokens expire in 15 minutes
- Refresh tokens stored in database with rotation
- Token reuse detection (potential replay attack prevention)
- HttpOnly cookies for refresh tokens
- Helmet security headers
- CORS with origin allowlist
- Rate limiting on all routes (stricter on auth)
- SQL injection protection via Prisma ORM
- Input validation with Zod on both client and server

---

## 📦 Tech Stack

### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: Express 4
- **Database**: PostgreSQL 16
- **ORM**: Prisma 5
- **Auth**: JWT + bcrypt
- **Validation**: Zod
- **Logging**: Winston
- **Testing**: Jest + Supertest
- **Docs**: Swagger/OpenAPI 3.0
- **Jobs**: node-cron

### Frontend
- **Framework**: React 18 + TypeScript
- **Build**: Vite 5
- **Styling**: TailwindCSS 3
- **State**: React Query 5 + Context API
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **HTTP**: Axios with interceptors

---

## 📄 License

MIT © 2025 FinTrack
