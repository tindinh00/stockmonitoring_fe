import React from 'react';
import { Search } from 'lucide-react';

export default function SearchInput({ darkMode = false }) {
  return (
    <div className="relative">
      <Search className={`absolute left-2.5 top-2.5 h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
      <input
        type="search"
        placeholder="Search..."
        className={`h-9 w-64 rounded-md pl-8 pr-4 text-sm outline-none focus:ring-1 ${
          darkMode 
            ? 'bg-[#131325] border-[#1f1f30] text-white placeholder:text-gray-500 focus:border-indigo-600 focus:ring-indigo-600/20' 
            : 'bg-white border-gray-200 text-gray-900 focus:border-gray-300 focus:ring-gray-300'
        } border`}
      />
    </div>
  );
}