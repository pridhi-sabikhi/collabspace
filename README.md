# CollabSpace — AI-Powered Real-Time Collaborative Workspace

A full-stack real-time collaborative document editor with AI writing assistance, built with the MERN stack. Similar to Google Docs + Notion with AI features.

![Tech Stack](https://img.shields.io/badge/React-18-blue) ![Tech Stack](https://img.shields.io/badge/Node.js-Express-green) ![Tech Stack](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen) ![Tech Stack](https://img.shields.io/badge/Socket.io-Real--Time-yellow) ![Tech Stack](https://img.shields.io/badge/Gemini_AI-2.5_Flash-purple)

## Features

- **Real-Time Collaboration** — Multiple users can edit the same document simultaneously with live presence indicators
- **Rich Text Editor** — TipTap-based editor with headings, bold, italic, lists, blockquotes, code blocks, and more
- **AI Writing Assistant** — Powered by Google Gemini 2.5 Flash with 6 commands: Summarize, Fix Grammar, Translate, Explain, Expand, Make Shorter
- **AI Document Outline Generator** — Enter a topic, get a structured document outline inserted into the editor
- **Workspace Management** — Create workspaces, invite members by email, assign roles (Owner/Editor/Viewer)
- **Real-Time Chat** — In-document chat for collaborators with message persistence
- **Authentication** — Email/password with bcrypt hashing + Google OAuth 2.0
- **Auto-Save** — Documents auto-save every 3 seconds with debounce
- **Online Presence** — See who's currently viewing/editing a document with colored avatars

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, React Router v6, TailwindCSS, TipTap, Socket.io-client, Axios |
| **Backend** | Node.js, Express.js, Socket.io, Mongoose, JWT, Passport.js |
| **Database** | MongoDB |
| **AI** | Google Gemini 2.5 Flash via @google/generative-ai |
| **Auth** | JWT + Google OAuth 2.0 (Passport.js) |

## Project Structure
├── client/ # React frontend (Vite)
│ ├── src/
│ │ ├── components/ # Editor, AISidebar, ChatSidebar, OnlineUsers
│ │ ├── context/ # AuthContext
│ │ ├── lib/ # API (Axios), Socket.io
│ │ └── pages/ # Login, Register, Dashboard, Workspace, Document
│ └── ...
├── server/ # Express backend
│ ├── config/ # DB connection, Passport.js
│ ├── controllers/ # Auth, Workspace, Document, AI controllers
│ ├── middleware/ # JWT auth middleware
│ ├── models/ # User, Workspace, Document, Message schemas
│ ├── routes/ # API routes
│ └── socket/ # Socket.io event handlers
└── ...

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas)
- Google Cloud Console account (for OAuth)
- Google AI Studio account (for Gemini API key)
