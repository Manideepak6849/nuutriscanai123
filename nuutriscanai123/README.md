# NuutriScanAI – Firebase Cloud Functions

Firebase Cloud Functions backend for the NuutriScanAI project.

## Prerequisites

- [Node.js](https://nodejs.org/) (v24+)
- [Firebase CLI](https://firebase.google.com/docs/cli) – `npm install -g firebase-tools`

## Setup

```bash
# 1. Clone the repository
git clone <your-repo-url>

# 2. Navigate to the functions folder
cd nuutriscanai123

# 3. Install dependencies
npm install
```

## Available Scripts

| Command | Description |
|---|---|
| `npm run lint` | Run ESLint on source files |
| `npm run serve` | Start the Firebase emulator (functions only) |
| `npm run shell` | Open the Firebase Functions shell |
| `npm run deploy` | Deploy functions to Firebase |
| `npm run logs` | Stream Firebase function logs |

## Deployment

```bash
firebase deploy --only functions
```

## Dependencies

- `firebase-admin` ^13.6.0
- `firebase-functions` ^7.0.0
