# ChatApp

A modern, full-stack real-time chat application featuring a robust Spring Boot backend and a responsive, sleek React frontend.

![ChatApp Demo](https://placehold.co/1200x600/1e293b/ffffff?text=ChatApp)

## 🏗 Architecture

The project is split into two main components:
1. **Frontend (`/chat_app`)**: A Single Page Application (SPA) built with React and Vite.
2. **Backend (`/backend`)**: A RESTful API service built with Java and Spring Boot.

---

## 💻 Frontend (`/chat_app`)

The frontend is a fast, responsive UI built with modern web technologies, focusing on an elegant dark-mode aesthetic and real-time interactions.

### Tech Stack
- **Framework**: React 18, Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Icons**: Lucide React

### Key Features
- **Secure Authentication**: Uses HttpOnly cookies for refresh tokens to prevent XSS attacks while keeping access tokens purely in memory.
- **Silent Refresh**: Automatically handles token regeneration seamlessly in the background.
- **Responsive Design**: Beautiful UI powered by Tailwind CSS that works on desktops and mobile devices.
- **Global State**: Efficient, boilerplate-free state management using Zustand.

### Running the Frontend
1. Navigate to the frontend directory:
   ```bash
   cd chat_app
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`. API requests are automatically proxied to the backend.

---

## ⚙️ Backend (`/backend`)

The backend provides a secure and scalable REST API for user management, authentication, and (upcoming) real-time messaging.

### Tech Stack
- **Framework**: Spring Boot 3
- **Language**: Java
- **Security**: Spring Security, JWT (JSON Web Tokens)
- **Database Mapping**: Spring Data JPA / Hibernate
- **Build Tool**: Maven

### Key Features
- **Stateless Securty**: RESTful endpoints protected by JWT-based Spring Security.
- **HttpOnly Cookies**: Issues secure `HttpOnly` and `SameSite` configurations for long-lived refresh tokens.
- **CORS Configured**: Fully configured to handle Cross-Origin Resource Sharing with the Vite dev server and production domains.
- **Password Hashing**: Uses robust BCrypt password encoding before saving to the database.

### Running the Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Build the project and skip tests (optional):
   ```bash
   mvn clean install -DskipTests
   ```
3. Run the Spring Boot application:
   ```bash
   mvn spring-boot:run
   ```
   The backend API will start on `http://localhost:8080`.

---

## 🔒 Security Flow

This application uses an industry-standard security architecture for SPAs:
1. **Login**: User authenticates ➔ Backend responds with a short-lived `accessToken` in the JSON body and a long-lived `refreshToken` in an `HttpOnly` cookie.
2. **Access**: Frontend keeps the `accessToken` in memory (never in `localStorage`) and attaches it as a Bearer token to API requests.
3. **Refresh**: If the page is reloaded or the `accessToken` expires, the frontend calls `/auth/refresh`. The browser securely sends the HttpOnly cookie, and the backend issues a fresh `accessToken`.
4. **Logout**: Frontend clears memory and calls `/auth/logout`, which instructs the browser to immediately expire the `HttpOnly` cookie.
