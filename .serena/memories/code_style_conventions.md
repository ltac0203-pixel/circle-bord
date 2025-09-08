# Code Style and Conventions

## TypeScript Configuration
- **Target**: ES5 for broad compatibility
- **Strict Mode**: Enabled (strict: true)
- **JSX**: react-jsx (React 17+ transform)
- **Module Resolution**: Node

## Naming Conventions
- **Components**: PascalCase (e.g., `Dashboard`, `SignIn`)
- **Functions/Variables**: camelCase (e.g., `handleSubmit`, `teamName`)
- **Interfaces/Types**: PascalCase (e.g., `Game`, `User`, `Match`)
- **Files**: 
  - Components: PascalCase.tsx (e.g., `Dashboard.tsx`)
  - Styles: Same as component with .css (e.g., `Dashboard.css`)
  - Context: PascalCase + Context.tsx (e.g., `AuthContext.tsx`)

## React Patterns
- **Components**: Functional components with `React.FC` type annotation
  ```typescript
  const ComponentName: React.FC = () => { ... }
  const ComponentName: React.FC<Props> = ({ prop }) => { ... }
  ```
- **State Management**: React hooks (useState, useEffect, useContext)
- **Event Handlers**: Arrow functions with `handle` prefix
  ```typescript
  const handleSubmit = (e: React.FormEvent) => { ... }
  ```
- **Props**: Destructured in function parameters
- **Hooks**: Custom hooks with `use` prefix

## TypeScript Usage
- **Interfaces for Data Structures**:
  ```typescript
  interface Game {
    id: number;
    teamName: string;
    sport: string;
    // ...
  }
  ```
- **Type annotations** for all function parameters and returns
- **Generic types** for React hooks:
  ```typescript
  const [games, setGames] = useState<Game[]>([]);
  ```

## CSS Conventions
- **No CSS frameworks** - pure custom CSS
- **Class naming**: kebab-case (e.g., `game-card`, `form-group`)
- **Color scheme**: Blue theme (#4a90e2 primary)
- **Layout**: CSS Grid and Flexbox for responsive design
- **Card-based UI** for content blocks

## Japanese UI Text
- All user-facing text in Japanese
- Keep consistent with existing terminology
- Examples:
  - 練習試合 (practice game)
  - チーム名 (team name)
  - 募集登録 (register recruitment)

## File Organization
- Components grouped by feature in `src/components/`
- Shared contexts in `src/contexts/`
- Styles co-located with components
- No barrel exports (index.ts files)

## Code Quality
- ESLint rules from Create React App defaults
- No custom linting rules
- TypeScript strict mode catches type errors
- Comments in Japanese or English as appropriate