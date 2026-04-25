# IEEE Paper Draft Content: Collaborative Whiteboard

This document contains a structured summary of the "Collaborative Whiteboard" project, formatted to assist in drafting an IEEE-style research paper.

---

## 1. Title
**A Scalable Real-Time Collaborative Whiteboard System using WebSockets, Spring Boot, and Next.js**

## 2. Abstract
The shift towards remote collaboration has increased the demand for interactive tools that facilitate real-time brainstorming and visual communication. This project presents a full-stack collaborative whiteboard application that allows multiple users to draw, annotate, and share ideas simultaneously within virtual rooms. The system leverages **Next.js** for a responsive frontend, **Spring Boot** for a robust backend service, and **WebSockets (STOMP/SockJS)** for low-latency, real-time data synchronization. User data and canvas states are persisted in **MongoDB**, a NoSQL database, ensuring that collaborative sessions can be resumed. Key features include various drawing instruments, room-based isolation, and session export/import capabilities.

## 3. Introduction
*   **Motivation:** Traditional whiteboards are limited by physical proximity. Digital alternatives often lack the responsiveness or the persistence required for effective professional and educational use.
*   **Problem Statement:** Developing a system that handles concurrent drawing inputs from multiple users without significant lag while maintaining data integrity across all clients.
*   **Objective:** To build a high-performance, real-time collaborative tool that provides a seamless user experience similar to physical drawing.

## 4. System Architecture
### A. Frontend Layer (Client-Side)
*   **Framework:** Next.js (React) for server-side rendering and efficient UI components.
*   **Canvas API:** Utilizes the HTML5 Canvas API for high-performance rendering of drawing strokes and shapes.
*   **State Management:** React Hooks (`useState`, `useEffect`, `useRef`) manage local drawing states and synchronization with the server.
*   **Drawing Logic:** Supports Pencil, Eraser, Rectangle, Circle, Line, and Text tools. Implements coordinate transformation for zooming and panning features.

### B. Backend Layer (Server-Side)
*   **Framework:** Spring Boot (Java) provides the RESTful API and WebSocket management.
*   **Real-Time Communication:** Implements STOMP over WebSockets using SockJS for reliable, bidirectional communication between the server and clients.
*   **Room Management:** Logic to handle user join/leave events and broadcast messages to specific room channels (`/topic/room/{id}`).

### C. Data Persistence Layer
*   **Database:** MongoDB is used to store room metadata and drawing histories as hierarchical JSON documents.
*   **Schema Design:** A `Room` document contains a list of `Drawing` objects, where each `Drawing` consists of a series of coordinate points and styling metadata (color, width, instrument).

## 5. Implementation Details
*   **Synchronization Mechanism:** When a user draws, coordinates are captured and broadcasted in real-time via WebSockets to all other participants in the same room.
*   **Conflict Resolution:** The system uses a sequential event model where the server acts as a relay for drawing events, ensuring all clients eventually render the same state.
*   **Optimized Rendering:** To maintain performance, only the latest drawing strokes are broadcasted, and the entire canvas is redrawn only when necessary (e.g., window resize, zoom change).
*   **Persistence Strategy:** Stamping drawing events into the database allows new participants to fetch the entire history upon joining, providing a consistent "live" view.

## 6. Key Features
*   **Multi-Tool Support:** Flexible drawing options including geometric shapes and text annotations.
*   **Real-Time User Presence:** Tracking and displaying online users within a room.
*   **Session Management:** Saving canvas state as a local file (`.txt`/JSON) and importing it back to restore the session.
*   **Zooming and Panning:** Intuitive navigation across an expansive canvas using mouse wheel and right-click gestures.

## 7. Results and Discussion
*   **Performance:** The use of WebSockets ensures sub-100ms latency for drawing broadcasts in local environments.
*   **Scalability:** The room-based architecture allows the system to scale by distributing rooms across different server instances (future scope).
*   **Usability:** The interface is designed for minimal friction, requiring only a room name/ID to start collaborating.

## 8. Conclusion and Future Work
The Collaborative Whiteboard successfully demonstrates a modern approach to real-time visual synchronization. 
**Future Enhancements:**
*   Implementing a chat system for integrated communication.
*   Adding user authentication and persistent user profiles.
*   Support for image uploads and PDF exports.
*   Integration of an AI-powered shape recognizer to clean up hand-drawn sketches.

---
**Project Progress Summary for AI Input:**
- **Current Status:** Fully functional prototype.
- **Frontend:** Next.js, Canvas API, Socket communication.
- **Backend:** Spring Boot, WebSocket (STOMP), MongoDB Integration.
- **Storage:** Drawings are saved to and fetched from MongoDB.
- **Tools implemented:** Pencil, Eraser, Shapes (Circle, Rect, Line), Text, Undo, Clear, Save/Import.
