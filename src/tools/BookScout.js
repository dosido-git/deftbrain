import React, { useState } from 'react';
// Import the Search icon explicitly
import { Search } from 'lucide-react';

const BookScout = () => {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);

  const performSearch = () => {
    if (!query) return;
    setIsSearching(true);
    // Simulating an API call
    setTimeout(() => {
      setResults([
        { site: "Amazon", price: 84.99 }, 
        { site: "Chegg", price: 32.50 }
      ]);
      setIsSearching(false);
    }, 1000);
  };

  return (
    <div className="w-full space-y-4 mt-4 text-left">
      <div className="flex gap-2">
        <input 
          placeholder="ISBN or Title..." 
          className="flex-1 p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" 
          value={query} 
          onChange={e => setQuery(e.target.value)} 
        />
        <button 
          onClick={performSearch} 
          className="p-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
        >
          {/* Using the component explicitly */}
          <Search size={20} />
        </button>
      </div>

      {isSearching ? (
        <p className="text-center animate-pulse text-gray-500 text-sm">Searching bookstores...</p>
      ) : (
        results && results.map((r, i) => (
          <div key={i} className="flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
            <span className="font-medium text-gray-700">{r.site}</span>
            <span className="font-bold text-emerald-600">${r.price}</span>
          </div>
        ))
      )}
    </div>
  );
};

export default BookScout;