import React from 'react';
import { motion } from 'framer-motion';

const Client = ({ username }) => {
    const getInitials = (name) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getRandomColor = (name) => {
        const colors = [
            'var(--primary-color)',
            'var(--accent-color)',
            'var(--success-color)',
            'var(--warning-color)',
        ];
        const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[index % colors.length];
    };

    return (
        <motion.div
            className="d-flex align-items-center gap-3 p-2 rounded-lg"
            whileHover={{ x: 4, transition: { duration: 0.2 } }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
        >
            <motion.div
                className="avatar"
                style={{ backgroundColor: getRandomColor(username) }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            >
                {getInitials(username)}
            </motion.div>
            <div className="d-flex flex-column">
                <span className="text-light fw-medium">{username}</span>
                <span className="badge badge-primary">Active</span>
            </div>
        </motion.div>
    );
};

export default Client;
