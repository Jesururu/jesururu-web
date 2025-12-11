import React from 'react';

// =========================================
// 3B. GLOBAL STYLES (Print Fix: Collapse Layout)
// =========================================
const GlobalStyles = () => (
    <style>{`
        @keyframes shine-move {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-liquid-gold {
          background-size: 200% auto;
          animation: shine-move 3s linear infinite;
        }
      `}</style>
);
export default GlobalStyles;