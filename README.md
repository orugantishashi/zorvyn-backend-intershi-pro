# zorvyn-backend-intership-project
# 💰 Finance Management Backend API

## 📌 Overview

This project is a **Finance Management Backend System** built using **Node.js, Express, and MongoDB**.
It allows users to manage financial records such as income and expenses with **secure authentication and role-based access control (RBAC)**.
---

## 🚀 Features

### 🔐 Authentication

* User Registration & Login
* Password hashing using bcrypt
* JWT-based authentication

---

## 👥 Role-Based Access Control

### 👤 User

* Can register and login
* Can create financial records
* Can view **their own records only**
* Can **update their own records**
* Cannot delete records of others

### 👑 Admin

* Full access to the system
* Can create, view, update, and delete **all records**
* Can manage users and assign roles

### 📊 Analyst

* Can view **all financial records**
* Can access dashboard and analytics
* Cannot create, update, or delete records

---

## 💼 Financial Records Management

* Add income and expense records
* Fields:

  * Amount
  * Type (income / expense)
  * Category
  * Date
  * Notes
* Update records (User: own, Admin: all)
* Delete records (Admin only)
* View records (User: own, Admin & Analyst: all)

---

## 📊 Dashboard API

Provides summarized financial insights:

* Total Income
* Total Expense
* Balance
* Category-wise breakdown
* Recent transactions

Access:

* User → Own dashboard
* Admin → All or specific user
* Analyst → Read-only analytics

---

## 🔎 Advanced Features

* Pagination
* Sorting
* Filtering:

  * Category
  * Type (income/expense)
  * Date range
* Rate limiting middleware

---

## 🔐 Security

* Passwords stored using hashing (bcrypt)
* JWT authentication
* Protected routes using middleware
* Environment variables for sensitive data

---

## 🛠 Tech Stack

* Node.js
* Express.js
* MongoDB (Mongoose)
* JWT
* bcrypt

---

## 📁 Project Structure

```
config/
controllers/
middleware/
model/
routes/
server.js
seed.js
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the repository

```
git clone <your-repo-link>
cd finance-backend
```

### 2️⃣ Install dependencies

```
npm install
```

### 3️⃣ Create `.env` file

```
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

### 4️⃣ Run the server

```
npm start
```

---

## 🌱 Seed Demo Users

Run:

```
node seed.js
```

### Demo Credentials

**Admin:**

* Email: [admin@gmail.com](mailto:admin@gmail.com)
* Password: admin123

**User:**

* Email: [user@gmail.com](mailto:user@gmail.com)
* Password: user123

---

## 📡 API Endpoints

### 🔐 Auth Routes

* POST `/api/auth/register`
* POST `/api/auth/login`

### 💰 Finance Routes

* POST `/api/records` → Create record (User/Admin)
* GET `/api/records` → Get records (User: own, Admin/Analyst: all)
* PUT `/api/records/:id` → Update record (User: own, Admin: all)
* DELETE `/api/records/:id` → Delete record (Admin only)

### 📊 Dashboard

* GET `/api/records/dashboard`

---

## 🧪 Example Requests

### Login

```
POST /api/auth/login
```

### Get Records

```
GET /api/records?page=1&limit=10
```

### Dashboard

```
GET /api/records/dashboard
```

---

## 🎯 Future Enhancements

* Email notifications
* Frontend integration
* Deployment (AWS / Render)

---

## 📌 Notes

* Designed with scalability and modular architecture
* Easily extendable for additional features

---

## 👨‍💻 Author

Shashi Kumar
