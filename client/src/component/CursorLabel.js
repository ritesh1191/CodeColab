import React from 'react';
import { motion } from 'framer-motion';

const CursorLabel = ({ username, position }) => {
  if (!position) return null;

  const style = {
    position: 'absolute',
    left: position.left,
    top: position.top - 24, // Position above the cursor
    backgroundColor: 'var(--primary-color)',
    color: 'white',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    pointerEvents: 'none',
    zIndex: 1000,
    whiteSpace: 'nowrap'
  };

  return (
    <motion.div
      style={style}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      {username} is typing...
    </motion.div>
  );
};

export default CursorLabel; 