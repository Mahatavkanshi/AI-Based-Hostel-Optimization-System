# AI-Based Hostel Optimization System

Free and open-source hostel management backend for a final-year BTech CSE project.

## Stack

- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- JWT authentication
- bcrypt password hashing

Everything in this project can run locally using free tools.

## Current Modules

- Authentication
- User and role management
- Hostel master data
- Hostel application and allocation
- Fee management
- Leave management
- Visitor management
- Complaint management

## Project Structure

```text
prisma/
  schema.prisma
  seed.js
src/
  app.js
  server.js
  config/
  lib/
  middlewares/
  modules/
  routes/
  utils/
```

## Free Local Setup

### 1. Install software

- Node.js 18+ or later
- PostgreSQL 14+ or later
- npm

### 2. Install dependencies

```bash
npm install
```

### 3. Create environment file

Copy `.env.example` to `.env` and update the values.

Example:

```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/hostel_management_system?schema=public"
PORT=4000
NODE_ENV="development"
JWT_SECRET="replace-with-a-long-random-secret"
JWT_EXPIRES_IN="1d"
ADMIN_EMAIL="admin@campus.local"
ADMIN_PASSWORD="ChangeMe123!"
```

### 4. Create database

Create a PostgreSQL database named `hostel_management_system`.

### 5. Run Prisma migration

```bash
npx prisma migrate dev --name init
```

### 6. Seed default data

```bash
npm run prisma:seed
```

This seeds:

- default roles
- one campus
- boys and girls hostels
- blocks, floors, rooms, and beds
- fee structures
- one admin login from `.env`

### 7. Start backend

```bash
npm run dev
```

Health check:

```bash
GET http://localhost:4000/api/health
```

## First Login

Use the admin credentials from `.env`:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Login endpoint:

```bash
POST /api/auth/login
```

Request body:

```json
{
  "email": "admin@campus.local",
  "password": "ChangeMe123!"
}
```

Use the returned token as:

```text
Authorization: Bearer <token>
```

## API Overview

### Auth

- `POST /api/auth/login`
- `GET /api/auth/me`

### Users

- `GET /api/users`
- `GET /api/users/reference-data`
- `POST /api/users/students`
- `POST /api/users/staff`

### Hostels

- `GET /api/hostels/campuses`
- `GET /api/hostels`
- `GET /api/hostels/:hostelId`
- `POST /api/hostels`
- `POST /api/hostels/:hostelId/blocks`
- `POST /api/hostels/blocks/:blockId/floors`
- `POST /api/hostels/floors/:floorId/rooms`
- `POST /api/hostels/floors/:floorId/rooms-with-beds`
- `POST /api/hostels/rooms/:roomId/beds`
- `PATCH /api/hostels/beds/:bedId/status`

### Applications And Allocation

- `GET /api/hostel-management/applications`
- `POST /api/hostel-management/applications`
- `PATCH /api/hostel-management/applications/:applicationId/review`
- `GET /api/hostel-management/allocations`
- `POST /api/hostel-management/allocations`
- `PATCH /api/hostel-management/allocations/:allocationId/complete`

### Fees

- `GET /api/fees/structures`
- `POST /api/fees/structures`
- `GET /api/fees/invoices`
- `POST /api/fees/invoices`
- `POST /api/fees/invoices/:invoiceId/payments`
- `GET /api/fees/dashboard`

### Leaves

- `GET /api/leaves`
- `POST /api/leaves`
- `PATCH /api/leaves/:leaveId/review`

### Visitors

- `GET /api/visitors/requests`
- `POST /api/visitors/requests`
- `PATCH /api/visitors/requests/:requestId/review`
- `GET /api/visitors/entry-logs`
- `POST /api/visitors/entry-logs/check-in`
- `PATCH /api/visitors/entry-logs/:entryLogId/check-out`

### Complaints

- `GET /api/complaints`
- `GET /api/complaints/reference-data`
- `POST /api/complaints`
- `PATCH /api/complaints/:complaintId/assign`
- `PATCH /api/complaints/:complaintId/updates`

## Suggested Demo Flow

1. Login as admin
2. Create warden, gatekeeper, supervisor, and student accounts
3. View hostel structure
4. Login as student and apply for hostel
5. Login as warden and approve application
6. Allocate bed to student
7. Generate fee invoice and record payment
8. Create leave request and approve it
9. Create visitor request and record gate entry
10. Raise complaint and resolve it

## Important Notes

- This project currently uses local JWT-based authentication
- Payment flow is manual/offline for free usage and demo simplicity
- Prisma seed config in `package.json` works on Prisma 6, though Prisma 7 recommends a dedicated config file
- Some npm packages may report vulnerabilities; review with `npm audit` before production use

## Good Next Improvements

- request validation middleware for all routes
- notice and dashboard modules
- audit logging on important actions
- frontend dashboard using free libraries only
