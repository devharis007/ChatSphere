# ChatSphere

ChatSphere is a real-time chat application built to demonstrate professional ASP.NET Core + SignalR + React development. Users pick a username and a room, then chat live with everyone in that room — messages, "user is typing" indicators, and the connected-user list all update instantly over a persistent WebSocket connection, with no polling anywhere in the stack.

## Tech Stack

**Backend**
- ASP.NET Core 10 Web API (C#)
- SignalR (`Microsoft.AspNetCore.SignalR`) for real-time, bidirectional communication
- In-memory, thread-safe (`ConcurrentDictionary`-backed) connection store — no database required
- CORS configured for credentialed cross-origin requests from the React dev server

**Frontend**
- React 19 + TypeScript
- Vite for tooling/dev server
- `@microsoft/signalr` client for the hub connection
- Plain CSS (no UI framework) for a clean, dark, chat-app-style interface

## Features

- **Live room join** — pick a username and a room fetched from `GET /api/rooms`; joining a room immediately notifies everyone else in it.
- **Real-time broadcast messaging** — messages sent via the `ChatHub.SendMessage` hub method are broadcast to every client in the SignalR group for that room, over a persistent WebSocket connection (no HTTP polling).
- **Live "is typing" indicator** — debounced client-side typing events (`ChatHub.Typing`) are relayed to everyone else in the room and automatically clear after a pause or on blur/send.
- **Live connected-users sidebar** — the hub maintains a `ConnectionId -> (Username, Room)` map and pushes an updated user list to the room every time someone joins, leaves, or disconnects.
- **Graceful disconnect handling** — `ChatHub.OnDisconnectedAsync` cleans up the connection store, removes the user from their SignalR group, and notifies the rest of the room, so refreshing a tab or closing the browser doesn't leave "ghost" users behind.
- **Auto-scrolling message list** with distinct message bubbles for your own messages vs. others', plus system messages for joins/leaves.
- **Basic edge-case handling** — empty/whitespace-only messages are ignored, a username and room are required to join, and the client uses SignalR's automatic reconnect so a dropped connection doesn't crash the UI.

## Screenshots

_Add screenshots of the join screen and chat screen here._

## Project Structure

```
ChatSphere/
├── backend/                  ASP.NET Core Web API
│   ├── Controllers/          REST endpoints (GET /api/rooms)
│   ├── Hubs/ChatHub.cs       SignalR hub: JoinRoom, SendMessage, Typing, LeaveRoom
│   ├── Models/                DTOs shared between hub/controllers and the client
│   ├── Services/              In-memory connection store + room catalog
│   └── Program.cs             App bootstrap, CORS, SignalR, endpoint mapping
└── frontend/                  React + TypeScript (Vite)
    └── src/
        ├── components/        JoinScreen, ChatScreen, MessageList, Sidebar
        ├── hooks/              useChatConnection — owns the SignalR connection lifecycle
        └── config.ts           API/hub base URLs
```

## Getting Started

### Prerequisites
- [.NET SDK 10+](https://dotnet.microsoft.com/download)
- [Node.js 18+](https://nodejs.org/) and npm

### 1. Run the backend

```bash
cd backend
dotnet run
```

By default the API listens on `http://localhost:5082` (see `Properties/launchSettings.json`) and exposes:
- `GET /api/rooms` — list of available rooms with live online counts
- `/hubs/chat` — the SignalR hub endpoint

### 2. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server runs on `http://localhost:5173` and is already configured (via `src/config.ts`) to talk to the backend at `http://localhost:5082`. Override the API URL with a `VITE_API_BASE_URL` environment variable if you run the backend elsewhere.

Open `http://localhost:5173`, choose a username and room, and start chatting. Open a second browser tab (or an incognito window) with a different username to see real-time messaging, typing indicators, and the online-users list update live between the two sessions.

### 3. Production build check

```bash
cd backend && dotnet build
cd frontend && npm run build
```

Both are verified to build cleanly with zero errors.

## License

MIT — see [LICENSE](LICENSE).
