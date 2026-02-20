import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { tools } from './data/tools';

// Components
import ToolRenderer from './components/ToolRenderer';
import GlobalHeader from './components/GlobalHeader';
import DashBoard from './components/DashBoard';

export default function App() {
  const [college] = useState("");
  const [searchTerm, setSearchTerm] = useState('');

  // Prevent layout shift when scrollbar appears/disappears
  useEffect(() => {
    document.documentElement.style.overflowY = 'scroll';
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white font-sans flex flex-col">
        <Routes>
          <Route path="/" element={
            <>
              <GlobalHeader
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                toolCount={tools.length}
              />
              <DashBoard
                allTools={tools}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
              />
            </>
          } />

          <Route path="/:toolId" element={<ToolRenderer college={college} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
