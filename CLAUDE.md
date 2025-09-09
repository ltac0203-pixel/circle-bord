# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is a React TypeScript web application for university circle sports practice game matching (大学サークル練習試合マッチング). Built with Create React App, it features authentication, game registration, and match application management.

## Development Commands

### Essential Commands
```bash
# Install dependencies
npm install

# Start both React app and Express server concurrently
npm start

# Start React app only (runs on http://localhost:3000)
npm run start-react

# Start Express server only (runs on http://localhost:3001)
npm run start-server

# Run tests in watch mode
npm test

# Build for production
npm run build

# Run a specific test file
npm test -- App.test.tsx
```

### TypeScript & Linting
The project uses TypeScript 4.9.5 with strict mode enabled. ESLint is configured through Create React App's default setup. There are no separate lint commands - linting runs automatically during development.

## Architecture

### Tech Stack
- **Frontend**: React 19 with TypeScript, React Router v7
- **Backend**: Express 5 with TypeScript (server.ts)
- **Database**: MySQL2 (connection configured in server.ts)
- **Dev Tools**: Nodemon for server hot-reload, Concurrently for parallel processes

### Component Structure
- **App.tsx**: Root component with routing configuration
  - Uses React Router for navigation
  - Protected routes with authentication
  - Routes: /signin, /signup, and protected main app routes

- **AuthContext**: Global authentication state management
  - User type with id, name, email
  - Login/logout functionality
  - useAuth hook for accessing auth state

- **MainApp.tsx**: Main application after authentication
  - Game interface: { id, teamName, date, time, location, ... }
  - Application management for match requests
  - Match tracking and approval/rejection flow
  - Demo data for development

### Data Flow
- Authentication state managed via Context API (AuthContext)
- Local state management with useState for games, applications, and matches
- Backend API endpoint at `/api/login` for authentication
- Currently uses demo data (demoGames array) for development

### Styling Approach
- Component-specific CSS files (Auth.css, Header.css, App.css)
- No CSS framework - custom styles
- Japanese UI text throughout the application

## Key Technical Details

### TypeScript Configuration
- Target: ES5 for broad compatibility
- JSX: react-jsx (React 17+ transform)
- Strict mode enabled
- Module resolution: Node
- Includes all files in src directory

### Backend Configuration
- Express server on port 3001
- CORS enabled for localhost:3000
- MySQL database connection (requires configuration)
- Database config placeholders in server.ts need to be filled

### Testing Setup
- Jest with React Testing Library
- Test files use `.test.tsx` extension
- Configuration in setupTests.ts
- @testing-library packages for DOM and React testing

## Development Guidelines

### When Adding Features
1. Follow existing TypeScript interfaces pattern
2. Maintain Japanese UI text consistency
3. Use existing component structure patterns
4. Update both frontend components and backend endpoints if needed

### Common Tasks
- **Adding new routes**: Update App.tsx routing and consider ProtectedRoute wrapper
- **Database setup**: Configure dbConfig in server.ts with actual credentials
- **Adding API endpoints**: Follow the pattern in server.ts with proper error handling
- **Component creation**: Place in src/components with corresponding CSS file if needed

## Current Implementation Notes
- Authentication system with SignIn/SignUp components
- Protected routes requiring authentication
- Demo game data for testing without database
- Application approval/rejection workflow for match requests
- Notification system for user feedback
- MySQL database integration prepared but requires configuration