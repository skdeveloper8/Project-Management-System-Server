# Project-Management-System-Server

---

## Backend API Endpoints

### User
- **POST** `/user/register` - Register a new user
- **POST** `/user/login` - Login
- **POST** `/user/logout` - Logout
- **GET** `/user/refresh` - Refresh access token using refresh token

### Projects
- **GET** `/project/:id` - Get project details with tasks
- **POST** `/project` - Create new project
- **PATCH** `/project/:id` - Update project
- **DELETE** `/project` - Delete multiple projects by IDs

### Tasks
- **GET** `/task/:id` - Get task details
- **POST** `/task` - Create a new task
- **PATCH** `/task/:id` - Update task
- **DELETE** `/task/:id` - Delete task

---

## Getting Started

### Frontend

```bash
# Install dependencies
npm install

# Start dev server
npm run dev


### Backend
# Install dependencies
npm install

# Start server
npm run dev

