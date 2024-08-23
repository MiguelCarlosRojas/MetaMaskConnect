import React from 'react';
import './App.css';
import MetaMaskConnect from './components/MetaMaskConnect';

const App: React.FC = () => {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to My MetaMask dApp</h1>
        <MetaMaskConnect />
      </header>
    </div>
  );
}

export default App;
