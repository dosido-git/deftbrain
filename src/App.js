import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { tools } from './data/tools';
import { ThemeProvider } from './hooks/useTheme';

// Components
import ToolRenderer from './components/ToolRenderer';
import DashBoard from './components/DashBoard';

export default function App() {
  const [college] = useState("");
  const [searchTerm, setSearchTerm] = useState('');

  // Prevent layout shift when scrollbar appears/disappears
  useEffect(() => {
    document.documentElement.style.overflowY = 'scroll';
  }, []);

  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-white font-sans flex flex-col">
          <Routes>
            <Route path="/" element={
              <DashBoard
                allTools={tools}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
              />
            } />

            <Route path="/:toolId" element={<ToolRenderer college={college} />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}
