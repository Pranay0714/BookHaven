# BookHaven Bookstore Management

A MERN application for managing a bookstore catalog. Users must sign in to view
or manage books; new users can create an account from the login page. Book
prices are displayed in Indian rupees (INR).

## Requirements

- Node.js and npm
- A MongoDB database (MongoDB Atlas or a local MongoDB server)

## Configure the backend

Create `backend/.env` using `backend/.env.example` as a template, then set:

- `MONGODB_URI` to your MongoDB connection string
- `JWT_SECRET` to a long, random secret

Do not commit `backend/.env` or share its values.

## Run the application

Open separate terminals and run:

```sh
cd backend
npm install
npm run dev
```

```sh
cd frontend
npm install
npm run dev
```

The backend listens on port `5555`; Vite prints the frontend URL when it starts.
