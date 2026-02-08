import React from 'react';
import ReactDOM from 'react-dom/client';

export default function App() {
  return (
    <div className="w-full h-screen bg-gradient-to-br from-purple-900 to-black flex items-center justify-center">
      <h1 className="text-5xl font-wizard text-white">Welcome to Wizard Quest</h1>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);