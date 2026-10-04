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
import ToolFaq from './components/ToolFaq';
import SiteEnd from './components/SiteEnd';
import NotFound from './components/NotFound';
import SharedVerdict from './components/SharedVerdict';
import AllToolsPage from './components/AllToolsPage';
import WaitNotice from './components/WaitNotice';
import OrganizationsPage from './components/OrganizationsPage';

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
          <div className="db-app-root min-h-screen bg-white font-sans flex flex-col">
            <div className="flex-1">
              <Routes>
                <Route path="/" element={
                  <div className="min-h-screen bg-[var(--db-sand50)]">
                    <DashBoard
                      allTools={tools}
                      searchTerm={searchTerm}
                      setSearchTerm={setSearchTerm}
                    />
                  </div>
                } />
                <Route path="/verdict/:id" element={<SharedVerdict />} />
                <Route path="/tools" element={<AllToolsPage allTools={tools} />} />
                <Route path="/organizations" element={<OrganizationsPage allTools={tools} />} />
                <Route path="/:toolId" element={<ToolRenderer college={college} />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            {/* Above the routes so it follows the visitor between pages: how
                long an answer usually takes, and "it's ready" if they left. */}
            <WaitNotice />
            <ToolFaq />
            <RelatedLinks />
            <SiteEnd />
            <Footer />
          </div>
        </BrowserRouter>
        </PremiumProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
