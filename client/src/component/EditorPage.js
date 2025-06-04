import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import Client from './Client';
import Editor from './Editor';
import { initSocket } from '../Socket';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { executeCode } from '../services/codeExecutionService';

const EditorPage = () => {
    const socketRef = useRef(null);
    const codeRef = useRef(null);
    const location = useLocation();
    const { roomId } = useParams();
    const reactNavigator = useNavigate();
    const [clients, setClients] = useState([]);
    const [isConnecting, setIsConnecting] = useState(true);
    const [language, setLanguage] = useState('python');
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [error, setError] = useState('');
    const [activeUsers, setActiveUsers] = useState({});

    useEffect(() => {
        let mounted = true;
        let activityTimeouts = {};

        const init = async () => {
            if (!location.state?.username || !roomId) {
                toast.error('Invalid room or username', {
                    style: {
                        background: 'var(--danger-color)',
                        color: '#fff',
                        borderRadius: 'var(--radius-lg)',
                    },
                    icon: '⚠️',
                    duration: 3000,
                });
                reactNavigator('/');
                return;
            }

            try {
                setIsConnecting(true);
                const socket = await initSocket();
                
                if (!mounted) {
                    socket.disconnect();
                    return;
                }

                socketRef.current = socket;

                socket.on('connect_error', handleErrors);
                socket.on('connect_failed', handleErrors);

                socket.emit('join', {
                    roomId,
                    username: location.state?.username,
                });

                // Listen for code changes from other users
                socket.on('code-change', ({ code, username }) => {
                    if (code !== null) {
                        codeRef.current = code;
                        // if (username) {
                        //     showUserActivity(username, 'code');
                        // }
                    }
                });

                // Listen for input changes from other users
                socket.on('input-change', ({ input: newInput, username }) => {
                    if (newInput !== null && newInput !== input) {
                        setInput(newInput);
                    }
                    if (username) {
                        showUserActivity(username, 'input');
                    }
                });

                // Listen for language changes from other users
                socket.on('language-change', ({ language: newLanguage, username }) => {
                    setLanguage(newLanguage);
                    if (username) {
                        showUserActivity(username, 'language');
                    }
                });

                // Listen for code execution events
                socket.on('code-execution', ({ output, error, username }) => {
                    if (error) {
                        setError(error);
                    } else {
                        setError('');
                    }
                    setOutput(output || '');
                });

                // Listen for code running notifications
                socket.on('code-running', ({ username }) => {
                    if (username !== location.state?.username) {
                        // Show toast for other users
                        toast.loading(`${username} is running code...`, {
                            style: {
                                background: 'var(--primary-color)',
                                color: '#fff',
                                borderRadius: 'var(--radius-lg)',
                            },
                            icon: '⚙️',
                            duration: 2000,
                        });
                        showUserActivity(username, 'running');
                    }
                });

                socket.on('joined', ({ clients, username, socketId }) => {
                    if (mounted) {
                        if (username !== location.state?.username) {
                            toast.success(`${username} joined the room.`, {
                                style: {
                                    background: 'var(--success-color)',
                                    color: '#fff',
                                    borderRadius: 'var(--radius-lg)',
                                },
                                icon: '👋',
                                duration: 3000,
                            });
                        }
                        setClients(clients);
                        setIsConnecting(false);
                    }
                });

                socket.on('disconnected', ({ socketId, username }) => {
                    if (mounted) {
                        toast.error(`${username} left the room.`, {
                            style: {
                                background: 'var(--warning-color)',
                                color: '#fff',
                                borderRadius: 'var(--radius-lg)',
                            },
                            icon: '👋',
                            duration: 3000,
                        });
                        setClients((prev) => {
                            return prev.filter(
                                (client) => client.socketId !== socketId
                            );
                        });
                    }
                });

            } catch (err) {
                console.error('Socket initialization error:', err);
                if (mounted) {
                    toast.error('Failed to connect to the server. Please try again later.', {
                        style: {
                            background: 'var(--danger-color)',
                            color: '#fff',
                            borderRadius: 'var(--radius-lg)',
                        },
                        icon: '⚠️',
                        duration: 3000,
                    });
                    setIsConnecting(false);
                    reactNavigator('/');
                }
            }
        };

        function handleErrors(e) {
            console.log('socket error', e);
            if (mounted) {
                toast.error('Failed to connect to the server. Please try again later.', {
                    style: {
                        background: 'var(--danger-color)',
                        color: '#fff',
                        borderRadius: 'var(--radius-lg)',
                    },
                    icon: '⚠️',
                    duration: 3000,
                });
                setIsConnecting(false);
                reactNavigator('/');
            }
        }

        const showUserActivity = (username, activityType) => {
            if (username === location.state?.username) return; // Don't show for current user
            
            setActiveUsers(prev => ({
                ...prev,
                [username]: {
                    type: activityType,
                    timestamp: Date.now()
                }
            }));

            // Clear the activity after 2 seconds
            if (activityTimeouts[username]) {
                clearTimeout(activityTimeouts[username]);
            }

            activityTimeouts[username] = setTimeout(() => {
                setActiveUsers(prev => {
                    const newState = { ...prev };
                    delete newState[username];
                    return newState;
                });
            }, 2000);
        };

        init();

        return () => {
            mounted = false;
            // Clear all timeouts
            Object.values(activityTimeouts).forEach(timeout => clearTimeout(timeout));
            if (socketRef.current) {
                console.log('Cleaning up socket connection...');
                socketRef.current.disconnect();
                socketRef.current.off('connect_error');
                socketRef.current.off('connect_failed');
                socketRef.current.off('joined');
                socketRef.current.off('disconnected');
                socketRef.current.off('input-change');
                socketRef.current.off('language-change');
                socketRef.current.off('code-change');
                socketRef.current.off('code-execution');
                socketRef.current.off('code-running');
                socketRef.current = null;
            }
        };
    }, [location.state?.username, roomId, reactNavigator]);

    const copyRoomId = async () => {
        try {
            await navigator.clipboard.writeText(roomId);
            toast.success('Room ID copied!', {
                style: {
                    background: 'var(--success-color)',
                    color: '#fff',
                    borderRadius: 'var(--radius-lg)',
                },
                icon: '📋',
                duration: 3000,
            });
        } catch (err) {
            toast.error('Could not copy Room ID', {
                style: {
                    background: 'var(--danger-color)',
                    color: '#fff',
                    borderRadius: 'var(--radius-lg)',
                },
                icon: '⚠️',
                duration: 3000,
            });
        }
    };

    const leaveRoom = () => {
        reactNavigator('/');
    };

    const handleLanguageChange = (e) => {
        const newLanguage = e.target.value;
        setLanguage(newLanguage);
        
        // Emit language change to other users
        socketRef.current.emit('language-change', {
            roomId,
            language: newLanguage,
        });

        toast.success(`Switched to ${newLanguage.toUpperCase()}`, {
            style: {
                background: 'var(--success-color)',
                color: '#fff',
                borderRadius: 'var(--radius-lg)',
            },
            icon: '🔄',
            duration: 2000,
        });
    };

    const handleInputChange = (e) => {
        const newInput = e.target.value;
        setInput(newInput);
        
        // Emit input change to other users
        socketRef.current.emit('input-change', {
            roomId,
            input: newInput,
        });
    };

    const handleRun = async () => {
        if (!codeRef.current) {
            toast.error('Please write some code first!', {
                style: {
                    background: 'var(--danger-color)',
                    color: '#fff',
                    borderRadius: 'var(--radius-lg)',
                },
                icon: '⚠️',
                duration: 3000,
            });
            return;
        }

        setIsRunning(true);
        setError('');
        setOutput('');

        // Show toast for current user
        toast.loading(`Running code...`, {
            style: {
                background: 'var(--primary-color)',
                color: '#fff',
                borderRadius: 'var(--radius-lg)',
            },
            icon: '⚙️',
            duration: 2000,
        });

        // Emit code running event with username
        socketRef.current.emit('code-running', {
            roomId,
            username: location.state?.username
        });

        try {
            const result = await executeCode(codeRef.current, language, input);

            if (result.success) {
                setOutput(result.output);
                // Emit the execution result to other users
                socketRef.current.emit('code-execution', {
                    roomId,
                    output: result.output,
                    error: null
                });

                toast.success(`Code executed successfully!`, {
                    style: {
                        background: 'var(--success-color)',
                        color: '#fff',
                        borderRadius: 'var(--radius-lg)',
                    },
                    icon: '✅',
                    duration: 3000,
                });
            } else {
                setError(result.error);
                setOutput(result.output);
                // Emit the execution error to other users
                socketRef.current.emit('code-execution', {
                    roomId,
                    output: result.output,
                    error: result.error
                });

                toast.error(`Code execution failed!`, {
                    style: {
                        background: 'var(--danger-color)',
                        color: '#fff',
                        borderRadius: 'var(--radius-lg)',
                    },
                    icon: '❌',
                    duration: 3000,
                });
            }
        } catch (err) {
            setError(err.message);
            // Emit the execution error to other users
            socketRef.current.emit('code-execution', {
                roomId,
                output: '',
                error: err.message
            });

            toast.error(`Error: ${err.message}`, {
                style: {
                    background: 'var(--danger-color)',
                    color: '#fff',
                    borderRadius: 'var(--radius-lg)',
                },
                icon: '❌',
                duration: 3000,
            });
        } finally {
            setIsRunning(false);
        }
    };

    const renderActiveUsers = () => {
        return Object.entries(activeUsers).map(([username, activity]) => {
            const activityText = {
                code: 'is editing code',
                input: 'is updating input',
                language: 'is changing language',
                running: 'is running code'
            }[activity.type];

            return (
                <motion.div
                    key={`${username}-${activity.timestamp}`}
                    className="active-user-indicator"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    style={{
                        position: 'fixed',
                        top: '20px',
                        right: '20px',
                        background: 'var(--success-color)',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        zIndex: 1000,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                >
                    <span style={{ fontWeight: 'bold' }}>{username}</span> {activityText}
                </motion.div>
            );
        });
    };

    if (!location.state) {
        return (
            <motion.div
                className="container min-vh-100 d-flex flex-column justify-content-center align-items-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
            >
                <motion.div
                    className="card glass-effect text-center p-5"
                    whileHover={{ scale: 1.02 }}
                >
                    <h1 className="text-gradient mb-4">Oops!</h1>
                    <p className="text-secondary mb-4">
                        Please provide a valid room ID and username to join.
                    </p>
                    <motion.button
                        className="btn"
                        onClick={() => reactNavigator('/')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Return Home
                    </motion.button>
                </motion.div>
            </motion.div>
        );
    }

    if (isConnecting) {
        return (
            <motion.div
                className="container min-vh-100 d-flex flex-column justify-content-center align-items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <div className="loader mb-4"></div>
                <h3 className="text-gradient">Connecting to the room...</h3>
            </motion.div>
        );
    }

    return (
        <motion.div
            className="app-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <AnimatePresence>
                {renderActiveUsers()}
            </AnimatePresence>
            <div className="container-fluid p-0">
                <div className="row g-0">
                    <motion.div
                        className="col-md-3 col-lg-2 sidebar"
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="p-4">
                            <div className="mb-4">
                                <h3 className="text-light mb-4">Connected Users</h3>
                                <div className="connected-users">
                                    <AnimatePresence>
                                        {clients.map((client) => (
                                            <motion.div
                                                key={client.socketId}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                className="mb-3"
                                            >
                                                <Client
                                                    username={client.username}
                                                    key={client.socketId}
                                                />
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <div className="mt-4">
                                <div className="mb-3">
                                    <label className="text-light mb-2">Language</label>
                                    <select 
                                        className="form-select mb-3"
                                        value={language}
                                        onChange={handleLanguageChange}
                                    >
                                        <option value="python">Python</option>
                                        <option value="cpp">C++</option>
                                        <option value="java">Java</option>
                                    </select>
                                    <motion.button
                                        className="btn btn-success w-100 mb-3"
                                        onClick={handleRun}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        disabled={isRunning}
                                    >
                                        {isRunning ? 'Running...' : 'Run Code'}
                                    </motion.button>
                                </div>
                                <motion.button
                                    className="btn btn-light w-100 mb-3"
                                    onClick={copyRoomId}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <i className="bi bi-clipboard me-2"></i>
                                    Copy Room ID
                                </motion.button>
                                <motion.button
                                    className="btn btn-outline-light w-100"
                                    onClick={leaveRoom}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <i className="bi bi-box-arrow-left me-2"></i>
                                    Leave Room
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        className="col-md-9 col-lg-10 editor-section"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <div className="flex-grow-1">
                            <Editor
                                socketRef={socketRef}
                                roomId={roomId}
                                language={language}
                                onCodeChange={(code) => {
                                    codeRef.current = code;
                                }}
                            />
                        </div>
                        <motion.div 
                            className="io-container"
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.6 }}
                        >
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label>Input</label>
                                        <textarea
                                            className="form-control"
                                            value={input}
                                            onChange={handleInputChange}
                                            placeholder="Enter program input here..."
                                            style={{ resize: 'none' }}
                                        />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label>Output</label>
                                        <textarea
                                            className={`form-control ${error ? 'is-invalid' : ''}`}
                                            value={error || output}
                                            readOnly
                                            placeholder="Program output will appear here..."
                                            style={{ 
                                                resize: 'none',
                                                color: error ? 'var(--danger-color)' : 'inherit'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};

export default EditorPage;
