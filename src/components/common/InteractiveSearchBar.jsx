import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Filter, Sparkles, ArrowUpRight, TrendingUp } from 'lucide-react';

const DEFAULT_SUGGESTIONS = [
  { label: 'Complete Blood Count (CBC)', category: 'Hematology', tag: 'Popular' },
  { label: 'Lipid Profile', category: 'Biochemistry', tag: 'Fast' },
  { label: 'Fasting Blood Sugar (FBS)', category: 'Biochemistry', tag: 'Diabetes' },
  { label: 'Thyroid Profile (T3, T4, TSH)', category: 'Immunology', tag: 'Hormones' },
  { label: 'HbA1c Glycated Hemoglobin', category: 'Biochemistry', tag: 'Diabetes' },
  { label: 'Kidney Function Test (KFT)', category: 'Biochemistry', tag: 'Renal' },
  { label: 'Liver Function Test (LFT)', category: 'Biochemistry', tag: 'Hepatic' },
];

export default function InteractiveSearchBar({
  placeholder = 'Search tests, patients, IDs, reports, or status...',
  value = '',
  onChange = () => {},
  suggestions = DEFAULT_SUGGESTIONS,
  filterTags = [],
  activeTag = '',
  onSelectTag = () => {},
  resultCount = null,
  className = '',
}) {
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Normalize text for flexible matching (handles uppercase, lowercase, hyphens, e.g. inv000002 vs INV-000002)
  const normalize = (str) => (str || '').toLowerCase().replace(/[-_\s]/g, '');

  const queryNorm = normalize(value);

  // Filter recommendations based on user input
  const filteredSuggestions = suggestions.filter((item) => {
    const text = typeof item === 'string' ? item : item.label || '';
    return normalize(text).includes(queryNorm);
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectRecommendation = (recText) => {
    onChange(recText);
    setShowDropdown(false);
  };

  return (
    <div ref={containerRef} className={`relative space-y-2 ${className}`}>
      {/* Main Interactive Input Container */}
      <div
        className={`relative flex items-center bg-white rounded-2xl border transition-all duration-200 ${
          isFocused
            ? 'border-blue-600 ring-4 ring-blue-500/10 shadow-lg shadow-blue-500/5'
            : 'border-slate-200 shadow-sm hover:border-slate-300'
        }`}
      >
        <div className="pl-3.5 text-slate-400 flex items-center gap-2">
          <Search className={`w-4 h-4 transition-colors ${isFocused ? 'text-blue-600' : 'text-slate-400'}`} />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => {
            setIsFocused(true);
            setShowDropdown(true);
          }}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="w-full bg-transparent px-3 py-3 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none"
        />

        {/* Right Action Tools: Clear Button, Match Count */}
        <div className="pr-3 flex items-center gap-2 shrink-0">
          {resultCount !== null && value.trim().length > 0 && (
            <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              {resultCount} {resultCount === 1 ? 'match' : 'matches'}
            </span>
          )}

          {value && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                onChange('');
                setShowDropdown(false);
              }}
              className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Interactive Recommendations Autocomplete Dropdown (ONLY if matches exist) */}
      <AnimatePresence>
        {showDropdown && filteredSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-12 z-50 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-2xl p-3 space-y-2 max-h-72 overflow-y-auto"
          >
            <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-100">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-600" />
                {value.trim() ? 'Recommended Search Matches' : 'Popular Search Suggestions'}
              </span>
              <span className="text-[10px] text-slate-400">Click to fill</span>
            </div>

            <div className="space-y-1">
              {filteredSuggestions.slice(0, 6).map((item, idx) => {
                const label = typeof item === 'string' ? item : item.label;
                const category = typeof item === 'object' ? item.category : null;
                const tag = typeof item === 'object' ? item.tag : null;

                return (
                  <motion.button
                    key={idx}
                    whileHover={{ x: 3, backgroundColor: 'rgba(239, 246, 255, 0.8)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectRecommendation(label)}
                    className="w-full text-left px-3 py-2 rounded-xl flex items-center justify-between group transition text-xs cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5 text-blue-500 opacity-60 group-hover:opacity-100" />
                      <span className="font-bold text-slate-800 group-hover:text-blue-900">{label}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {category && (
                        <span className="text-[10px] text-slate-400 group-hover:text-blue-700">{category}</span>
                      )}
                      {tag && (
                        <span className="text-[9px] font-extrabold bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">
                          {tag}
                        </span>
                      )}
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition" />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Filter Chips Bar */}
      {filterTags && filterTags.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3 text-slate-400" /> Filters:
          </span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelectTag('')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition shrink-0 ${
              !activeTag
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All
          </motion.button>
          {filterTags.map((tag) => (
            <motion.button
              key={tag.value || tag}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectTag(tag.value || tag)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition shrink-0 ${
                activeTag === (tag.value || tag)
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tag.label || tag}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
