# LMS Backend

This is the backend for an AI-powered Learning Management System I built. Students can browse and enroll in courses, instructors can create them, and admins approve everything before it goes live. There's also an AI assistant (powered by Groq) that helps students with their course questions.

Built with Node.js, Express, MongoDB, and Redis.

## What it does

- Sign up and login with JWT authentication (access + refresh tokens)
- Three roles: student, instructor, and admin — each with different permissions
- Instructors create courses, admins approve or reject them
- Students pay through Razorpay and get enrolled
- Course thumbnails and videos are uploaded to Cloudinary
- Students can track their lesson progress and leave reviews
- An AI assistant answers course-related questions using Groq (LLaMA)
- Redis is used for caching to keep things fast

## Tech used

- **Node.js + Express** for the server
- **MongoDB** with Mongoose for the database
- **Redis** for caching
- **JWT** for authentication
- **Razorpay** for payments
- **Cloudinary** for file storage
- **Groq API** for the AI assistant
- **Jest + Supertest** for testing
- **Docker + GitHub Actions** for CI/CD

## Design decisions

A few choices I made and why:

- **Redis caching** — Course listings are the most frequently hit endpoint, so they're cached in Redis instead of querying MongoDB on every request. The cache is invalidated when a course is updated or approved.

- **Short-lived access tokens + refresh tokens** — Access tokens expire quickly, so even if one leaks, the damage window is small. Refresh tokens handle re-authentication silently, so users aren't logged out constantly.

- **Server-side payment verification** — After a Razorpay payment, the backend verifies the payment signature using HMAC before enrolling the student. Trusting only the frontend response would make it easy to fake a successful payment.

- **Course approval workflow** — Courses move through states (draft → pending → approved/rejected). Nothing goes live without admin approval, and role middleware ensures instructors can only modify their own courses.

- **Isolated test database** — Tests run against a separate `lms-test` database with their own setup and teardown, so the suite can run in CI without ever touching real data.

- **Dockerized from day one** — The app and Redis run through Docker Compose, so my local environment matches what gets deployed. The CI pipeline builds and pushes the same image to Docker Hub on every push to main.

## Running it locally

You'll need Node.js 18+, MongoDB, and Redis installed (or use Docker for Redis).

```bash
git clone https://github.com/Vermaanjali117/lms-backend.git
cd lms-backend
npm install
```

Create a `.env` file in the root folder with your own values:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GROQ_API_KEY=your_groq_api_key
```

Then start the server:

```bash
npm run dev
```

It runs on `http://localhost:5000`.

## Running with Docker

```bash
docker compose up --build
```

This starts both the backend and Redis. You can also pull the image directly:

```bash
docker pull anjali117/lms-backend:latest
```

## Tests

Tests run on a separate test database so your real data is never touched.

```bash
npm test
```

Right now the auth flows are covered (register, login, refresh token, protected routes) using Jest and Supertest.

## CI/CD

Every push to the main branch triggers a GitHub Actions workflow that builds the Docker image and pushes it to Docker Hub automatically.

## Main API routes

- `/api/auth` — register, login, refresh token, update profile, change password
- `/api/courses` — browse, create, update, and delete courses
- `/api/admin` — approve/reject courses, manage users
- `/api/payments` — create Razorpay orders and verify payments
- `/api/enrollments` — view enrolled courses
- `/api/progress` — track lesson completion
- `/api/reviews` — add course reviews
- `/api/ai` — ask the AI assistant questions

## What's next

- Deploying to AWS
- More test coverage

## Author

Anjali Verma — [GitHub](https://github.com/Vermaanjali117)
