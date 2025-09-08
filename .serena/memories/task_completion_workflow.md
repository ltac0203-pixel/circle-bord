# Task Completion Workflow

## When Completing a Task

### 1. Code Quality Checks
Since this is a Create React App project with TypeScript:

1. **TypeScript Compilation**: Ensure no TypeScript errors
   - Errors will show in the terminal running `npm start`
   - The development server will display compilation errors

2. **ESLint Validation**: Check for linting issues
   - ESLint runs automatically with `npm start`
   - Warnings and errors appear in the browser console and terminal

3. **Test Execution** (if tests exist for the modified code):
   ```bash
   npm test
   ```
   - Tests run in watch mode by default
   - Press 'a' to run all tests if needed

### 2. Verification Steps

#### For New Features:
1. Start development server: `npm start`
2. Test the feature manually in the browser
3. Check browser console for any errors
4. Verify TypeScript compilation succeeds
5. Run existing tests to ensure nothing broke

#### For Bug Fixes:
1. Reproduce the bug first
2. Apply the fix
3. Verify the bug is resolved
4. Check for regression issues
5. Run tests if applicable

#### For Refactoring:
1. Ensure functionality remains unchanged
2. Run all tests: `npm test -- --watchAll=false`
3. Manually test affected features
4. Check TypeScript compilation

### 3. Final Checklist
- [ ] No TypeScript errors in terminal
- [ ] No ESLint warnings/errors in console
- [ ] Feature works as expected in browser
- [ ] Existing tests still pass
- [ ] Code follows project conventions
- [ ] Japanese UI text is consistent
- [ ] No console.log statements left in code

### 4. Build Verification (for major changes)
```bash
npm run build
```
- Ensure production build succeeds
- Check build size warnings if any

## Important Notes
- **NO separate lint/format commands** - rely on CRA's built-in checks
- **NO git commits** unless explicitly requested by user
- Always test in the browser at http://localhost:3000
- Check both terminal and browser console for errors