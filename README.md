# CampusConnect — Campus Event Management System

A full-stack MERN application for publishing campus events and letting students register for events.

## Features
- Public event listing with search and category filtering
- Register and log in using email and password
- Students can register for upcoming events and cancel their registration
- Authenticated users can view their registered events
- Admin users can create, edit, and delete events
- Event capacity and duplicate-registration checks
- Responsive React interface
- Express REST API, MongoDB/Mongoose persistence, JWT authentication
- Environment-based configuration and basic server-side validation

> This is a student project starter. Configure the first administrator securely before using it for real users. Test all flows locally before deployment.

## Tech stack
- React + Vite
- Node.js + Express
- MongoDB + Mongoose
- JSON Web Tokens (JWT), bcryptjs
- Git and GitHub

## Requirements
- Node.js LTS and npm
- MongoDB local installation or a MongoDB Atlas database
- Git (recommended)

## 1. Configure the backend
```bash
cd server
npm install
```
Copy `.env.example` to `.env` and fill in:
```env
PORT=5000
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@YOUR_CLUSTER/ campusconnect?retryWrites=true&w=majority
JWT_SECRET=replace-with-a-long-random-secret
CLIENT_URL=http://localhost:5173
ADMIN_EMAIL=admin@example.com
```
Remove the space before `campusconnect` in the sample connection string. Do not commit `.env`.

The app promotes the account matching `ADMIN_EMAIL` to admin when that user registers. Set this to your own email before registering the admin account. Do not use this shortcut in a public production system; use a controlled admin provisioning process.

Start the API:
```bash
npm run dev
```
The API runs at `http://localhost:5000`. Check `http://localhost:5000/api/health`.

## 2. Configure the frontend
Open a second terminal:
```bash
cd client
npm install
```
Copy `client/.env.example` to `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```
Start React:
```bash
npm run dev
```
Open the URL printed by Vite, usually `http://localhost:5173`.

## 3. First run
1. Confirm MongoDB is reachable.
2. Set `ADMIN_EMAIL` in `server/.env` to the email you intend to use for the admin account.
3. Register with that email through the UI. The server assigns the admin role to the matching email.
4. Log in and use **Manage events** to create events.
5. Register a separate student account and test event registration/cancellation.

## API overview
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/health` | Public | Health check |
| GET | `/api/events` | Public | List events; optional `?q=&category=` |
| GET | `/api/events/:id` | Public | Event details |
| POST | `/api/auth/register` | Public | Create account |
| POST | `/api/auth/login` | Public | Log in |
| GET | `/api/auth/me` | Logged in | Current account |
| POST | `/api/events` | Admin | Create event |
| PUT | `/api/events/:id` | Admin | Update event |
| DELETE | `/api/events/:id` | Admin | Delete event |
| POST | `/api/events/:id/register` | Logged in | Register for event |
| DELETE | `/api/events/:id/register` | Logged in | Cancel registration |
| GET | `/api/events/mine/registrations` | Logged in | Events registered by current user |

## Project structure
```text
campus-event-management/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── .env.example
│   └── package.json
├── server/
│   ├── src/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── .gitignore
├── PROJECT_REPORT.md
└── SCREENSHOTS_PLAN.md
```

## Testing checklist
- [ ] Register with valid details
- [ ] Duplicate email is rejected
- [ ] Login with correct and incorrect credentials
- [ ] Event list, search, and category filter work
- [ ] Admin can create, edit, and delete an event
- [ ] Student can register once and cancel registration
- [ ] Full events reject additional registrations
- [ ] Logged-out users are asked to log in before registering
- [ ] Mobile layout is readable
- [ ] Invalid form input produces clear feedback
- [ ] Browser console and server terminal have no unexpected errors

## GitHub upload
Create a **public** repository on GitHub, for example `campus-event-management`. In the project root:
```bash
git init
git add .
git commit -m "Build CampusConnect event management app"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/campus-event-management.git
git push -u origin main
```
Replace `YOUR-USERNAME` with your GitHub username. Never upload `.env`, passwords, database URLs, or JWT secrets. Confirm `.env` is ignored before pushing.

## Deployment overview
Deploy the frontend, API, and database as three connected parts:
1. Create a MongoDB Atlas cluster and a database user with limited permissions. Configure network access carefully.
2. Deploy `server` to a Node-compatible host. Set `MONGODB_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, `CLIENT_URL`, and `PORT` as host environment variables. Build/start commands: `npm install` and `npm start` from the `server` directory.
3. Deploy `client` to a static frontend host. Build command: `npm install && npm run build`; publish directory: `dist`. Set `VITE_API_URL` to `https://YOUR-API-HOST/api`.
4. Set the API's `CLIENT_URL` to the deployed frontend origin and redeploy the API.
5. Register the admin account, create an event, and test registration on the live site.

Hosting provider free-tier rules and deployment settings change; consult the provider's current documentation. Do not assume a GitHub repository URL is the hosted app URL.

## Known limitations / future improvements
- Email verification and password reset are not implemented.
- No email notifications or QR-code ticketing.
- Admin role assignment uses `ADMIN_EMAIL` during registration for this educational starter.
- Add rate limiting, stronger audit logging, automated tests, and production-grade admin provisioning before real-world use.

## Documentation
- React: https://react.dev/
- Vite: https://vite.dev/guide/
- Express: https://expressjs.com/
- MongoDB Atlas: https://www.mongodb.com/docs/atlas/
- Mongoose: https://mongoosejs.com/docs/
- GitHub Docs: https://docs.github.com/
