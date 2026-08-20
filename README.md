# TicketHive Frontend

TicketHive is a ticket booking platform designed to handle events, seat availability, waiting rooms, bookings, payments, and notifications.

This repository contains the frontend application for TicketHive. The frontend provides the user interface through which users, organizers, and administrators interact with the platform.

## Technologies

- React
- ASP.NET Core
- PostgreSQL
- Apache Kafka
- Docker
- Azure
- GitHub Actions

> **Note:** ASP.NET Core, PostgreSQL, Apache Kafka, Docker, and Azure are primarily used by the backend and deployment infrastructure. They are listed here to document the technologies used across the TicketHive system.

## Repository Structure

The frontend is developed as a React application.

```text
TicketHive-Frontend/
├── src/
├── public/
├── package.json
├── Dockerfile
├── README.md
└── .github/
    └── workflows/
        └── frontend-ci.yml
```

## Branching Strategy

TicketHive follows a structured Git branching strategy:

```text
main
  ↑
develop
  ↑
feature/* / fix/*
```

### `main`

`main` contains stable releases of the application.

- Direct pushes are not allowed.
- Changes must be submitted through a Pull Request.
- CI checks must pass before merging.
- Code review is required.

### `develop`

`develop` contains the latest integrated development version. It is used to prepare upcoming releases before they are merged into `main`. Changes should be introduced through Pull Requests.

### `feature/*`

Feature branches are used when implementing new functionality.

Naming format:

```text
feature/<description>
```

Examples:

```text
feature/login-page
feature/event-list
feature/seat-selection
feature/booking-page
```

Create a feature branch from the appropriate development branch before starting work.

### `fix/*`

Fix branches are used for bug fixes.

Naming format:

```text
fix/<description>
```

Examples:

```text
fix/login-validation
fix/seat-display
fix/booking-ui
```

## Commit Conventions

TicketHive follows a simple commit message convention.

| Prefix | Usage | Example |
| --- | --- | --- |
| `feat:` | Adding a new feature | `feat: add event listing page` |
| `fix:` | Fixing a bug | `fix: correct seat selection state` |
| `test:` | Adding or modifying tests | `test: add booking component tests` |
| `docs:` | Documentation changes | `docs: update frontend setup instructions` |
| `ci:` | CI/CD and automation changes | `ci: add frontend build workflow` |

Additional conventional prefixes such as `refactor:` and `chore:` may be used when appropriate. Keep commit messages short, clear, and descriptive.

## Local Setup

### Prerequisites

Install the following before starting development:

- Git
- Node.js
- npm
- Docker (optional for local container testing)

Check the installed versions:

```bash
git --version
node --version
npm --version
docker --version
```

### 1. Clone the Repository

```bash
git clone https://github.com/ch3thiya/TicketHive-Frontend.git
cd TicketHive-Frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Development Server

```bash
npm run dev
```

The terminal will provide the local development URL. Open the provided URL in a web browser.

### 4. Build the Application

Before creating a Pull Request, verify that the application can be built:

```bash
npm run build
```

The build should complete without errors.

### 5. Run Tests

Run the project's test command:

```bash
npm test
```

If additional test commands are configured in `package.json`, use those commands as defined by the project.

### 6. Run Code Quality Checks

```bash
npm run lint
```

Resolve any errors before creating a Pull Request.

## Docker

The frontend can be containerized using Docker.

### Build the Docker Image

From the project root:

```bash
docker build -t tickethive-frontend .
```

### Run the Container

```bash
docker run -p 3000:3000 tickethive-frontend
```

The exact port may change depending on the frontend container configuration.

### Check Running Containers

```bash
docker ps
```

### Stop a Container

```bash
docker stop <container_id>
```

Docker configuration may be updated as the application and deployment architecture develop.

## GitHub Actions CI

The frontend uses GitHub Actions for Continuous Integration. The CI pipeline automatically checks code submitted through Pull Requests.

The pipeline may perform the following checks:

```text
Pull Request
     ↓
Checkout code
     ↓
Install dependencies
     ↓
Dependency checks
     ↓
Code quality checks
     ↓
Run tests
     ↓
Build application
     ↓
Build Docker image
```

A Pull Request should only be merged after the required CI checks pass.

## Pull Request Workflow

All changes should follow the team's Pull Request workflow:

```text
Create branch
      ↓
Make changes
      ↓
Run tests locally
      ↓
Commit changes
      ↓
Push branch
      ↓
Create Pull Request
      ↓
CI checks
      ↓
Code review
      ↓
Merge
```

Direct pushes to protected branches are not allowed.

## Developer Setup Guide

Every developer should follow these steps when starting new work.

### 1. Clone the Repository

```bash
git clone https://github.com/ch3thiya/TicketHive-Frontend.git
cd TicketHive-Frontend
```

### 2. Create a Feature Branch

```bash
git checkout -b feature/<description>
```

For example:

```bash
git checkout -b feature/event-list
```

For a bug fix:

```bash
git checkout -b fix/event-display
```

### 3. Make Changes

Implement the assigned functionality and follow the existing project structure and coding conventions.

### 4. Run Tests Locally

```bash
npm test
npm run build
npm run lint
```

Fix any errors before pushing your changes.

### 5. Commit Using the Convention

```bash
git add .
git commit -m "feat: add event listing page"
```

### 6. Push the Branch

```bash
git push origin feature/event-list
```

### 7. Create a Pull Request

Create a Pull Request from your feature branch to the appropriate integration or development branch. Provide:

- A clear title
- A description of the changes
- Relevant testing information
- Any issues or limitations

### 8. Wait for CI

GitHub Actions will automatically run the required checks. Make sure all required checks pass.

If CI fails:

```text
CI failed
   ↓
Check error
   ↓
Fix code
   ↓
Commit
   ↓
Push
   ↓
CI runs again
```

### 9. Get Review

Wait for the required code review and address any review comments before merging.

### 10. Merge

Once CI passes, the required review is approved, and review comments are addressed, the Pull Request can be merged according to the team's branching strategy.

## Development Guidelines

- Do not commit passwords, API keys, tokens, or other secrets.
- Do not directly push to protected branches.
- Keep commits small and meaningful.
- Write tests for appropriate functionality.
- Run tests and builds before creating a Pull Request.
- Follow the branch naming convention.
- Follow the commit message convention.
- Keep Pull Requests focused on one task where possible.

## Environment Variables

Environment-specific configuration should not contain hardcoded secrets. Use environment variables or the project's approved secret-management solution for sensitive configuration. Never commit real credentials to the repository.

## Contact and Contribution

All team members should follow the documented Git workflow, coding conventions, and Pull Request process when contributing to TicketHive.