# Contributing to Entangled Links

Thank you for your interest in contributing to Entangled Links! This document provides guidelines and instructions for contributing.

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Environment details** (Node version, OS, etc.)
- **Screenshots** (if applicable)
- **Error messages or logs**

Use this template:

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

**Actual behavior**
What actually happened.

**Environment:**
- OS: [e.g., macOS 13.0]
- Node: [e.g., 18.17.0]
- Wrangler: [e.g., 3.80.0]

**Additional context**
Any other relevant information.
```

### Suggesting Features

Feature suggestions are welcome! Please:

1. Check existing feature requests
2. Provide clear use case
3. Explain why it would be useful
4. Consider implementation complexity

Use this template:

```markdown
**Feature Description**
Clear description of the feature.

**Use Case**
Real-world scenario where this would be useful.

**Proposed Implementation**
How you think it could be implemented (optional).

**Alternatives Considered**
Other approaches you've considered.
```

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Write/update tests**
5. **Ensure tests pass** (`npm test`)
6. **Update documentation**
7. **Commit changes** (`git commit -m 'Add amazing feature'`)
8. **Push to branch** (`git push origin feature/amazing-feature`)
9. **Open Pull Request**

#### PR Guidelines

- Follow existing code style
- Include tests for new features
- Update documentation
- Keep PRs focused (one feature/fix per PR)
- Write clear commit messages
- Reference related issues

#### Commit Message Format

```
type(scope): subject

body

footer
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, no code change
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

Examples:
```
feat(crypto): add support for custom key lengths

Allows users to specify custom encryption key lengths
for enhanced security requirements.

Closes #123
```

```
fix(rate-limiter): correct window calculation

Fixed off-by-one error in rate limit window reset logic.

Fixes #456
```

## Development Setup

### Prerequisites

- Node.js 18+
- Git
- Cloudflare account
- Wrangler CLI

### Setup Steps

```bash
# Clone your fork
git clone https://github.com/yourusername/entangled-links.git
cd entangled-links

# Add upstream remote
git remote add upstream https://github.com/original/entangled-links.git

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Create KV namespaces
./scripts/setup-kv.sh

# Run tests
npm test

# Start dev server
npm run dev
```

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm test -- --watch

# Specific test file
npm test -- src/crypto/entanglement.test.js

# Coverage
npm test -- --coverage
```

### Code Style

We use:
- ESM modules (import/export)
- Async/await for asynchronous code
- Descriptive variable names
- JSDoc comments for functions
- 2-space indentation
- Single quotes for strings

Example:
```javascript
/**
 * Generate a cryptographically secure shortcode
 * @param {number} length - Length of the shortcode
 * @returns {string} The generated shortcode
 */
export function generateShortcode(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const random = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(random)
    .map(byte => chars[byte % chars.length])
    .join('');
}
```

## Project Structure

```
entangled-links/
├── src/
│   ├── index.js           # Main worker entry
│   ├── routes/            # Request handlers
│   ├── lib/               # Core utilities
│   ├── crypto/            # Cryptographic functions
│   ├── middleware/        # Middleware (rate limiting, security)
│   └── ui/                # UI components
├── scripts/               # Deployment and setup scripts
├── .github/               # GitHub Actions workflows
├── tests/                 # Test files (*.test.js)
├── wrangler.toml          # Cloudflare Workers config
└── package.json           # Dependencies and scripts
```

## Testing Guidelines

### Writing Tests

- Test file naming: `*.test.js`
- One test file per source file
- Use descriptive test names
- Test edge cases
- Mock external dependencies

Example:
```javascript
import { describe, it, expect } from 'vitest';
import { generateShortcode } from './entanglement.js';

describe('generateShortcode', () => {
  it('should generate shortcode of default length', () => {
    const code = generateShortcode();
    expect(code).toHaveLength(8);
  });

  it('should generate unique shortcodes', () => {
    const codes = new Set();
    for (let i = 0; i < 100; i++) {
      codes.add(generateShortcode());
    }
    expect(codes.size).toBe(100);
  });
});
```

### Test Coverage

Aim for:
- 80%+ line coverage
- 80%+ branch coverage
- 100% coverage for crypto functions

## Documentation

### Code Documentation

Use JSDoc for functions:
```javascript
/**
 * Split master key into two XOR halves
 * @param {CryptoKey} masterKey - The master encryption key
 * @returns {Promise<{keyA: string, keyB: string}>} Base64-encoded key halves
 */
export async function splitKey(masterKey) {
  // ...
}
```

### README Updates

Update README.md when:
- Adding new features
- Changing API
- Updating setup process
- Adding dependencies

### API Documentation

Update API.md for:
- New endpoints
- Changed request/response formats
- New error codes
- Updated rate limits

## Security

### Reporting Security Issues

**DO NOT** open public issues for security vulnerabilities.

Email security@example.com with:
- Description of vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We'll respond within 48 hours.

### Security Guidelines

- Never commit secrets or API keys
- Validate all user input
- Use parameterized queries (if applicable)
- Follow OWASP guidelines
- Keep dependencies updated

## Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create git tag (`git tag v1.2.3`)
4. Push tag (`git push --tags`)
5. GitHub Actions handles deployment
6. Create GitHub release with notes

## Getting Help

- **Documentation**: Check SETUP.md and API.md
- **Issues**: Search existing issues
- **Discussions**: Ask questions in GitHub Discussions
- **Email**: contact@example.com

## Recognition

Contributors are recognized in:
- README.md contributors section
- Release notes
- GitHub contributors page

Thank you for contributing! 🎉
