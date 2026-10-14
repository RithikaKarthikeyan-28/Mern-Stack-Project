# Mern-Stack-Project

# SkillTrack — Employee Learning, Skill Development & Compliance Platform

An enterprise-grade Learning Management System (LMS) and Compliance Management platform built with the **MERN Stack** (MongoDB, Express.js, React, Node.js), powered by **Vite** and styled with **Tailwind CSS**.

---

## 🚀 Overview

**SkillTrack** empowers organizations to connect workforce skills, training curricula, assessments, verifiable certifications, and regulatory compliance into a unified organizational ecosystem.

### Key Capabilities

- **Role-Based Access Control (RBAC)**: Distinct permissions and tailored experiences for **Employees**, **Trainers**, and **Administrators**.
- **Employee Learning Portal**: Course catalog browsing, multi-module learning player with progress persistence, interactive assessments, and skill gap benchmark tracking.
- **Certificates & Verification**: Cryptographically verifiable completion certificates with QR/public lookup (`/verify-certificate/:certificateNumber`) and automated renewal workflows.
- **Compliance Oversight**: Automated tracking of annual mandatory requirements, grace periods, due-soon alerts, and audit logging.
- **Trainer Portal**: End-to-end curriculum authoring, module & lesson management, question bank builder with server-side grading rules, and learner roster performance tracking.
- **Admin Portal & Analytics**: High-level organizational KPIs, employee & department management, enrollment audit, completion trends, and CSV compliance export.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, React Router v6, Tailwind CSS, Lucide Icons, Recharts, Vite, Vitest |
| **Backend** | Node.js, Express.js, MongoDB / Mongoose, JWT (JSON Web Tokens), Bcrypt.js |
| **Security** | Helmet HTTP headers, CORS allowlist, Express Rate Limiter, NoSQL injection guard |
| **Testing** | 1,356 backend tests (Jest/Supertest) + 503 frontend tests (Vitest/Testing Library) |

---

## 📂 Project Structure

```text
MERN Stack/
├── client/                     # Frontend React SPA (Vite)
│   ├── src/
│   │   ├── components/         # Shared UI, layouts, and role widgets
│   │   ├── context/            # AuthContext, ToastContext
│   │   ├── pages/              # Employee, Trainer, Admin, and Public views
│   │   ├── routes/             # ProtectedRoute, RoleRoute, AppRoutes
│   │   └── services/           # Axios API services
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
├── server/                     # Backend REST API (Express)
│   ├── src/
│   │   ├── config/             # Environment validation and config loader
│   │   ├── controllers/        # Route controllers
│   │   ├── middleware/         # Auth, RBAC, Rate Limiter, Error handler
│   │   ├── models/             # Mongoose schemas & indexing
│   │   ├── routes/             # REST API route definitions
│   │   └── services/           # Business domain logic
│   ├── tests/                  # Automated integration & unit test suites
│   ├── package.json
│   └── .env.example
├── .gitignore                  # Root Git ignore rules
└── README.md                   # Project documentation
```

---

## ⚙️ Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **MongoDB**: v6.0 or higher (running locally on `mongodb://127.0.0.1:27017`)
- **Git**

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/RithikaKarthikeyan-28/Mern-Stack-Project.git
   cd Mern-Stack-Project
   ```

2. **Install backend dependencies**:
   ```bash
   cd server
   npm install
   ```

3. **Install frontend dependencies**:
   ```bash
   cd ../client
   npm install
   ```

---

## 🏃 Running the Application

### 1. Start MongoDB
Ensure your local MongoDB service is running:
```bash
mongod
```

### 2. Configure Environment Files
Copy the example environment configurations:
- **Server** (`server/.env`):
  ```env
  PORT=5000
  NODE_ENV=development
  MONGO_URI=mongodb://localhost:27017/skilltrack
  JWT_SECRET=development_jwt_secret_placeholder
  CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173
  ```
- **Client** (`client/.env`):
  ```env
  VITE_API_BASE_URL=/api
  ```

### 3. Start the Backend API (Port 5000)
```bash
cd server
npm run dev
```

### 4. Start the Frontend Client (Port 5173)
```bash
cd client
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 🔑 Demo Credentials

| Role | Email | Password | Primary Portal |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@skilltrack.demo` | `Password123!` | `/admin` |
| **Trainer** | `trainer@skilltrack.demo` | `Password123!` | `/trainer` |
| **Employee** | `employee@skilltrack.demo` | `Password123!` | `/dashboard` |

*New user accounts can also be self-registered at `http://localhost:5173/register` (defaults to Employee role).*

---

## 🧪 Running Tests

### Backend Tests (Jest)
```bash
cd server
npm test
```
*Baseline: 1,356 passing tests across 34 suites.*

### Frontend Tests (Vitest)
```bash
cd client
npm test
npm run lint
npm run build
```
*Baseline: 503 passing tests across 58 suites, 0 lint warnings.*

---

## 📄 License
ISC
