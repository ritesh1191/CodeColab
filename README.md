# CodeColab 👨‍💻👩‍💻

CodeColab is a real-time collaborative code editor that enables multiple developers to work together on code simultaneously. Built with modern web technologies, it provides a seamless and interactive coding experience with features like real-time synchronization, multi-language support, and live code execution.

- Project Link: https://codecolab-frontend.onrender.com
  
## ✨ Features

### Real-time Collaboration
- **Live Code Synchronization**: See changes from all participants in real-time
- **Cursor Tracking**: View other users' cursor positions and typing indicators
- **User Presence**: See who's currently active in the room
- **Activity Notifications**: Get notified when users join/leave or perform actions

### Code Editor
- **Syntax Highlighting**: Support for multiple programming languages
- **Auto-completion**: Language-specific keyword suggestions
- **Code Folding**: Collapse and expand code blocks
- **Line Numbers**: Clear line reference system
- **Auto Brackets**: Automatic closing of brackets and quotes

### Language Support
- **Python**: Full support with execution
- **Java**: Syntax highlighting and compilation
- **C++**: Code editing and compilation support

### Code Execution
- **Live Output**: See code execution results in real-time
- **Input Support**: Provide input for programs that require it
- **Error Handling**: Clear display of compilation and runtime errors
- **Execution Status**: Visual feedback during code execution

### User Interface
- **Modern Design**: Clean, VS Code-inspired dark theme
- **Responsive Layout**: Works on different screen sizes
- **Intuitive Controls**: Easy-to-use interface
- **Toast Notifications**: Informative feedback for all actions

## 🛠️ Technologies Used

### Frontend
- **React**: UI component library
- **Socket.IO-client**: Real-time communication
- **CodeMirror**: Code editor implementation
- **React Router**: Navigation management
- **Framer Motion**: Smooth animations
- **React Hot Toast**: Notification system
- **Bootstrap**: Responsive styling

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web application framework
- **Socket.IO**: Real-time event handling
- **CORS**: Cross-origin resource sharing

### Development
- **Create React App**: Frontend build setup
- **dotenv**: Environment configuration
- **nodemon**: Development server
- **UUID**: Room ID generation

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository
```bash
git clone https://github.com/YOUR-USERNAME/CodeColab.git
```

2. Go to the project directory
```bash
cd CodeColab
```

3. Install frontend dependencies
```bash
cd client
npm install
```

4. Install backend dependencies
```bash
cd ../server
npm install
```

### Configuration

1. Create `.env` file in the client directory:
```env
REACT_APP_BACKEND_URL=http://localhost:8080
```

2. Create `.env` file in the server directory:
```env
PORT=8080
CORS_ORIGIN=http://localhost:3000
```

### Running the Application

1. Start the backend server
```bash
cd server
npm start
```

2. Start the frontend application
```bash
cd client
npm start
```

The application will be available at `http://localhost:3000`

## 📝 Usage Guide

1. **Starting a Session**
   - Open the application in your browser
   - Generate a new Room ID or enter an existing one
   - Enter your username
   - Click "Join Room"

2. **Collaborating**
   - Share the Room ID with other developers
   - Write or edit code in the editor
   - Select the programming language
   - Add input if required
   - Click "Run Code" to execute

3. **Features Usage**
   - Use `Ctrl + Space` for code completion
   - Use `Ctrl + /` to comment/uncomment lines
   - Use `Ctrl + Q` to fold/unfold code blocks
   - Watch real-time cursor positions of other users
   - Monitor execution status in real-time

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- CodeMirror for the powerful editor component
- Socket.IO for real-time capabilities
- The open-source community for inspiration and tools




## Photos


