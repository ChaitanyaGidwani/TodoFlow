# **App Name**: TodoFlow

## Core Features:

- User Authentication: Secure user sign-up, login, and logout functionalities using Firebase Authentication with email/password.
- Add New Todo: An intuitive input field and button for users to quickly add new to-do items.
- Real-time Todo List Display: Display a dynamically updated list of to-do items, ordered by newest first, with data fetched in real-time from Firestore.
- Toggle Todo Status: Allow users to easily mark to-do items as complete or incomplete, with updates reflected in Firestore.
- Delete Todo Item: Enable users to permanently remove individual to-do items, with immediate deletion from Firestore.
- AI Task Breakdown Tool: An integrated AI tool to analyze complex to-do descriptions and suggest smaller, actionable sub-tasks or steps to aid in task management.
- User-Specific Persistent Data & Offline Support: Store all to-do data persistently per user in Firestore, with robust security rules ensuring user-specific access, and provide offline capabilities via the Firebase SDK.

## Style Guidelines:

- Primary Color: A deep, vibrant purple (#5C2EB3) for strong brand identity and interactive elements, providing excellent contrast against the light background.
- Accent Color: A clear, darker vibrant blue (#2666D9) for highlights and call-to-action elements, offering a harmonious contrast with the primary purple.
- Background: A smooth linear gradient for the body and main container, transitioning from light blue (#A8EDEA) to soft pink (#FED6E3) then to light purple (#B5ACC6) as specified by the user. This creates a serene and inviting visual canvas.
- Card Backgrounds: Semi-transparent white cards (e.g., rgba(255, 255, 255, 0.8)) with subtle shadows to ensure readability and a floating aesthetic over the gradient background, as requested.
- Body and Headline Font: 'Inter' (sans-serif) for its modern, clean, and highly readable design across all text elements, aligning with a minimal UI aesthetic.
- Minimalist, line-based icons for key actions like 'add', 'delete', and 'complete' to maintain a clean interface.
- Responsive design to ensure optimal viewing and interaction across desktop and mobile devices. Main content is centered, utilizing card-based layouts for individual to-do items with sufficient spacing for clarity.
- Subtle visual feedback animations on task creation, completion, and deletion to enhance user experience without distraction.