import React from 'react';
import { UploadIcon, PhotoIcon } from '@/components/icons';

interface ImageFrameProps {
  title: string;
  imageSrc: string | null;
  isLoading?: boolean;
  isUploadFrame?: boolean;
  onUploadClick?: () => void;
}

export const ImageFrame: React.FC<ImageFrameProps> = ({ title, imageSrc, isLoading = false, isUploadFrame = false, onUploadClick }) => {
  return (
    <div className="flex flex-col items-center">
      <h2 className="text-xl font-semibold text-stone-700 mb-4">{title}</h2>
      <div className="relative w-full aspect-square max-w-md bg-stone-200 rounded-2xl shadow-lg overflow-hidden border-4 border-white/80 flex items-center justify-center">
        {imageSrc && <img src={imageSrc} alt={title} className="w-full h-full object-cover" />}
        
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white z-10 transition-opacity duration-300">
            <svg className="animate-spin h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-lg font-semibold">Generating...</p>
          </div>
        )}

        {!imageSrc && !isLoading && (
          isUploadFrame ? (
            <button 
              onClick={onUploadClick} 
              className="flex flex-col items-center justify-center text-stone-600 hover:text-stone-800 transition-colors w-full h-full"
              aria-label="Upload your portrait"
            >
              <UploadIcon className="w-16 h-16" />
              <span className="mt-4 font-semibold text-lg">Click to upload photo</span>
              <span className="text-sm text-stone-500">PNG, JPG, or WEBP</span>
            </button>
          ) : (
            <div className="flex flex-col items-center text-stone-500 p-4">
              <PhotoIcon className="w-16 h-16" />
              <span className="mt-4 font-semibold text-lg text-center">Your AI Avatar<br />will appear here</span>
            </div>
          )
        )}
      </div>
    </div>
  );
};