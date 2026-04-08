
# TodoFlow

A world-class, AI-powered todo application featuring a serene gradient design, real-time synchronization, and smart task breakdown capabilities.

## Getting Started

### Firebase Setup

1. Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com/).
2. Enable **Authentication** with the **Email/Password** provider.
3. Create a **Firestore Database** in test mode or production mode.
4. Set the following **Security Rules** for Firestore:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /todos/{todoId} {
         allow read, write: if request.auth != null && (resource == null || resource.data.userId == request.auth.uid) && (request.resource == null || request.resource.data.userId == request.auth.uid);
       }
     }
   }
   ```
5. Add a Web App to your Firebase project and copy the configuration.
6. Replace the placeholder config in `src/lib/firebase.ts`.

### Features

- **Real-time Sync**: Todos sync across devices instantly.
- **AI Task Breakdown**: Click the ✨ wand icon on any complex task to have TodoFlow's AI break it down into smaller, actionable steps.
- **Offline Support**: Keep productive even when the internet isn't. Changes will sync when you're back online.
- **Responsive Design**: Works perfectly on mobile, tablet, and desktop.
- **Beautiful UI**: A soft gradient background with translucent cards for a modern, glassmorphism aesthetic.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database/Auth**: Firebase (Firestore + Auth)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **AI**: Google Gemini via Genkit
