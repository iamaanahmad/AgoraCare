# Contributing to AgoraCare

Thank you for your interest in contributing to AgoraCare! We're building a voice-first healthcare companion that helps elderly users and caregivers manage medications, appointments, and health emergencies. Every contribution helps make healthcare more accessible.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing.

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- Git
- Firebase account (free tier works)
- Agora account for voice features
- Google Cloud account for Vision API

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/agoracare.git
   cd agoracare
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Open Browser**
   Navigate to [http://localhost:9002](http://localhost:9002)

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the behavior
- **Expected vs actual behavior**
- **Screenshots** if applicable
- **Environment details** (OS, browser, Node version)

Use the bug report template:

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. Windows 11]
- Browser: [e.g. Chrome 120]
- Node Version: [e.g. 20.10.0]
```

### Suggesting Features

Feature requests are welcome! Please:

- **Check existing feature requests** first
- **Provide clear use case** and user benefit
- **Explain why** this feature would be useful
- **Consider accessibility** implications

### Code Contributions

We welcome code contributions! Here are areas where you can help:

#### Good First Issues
- UI improvements and accessibility enhancements
- Documentation updates
- Test coverage improvements
- Bug fixes

#### Medium Complexity
- New medication reminder features
- Calendar integration improvements
- Voice command additions
- Notification enhancements

#### Advanced
- AI/ML model improvements
- Performance optimizations
- Security enhancements
- New integrations (wearables, health records)

## Pull Request Process

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/updates

### 2. Make Your Changes

- Write clean, readable code
- Follow our coding standards (see below)
- Add tests for new functionality
- Update documentation as needed
- Ensure accessibility compliance

### 3. Test Your Changes

```bash
# Run linter
npm run lint

# Run type check
npm run type-check

# Run tests
npm test

# Run accessibility tests
npm run test:a11y
```

### 4. Commit Your Changes

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git commit -m "feat: add medication refill reminder"
git commit -m "fix: resolve calendar sync issue"
git commit -m "docs: update API documentation"
```

Commit message format:
```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting, missing semicolons, etc.
- `refactor` - Code restructuring
- `test` - Adding tests
- `chore` - Maintenance tasks

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub with:

- **Clear title** describing the change
- **Description** of what and why
- **Related issues** (e.g., "Closes #123")
- **Screenshots** for UI changes
- **Testing notes** for reviewers

### 6. Code Review

- Address reviewer feedback promptly
- Keep discussions focused and professional
- Update your PR based on feedback
- Squash commits if requested

### 7. Merge

Once approved, a maintainer will merge your PR. Thank you for contributing!

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Avoid `any` types - use proper typing
- Use interfaces for object shapes
- Export types alongside implementations

```typescript
// Good
interface MedicationData {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
}

export const addMedication = async (data: MedicationData): Promise<void> => {
  // Implementation
};

// Bad
export const addMedication = async (data: any) => {
  // Implementation
};
```

### React Components

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper prop typing

```typescript
// Good
interface MedicationCardProps {
  medication: Medication;
  onTake: (id: string) => void;
}

export const MedicationCard: React.FC<MedicationCardProps> = ({ 
  medication, 
  onTake 
}) => {
  // Implementation
};
```

### File Organization

```
src/
├── app/              # Next.js pages and routes
├── components/       # React components
│   ├── ui/          # Reusable UI components
│   ├── medications/ # Feature-specific components
│   └── ...
├── hooks/           # Custom React hooks
├── lib/             # Utility functions and services
├── contexts/        # React contexts
├── firebase/        # Firebase configuration
└── ai/              # AI/ML related code
```

### Naming Conventions

- **Files**: `kebab-case.tsx`
- **Components**: `PascalCase`
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Interfaces**: `PascalCase` (no `I` prefix)
- **Types**: `PascalCase`

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Add trailing commas
- Use semicolons
- Max line length: 100 characters
- Use arrow functions for callbacks

```typescript
// Good
const medications = [
  { id: '1', name: 'Aspirin' },
  { id: '2', name: 'Metformin' },
];

// Bad
const medications = [
  { id: "1", name: "Aspirin" }
  { id: "2", name: "Metformin" }
]
```

### Accessibility

All UI components must be accessible:

- Use semantic HTML elements
- Add ARIA labels where needed
- Ensure keyboard navigation works
- Maintain color contrast ratios (4.5:1)
- Test with screen readers
- Support reduced motion preferences

```typescript
// Good
<button
  onClick={handleClick}
  aria-label="Take medication"
  className="min-h-[48px] min-w-[48px]"
>
  <CheckIcon aria-hidden="true" />
</button>

// Bad
<div onClick={handleClick}>
  <CheckIcon />
</div>
```

## Testing Guidelines

### Unit Tests

- Test individual functions and components
- Mock external dependencies
- Aim for 70%+ coverage on critical paths

```typescript
import { render, screen } from '@testing-library/react';
import { MedicationCard } from './medication-card';

describe('MedicationCard', () => {
  it('displays medication name', () => {
    const medication = { id: '1', name: 'Aspirin', dosage: '100mg' };
    render(<MedicationCard medication={medication} onTake={jest.fn()} />);
    expect(screen.getByText('Aspirin')).toBeInTheDocument();
  });
});
```

### Integration Tests

- Test feature workflows
- Test API routes
- Test database interactions

### Accessibility Tests

```typescript
import { axe } from 'jest-axe';

it('has no accessibility violations', async () => {
  const { container } = render(<MedicationCard {...props} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Documentation

### Code Comments

- Comment complex logic
- Explain "why" not "what"
- Use JSDoc for public APIs

```typescript
/**
 * Calculates medication adherence rate for a given time period.
 * 
 * @param userId - The user's unique identifier
 * @param startDate - Start of the period
 * @param endDate - End of the period
 * @returns Adherence rate as a percentage (0-100)
 */
export const calculateAdherence = async (
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<number> => {
  // Implementation
};
```

### README Updates

- Update README.md for new features
- Add examples for new APIs
- Update screenshots if UI changes

### Changelog

- Add entry to CHANGELOG.md
- Follow [Keep a Changelog](https://keepachangelog.com/) format

## Questions?

- **General questions**: Open a [Discussion](https://github.com/yourusername/agoracare/discussions)
- **Bug reports**: Open an [Issue](https://github.com/yourusername/agoracare/issues)
- **Security concerns**: Email security@agoracare.health

## Recognition

Contributors will be:
- Listed in our README
- Mentioned in release notes
- Invited to our contributor Discord channel

Thank you for making healthcare more accessible! 🏥❤️
