import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import Client from './Client';
import Editor from './Editor';
import { initSocket } from '../Socket';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const EditorPage = () => {
    const socketRef = useRef(null);
    const codeRef = useRef(null);
    const location = useLocation();
    const { roomId } = useParams();
    const reactNavigator = useNavigate();
    const [clients, setClients] = useState([]);
    const [isConnecting, setIsConnecting] = useState(true);

    useEffect(() => {
        let mounted = true;

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

        init();

        return () => {
            mounted = false;
            if (socketRef.current) {
                console.log('Cleaning up socket connection...');
                socketRef.current.disconnect();
                socketRef.current.off('connect_error');
                socketRef.current.off('connect_failed');
                socketRef.current.off('joined');
                socketRef.current.off('disconnected');
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
            <div className="container-fluid p-0">
                <div className="row g-0">
                    <motion.div
                        className="col-md-3 col-lg-2 bg-gradient p-4"
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="d-flex flex-column h-100">
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

                            <div className="mt-auto">
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
                        className="col-md-9 col-lg-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <Editor
                            socketRef={socketRef}
                            roomId={roomId}
                            onCodeChange={(code) => {
                                codeRef.current = code;
                            }}
                        />
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};

export default EditorPage;
