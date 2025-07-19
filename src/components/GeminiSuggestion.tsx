import React from 'react';
import { MagicWandIcon } from '@/components/icons';

interface GeminiSuggestionProps {
  suggestions: string[];
  isLoading: boolean;
  selectedStyle: string | null;
  onSelectStyle: (style: string) => void;
}

export const GeminiSuggestion: React.FC<GeminiSuggestionProps> = ({ suggestions, isLoading, selectedStyle, onSelectStyle }) => {
  if (isLoading) {
    return (
      <div className="w-full max-w-md mx-auto p-4 bg-stone-100 rounded-lg animate-pulse">
        <div className="h-4 bg-stone-300 rounded w-3/4 mx-auto"></div>
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          <div className="h-8 bg-stone-300 rounded-full w-24"></div>
          <div className="h-8 bg-stone-300 rounded-full w-32"></div>
          <div className="h-8 bg-stone-300 rounded-full w-28"></div>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-md mx-auto p-4 bg-white/60 rounded-xl shadow-sm border border-stone-200/80">
      <h3 className="flex items-center justify-center text-md font-semibold text-stone-700 mb-3">
        <MagicWandIcon className="w-5 h-5 mr-2 text-stone-600" />
        Choose a Creative Style
      </h3>
      <div className="flex flex-wrap justify-center gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => onSelectStyle(suggestion)}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200 border
              ${selectedStyle === suggestion 
                ? 'bg-stone-800 text-white border-stone-800 shadow-md' 
                : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100 hover:border-stone-400'
              }`}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};