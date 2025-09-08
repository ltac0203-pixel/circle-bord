# Suggested Commands for Circle-Bord Development

## Essential Development Commands

### Package Management
```bash
npm install          # Install all dependencies
npm ci               # Clean install from package-lock.json
```

### Development Workflow
```bash
npm start            # Start development server on http://localhost:3000
npm test             # Run tests in watch mode
npm run build        # Build for production (creates build/ folder)
```

### Testing
```bash
npm test -- --coverage          # Run tests with coverage report
npm test -- App.test.tsx        # Run specific test file
npm test -- --watchAll=false    # Run tests once without watch mode
```

### Git Commands (Windows Git Bash)
```bash
git status           # Check current changes
git add .            # Stage all changes
git commit -m "msg"  # Commit with message
git push             # Push to remote
git pull             # Pull from remote
git branch           # List branches
git checkout -b name # Create and switch to new branch
```

### File System Commands (Windows)
```bash
dir                  # List files (Windows CMD)
ls                   # List files (Git Bash)
cd path              # Change directory
mkdir name           # Create directory
type file.txt        # View file content (Windows CMD)
cat file.txt         # View file content (Git Bash)
```

### Code Quality
Note: This project uses Create React App's built-in ESLint configuration.
Linting runs automatically during development (npm start).
No separate lint command is configured.

### Build and Deployment
```bash
npm run build        # Creates optimized production build
serve -s build       # Serve production build locally (requires global serve package)
```

## Important Notes
- TypeScript checking happens automatically during development
- ESLint runs automatically with npm start
- No formatter (Prettier) is configured
- Tests use React Testing Library patterns