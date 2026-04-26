'use client';

import { motion } from 'framer-motion';

interface FaceProps {
  isSpeaking: boolean;
  isListening: boolean;
}

export default function Face({ isSpeaking, isListening }: FaceProps) {
  return (
    <div style={{ position: 'relative', width: '300px', height: '300px' }}>
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Head Shape */}
        <motion.circle 
          cx="100" cy="100" r="80" 
          fill="white" 
          stroke="#F4E8E0" 
          strokeWidth="2"
          animate={{
            scale: isListening ? [1, 1.02, 1] : 1,
          }}
          transition={{ repeat: Infinity, duration: 2 }}
        />

        {/* Eyes */}
        <motion.g>
          {/* Left Eye */}
          <motion.ellipse 
            cx="70" cy="85" rx="6" ry="8" 
            fill="#4A3B31"
            animate={{
              ry: [8, 0.5, 8],
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 3, 
              times: [0, 0.1, 0.2],
              delay: 2
            }}
          />
          {/* Right Eye */}
          <motion.ellipse 
            cx="130" cy="85" rx="6" ry="8" 
            fill="#4A3B31"
            animate={{
              ry: [8, 0.5, 8],
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 3, 
              times: [0, 0.1, 0.2],
              delay: 2.1
            }}
          />
        </motion.g>

        {/* Mouth */}
        <motion.path
          d={isSpeaking ? "M 80 130 Q 100 150 120 130" : "M 85 135 Q 100 140 115 135"}
          stroke="#4A3B31"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          animate={isSpeaking ? {
            d: [
              "M 80 130 Q 100 160 120 130",
              "M 80 130 Q 100 140 120 130",
              "M 80 130 Q 100 160 120 130"
            ]
          } : {
            d: "M 85 135 Q 100 140 115 135"
          }}
          transition={{ repeat: Infinity, duration: 0.2 }}
        />

        {/* Cheeks */}
        <circle cx="60" cy="110" r="10" fill="#FF6B35" fillOpacity="0.1" />
        <circle cx="140" cy="110" r="10" fill="#FF6B35" fillOpacity="0.1" />
      </svg>

      {/* Halo/Aura when listening */}
      {isListening && (
        <motion.div
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            borderRadius: '50%',
            border: '2px solid var(--accent)',
            zIndex: -1
          }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.4, opacity: 0 }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
      )}
    </div>
  );
}
