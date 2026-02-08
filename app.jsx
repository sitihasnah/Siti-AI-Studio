import React from 'react';
import ReactDOM from 'react-dom/client';

const App = () => {
  return React.createElement('div', {
    className: 'w-full h-screen bg-gradient-to-br from-purple-900 to-black flex items-center justify-center'
  }, React.createElement('h1', {
    className: 'text-5xl font-wizard text-white'
  }, 'Welcome to Wizard Quest'));
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));