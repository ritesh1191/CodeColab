# CodeColab

CodeColab is a real-time code collaboration web application that allows multiple users to collaborate on code in the same virtual room. It's built using the Express.js, React, Node.js, Bootstrap and Socket.IO for real-time communication.

## Features

- Create or join a virtual "room" by entering a room ID.
- Set your username to identify yourself in the room.
- Real-time code collaboration with other users in the same room.
- Changes made by one user are instantly reflected on all connected clients.
- Realtime Tag of whos currently typing in editor.
- Code highlighting and editor customization options.

## Technologies Used

- Express.js: Handling API requests.
- React: Building the front-end interface.
- Node.js: Running the server.
- Socket.IO: Enabling real-time communication.
- uuid: Generating unique room IDs.
- CodeMirror: Providing the code editor.

## Usage

1. Open the CodeColab Application Home Page.
2. Enter a Room ID or generate a new one.
3. Set your username.
4. Start collaborating with others in the same room.

## Photos

- Join Room Page

<img width="1280" alt="Screenshot 2025-05-25 at 1 33 33 PM" src="https://github.com/user-attachments/assets/c01b4800-9b42-4c32-928e-20684e611209" />


- Editor Page
  
<img width="1280" alt="Screenshot 2025-05-25 at 1 35 17 PM" src="https://github.com/user-attachments/assets/ad96357b-1dcf-4f31-8085-a758c3c6016a" />



- Multiple People Collaborating on same code

https://github.com/user-attachments/assets/1b87bc6e-07ba-4a28-b21c-91ee4b79b56a



## Run Locally

Clone the project

```bash
  git clone https://github.com/YOUR-USERNAME/CodeColab.git
```

Go to the project directory

```bash
  cd CodeColab
```

Install dependencies

```bash
  cd client
  npm install
```

```bash
  cd server
  npm install
```

Start Application

Backend:

```bash
  cd server
  npm start
```

Frontend:

```bash
  cd client
  npm start
```

# Before Running code a Add a .env File in client Folder and server Folder:

# .env Structure(in Client Folder):

- REACT_APP_BACKEND_URL=http://localhost:{PORT_IN_BELOW_ENV}

# .env Structure (in server Folder)

- PORT=ANY_PORT_NO
- CORS_ORIGIN=http://localhost:{ANY_NO)
