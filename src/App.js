import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { tools } from './data/tools';
import { ThemeProvider } from './hooks/useTheme';
import { LocaleProvider } from './hooks/useLocale';
import { PremiumProvider } from './hooks/usePremium';

// Components
import ToolRenderer from './components/ToolRenderer';
import DashBoard from './components/DashBoard';
import Footer from './components/Footer';
import RelatedLinks from './components/RelatedLinks';
import NotFound from './components/NotFound';

export default function App() {
  const [college] = useState("");
  const [searchTerm, setSearchTerm] = useState('');

  // Prevent layout shift when scrollbar appears/disappears
  useEffect(() => {
    document.documentElement.style.overflowY = 'scroll';
  }, []);

  return (
    <ThemeProvider>
      <LocaleProvider>
        <PremiumProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-white font-sans flex flex-col">
            <div className="flex-1">
              <Routes>
                <Route path="/" element={
                  <div className="min-h-screen bg-[#faf8f5]">
                    <DashBoard
                      allTools={tools}
                      searchTerm={searchTerm}
                      setSearchTerm={setSearchTerm}
                    />
                  </div>
                } />
                <Route path="/:toolId" element={<ToolRenderer college={college} />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <RelatedLinks />
            <Footer />
          </div>
        </BrowserRouter>
        </PremiumProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
