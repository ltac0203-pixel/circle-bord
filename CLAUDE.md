# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is a React TypeScript web application for university circle sports practice game matching (大学サークル練習試合マッチング). Built with Create React App, it allows teams to register and view practice games.

## Development Commands

### Essential Commands
```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:3000)
npm start

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

### Component Structure
- **App.tsx**: Main application component containing all business logic and state management
  - Uses React hooks (useState) for state management
  - Contains the Game interface defining data structure
  - Handles form submission and game list rendering

### Data Flow
- No external state management (Redux, Context API, etc.)
- All state is managed locally in App component using useState
- Game data structure: `{ id, teamName, date, time, location }`
- Currently no data persistence - games are lost on page refresh

### Styling Approach
- Custom CSS in App.css without frameworks
- Uses CSS Grid for responsive layouts
- Blue theme (#4a90e2) with card-based design
- All text is in Japanese for the target audience

## Key Technical Details

### TypeScript Configuration
- Target: ES5 for broad compatibility
- JSX: react-jsx (React 17+ transform)
- Strict mode enabled
- Module resolution: Node

### Testing Setup
- Jest with React Testing Library
- Test files use `.test.tsx` extension
- Configuration in setupTests.ts
- Currently minimal test coverage

## Development Guidelines

### When Adding Features
1. Maintain the single-component architecture unless complexity requires splitting
2. Follow existing TypeScript interfaces pattern (define interfaces for data structures)
3. Keep Japanese UI text consistent with existing style
4. Use existing CSS patterns for new UI elements

### Common Tasks
- **Adding a new field to games**: Update the Game interface in App.tsx and form/display components
- **Modifying styles**: Edit App.css following existing class naming patterns
- **Adding tests**: Create `.test.tsx` files following React Testing Library patterns

## Current Limitations to Consider
- No backend API - all data is client-side only
- No routing - single page application
- No authentication system
- No edit/delete functionality for games
- No data validation beyond basic HTML5 form validation