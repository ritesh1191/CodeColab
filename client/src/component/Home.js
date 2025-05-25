import React, { useState } from "react";
import { v4 as uuid } from "uuid";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

function Home() {
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const generateRoomId = (e) => {
    e.preventDefault();
    const id = uuid();
    setRoomId(id);
    toast.success("New Room ID Generated", {
      style: {
        background: 'var(--primary-color)',
        color: '#fff',
        borderRadius: 'var(--radius-lg)',
      },
      icon: '🎉',
      duration: 3000,
    });
  };

  const joinRoom = async () => {
    if (!roomId || !username) {
      toast.error("Please fill in all fields", {
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

    setIsLoading(true);
    
    setTimeout(() => {
      navigate(`/editor/${roomId}`, {
        state: {
          username,
        },
      });
      
      toast.success("Welcome to the room!", {
        style: {
          background: 'var(--success-color)',
          color: '#fff',
          borderRadius: 'var(--radius-lg)',
        },
        icon: '🚀',
        duration: 3000,
      });
      
      setIsLoading(false);
    }, 800);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { 
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="app-wrapper">
      <motion.div 
        className="container min-vh-100 d-flex justify-content-center align-items-center py-5"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="col-12 col-md-6 col-lg-5">
          <motion.div 
            className="card glass-effect border-0"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="card-body p-4 p-md-5">
              <motion.div
                className="text-center mb-5"
                variants={itemVariants}
              >
                <motion.img
                  className="img-fluid mx-auto d-block mb-4"
                  src="/images/Logo.png"
                  alt="Logo"
                  style={{ maxWidth: "180px" }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                />
                <h2 className="text-gradient fw-bold mb-4">Join Collaboration Room</h2>
                <p className="text-secondary mb-0">Connect with your team in real-time</p>
              </motion.div>

              <motion.div 
                className="form-group mb-4"
                variants={itemVariants}
              >
                <label className="form-label">Room ID</label>
                <div className="input-group">
                  <motion.input
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    type="text"
                    className="input"
                    placeholder="Enter Room ID"
                    whileFocus={{ scale: 1.01 }}
                  />
                </div>
              </motion.div>

              <motion.div 
                className="form-group mb-4"
                variants={itemVariants}
              >
                <label className="form-label">Your Name</label>
                <motion.input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  type="text"
                  className="input"
                  placeholder="Enter your name"
                  whileFocus={{ scale: 1.01 }}
                />
              </motion.div>

              <motion.button
                className="btn w-100 mb-4"
                onClick={joinRoom}
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                variants={itemVariants}
              >
                {isLoading ? (
                  <>
                    <span className="loader me-2"></span>
                    Joining...
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Join Room
                  </>
                )}
              </motion.button>

              <motion.div 
                className="text-center"
                variants={itemVariants}
              >
                <p className="mb-0 text-secondary">
                  Need a new room?{" "}
                  <motion.span
                    className="text-primary fw-bold"
                    style={{ cursor: "pointer" }}
                    onClick={generateRoomId}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    Generate Room ID
                  </motion.span>
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export default Home;
