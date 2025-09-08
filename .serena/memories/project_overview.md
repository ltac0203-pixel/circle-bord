# Circle-Bord Project Overview

## Project Purpose
大学サークル練習試合マッチングアプリケーション (University Circle Sports Practice Game Matching Application)
- Allows university circles/clubs to register and find practice game matches
- Automatic matching based on date, time, and sport
- Japanese-focused user interface

## Tech Stack
- **Frontend Framework**: React 19.1.1
- **Language**: TypeScript 4.9.5 (strict mode enabled)
- **Routing**: React Router DOM 7.8.2
- **Build Tool**: Create React App 5.0.1
- **Testing**: Jest + React Testing Library
- **Styling**: Custom CSS (no frameworks)
- **State Management**: React hooks (useState) - no Redux/Context API for data

## Project Structure
```
circle-bord/
├── public/          # Static assets
├── src/
│   ├── components/  # React components
│   │   ├── Dashboard.tsx   # Main game management component
│   │   ├── SignIn.tsx      # Authentication
│   │   ├── SignUp.tsx      # User registration
│   │   ├── Header.tsx      # Navigation header
│   │   └── ProtectedRoute.tsx # Route guard
│   ├── contexts/    # React contexts
│   │   └── AuthContext.tsx # Authentication context
│   ├── App.tsx      # Main app component with routing
│   ├── index.tsx    # Entry point
│   └── *.css        # Styling files
├── package.json     # Dependencies and scripts
├── tsconfig.json    # TypeScript configuration
└── CLAUDE.md        # Claude Code instructions
```

## Key Features
- User authentication (demo mode with localStorage)
- Game registration with team details
- Automatic matching based on criteria
- Match notifications
- Sport filtering
- Responsive card-based UI design