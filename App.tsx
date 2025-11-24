import React, { useState } from 'react';
import Intro from './components/Intro';
import Game from './components/Game';

const App: React.FC = () => {
  const [hasStarted, setHasStarted] = useState(false);

  return (
    <div className="w-screen h-screen bg-black overflow-hidden font-sans">
      {!hasStarted ? (
        <Intro onStart={() => setHasStarted(true)} />
      ) : (
        <Game />
      )}
    </div>
  );
};

export default App;