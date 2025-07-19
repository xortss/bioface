import React, { useState, useCallback, useRef } from 'react';
import { ImageFrame } from '@/components/ImageFrame';
import { EmailSignup } from '@/components/EmailSignup';
import { GeminiSuggestion } from '@/components/GeminiSuggestion';
import { generateAvatar, getSuggestions } from '@/services/geminiService';
import { SparklesIcon, RestartIcon, DownloadIcon } from '@/components/icons';

interface UploadedImage {
  data: string;
  mimeType: string;
}

const App: React.FC = () => {
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [generatedAvatar, setGeneratedAvatar] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState<boolean>(false);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fullReset = () => {
    setUploadedImage(null);
    setGeneratedAvatar(null);
    setError(null);
    setIsGenerating(false);
    setSuggestions([]);
    setSelectedStyle(null);
    setIsFetchingSuggestions(false);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        
        fullReset();
        setUploadedImage({ data: base64, mimeType: file.type });
        setIsFetchingSuggestions(true);

        try {
          const base64Data = base64.split(',')[1];
          const fetchedSuggestions = await getSuggestions(base64Data, file.type);
          setSuggestions(fetchedSuggestions);
        } catch (err) {
          console.error("Failed to fetch suggestions:", err);
          setSuggestions([]); 
        } finally {
          setIsFetchingSuggestions(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleStartOver = () => {
    fullReset();
  };

  const handleDownload = () => {
    if (!generatedAvatar) return;
    const link = document.createElement('a');
    link.href = generatedAvatar;
    link.download = 'biotar.jpeg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleGenerate = useCallback(async () => {
    if (!uploadedImage) {
      setError("Please upload an image first.");
      return;
    }

    setGeneratedAvatar(null);
    setError(null);
    setIsGenerating(true);

    try {
      const base64Data = uploadedImage.data.split(',')[1];
      const avatarBase64 = await generateAvatar(base64Data, uploadedImage.mimeType, selectedStyle);
      setGeneratedAvatar(`data:image/jpeg;base64,${avatarBase64}`);
    } catch (err) {
      console.error(err);
      if (err instanceof Error) {
        const friendlyMessage = err.message.split(':').pop()?.trim();
        setError(friendlyMessage || 'An unexpected error occurred. Please try again.');
      } else {
        setError('An unknown and unexpected error occurred. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  }, [uploadedImage, selectedStyle]);
  
  const hasGenerated = generatedAvatar !== null;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 flex flex-col items-center p-4 sm:p-6 md:p-8">
      <header className="w-full max-w-6xl mx-auto text-center mb-8 md:mb-12">
        <h1 className="font-playfair text-5xl md:text-6xl font-bold text-stone-900">BioFace</h1>
        <p className="mt-2 text-stone-600 text-lg">Find the perfect You, using AI.</p>
      </header>
      
      <main className="w-full max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
          <div className="flex flex-col gap-6">
            <ImageFrame
              title="Your Portrait"
              imageSrc={uploadedImage ? uploadedImage.data : null}
              onUploadClick={triggerFileUpload}
              isUploadFrame={true}
            />
             { (isFetchingSuggestions || suggestions.length > 0) &&
              <GeminiSuggestion
                  isLoading={isFetchingSuggestions}
                  suggestions={suggestions}
                  selectedStyle={selectedStyle}
                  onSelectStyle={setSelectedStyle}
              />
            }
          </div>
          <ImageFrame
            title="Your Biotar"
            imageSrc={generatedAvatar}
            isLoading={isGenerating}
          />
        </div>

        <div className="mt-10 text-center">
          {error && <p className="text-red-600 bg-red-100 p-3 rounded-md mb-4 max-w-2xl mx-auto">{error}</p>}
          
          <div className="flex justify-center items-center gap-4">
            {hasGenerated && (
              <button
              onClick={handleStartOver}
              className="inline-flex items-center justify-center px-6 py-3 bg-stone-200 text-stone-700 font-semibold rounded-lg shadow-sm hover:bg-stone-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-400 transition-all duration-300 transform hover:scale-105"
            >
              <RestartIcon className="w-5 h-5 mr-2" />
              Start Over
            </button>
            )}

            <button
              onClick={handleGenerate}
              disabled={!uploadedImage || isGenerating || isFetchingSuggestions}
              className="inline-flex items-center justify-center px-8 py-4 bg-stone-800 text-white font-semibold rounded-lg shadow-md hover:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-700 disabled:bg-stone-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:scale-100"
            >
              <SparklesIcon className="w-6 h-6 mr-3" />
              {isGenerating ? 'Generating...' : hasGenerated ? 'Regenerate' : 'Generate Avatar'}
            </button>
          
            {hasGenerated && (
              <button
                onClick={handleDownload}
                className="inline-flex items-center justify-center px-8 py-3 bg-stone-800 text-white font-semibold rounded-lg shadow-md hover:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-700 transition-all duration-300 transform hover:scale-105"
              >
                <DownloadIcon className="w-5 h-5 mr-2" />
                Download
              </button>
            )}
           </div>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
        />

        {!hasGenerated && <EmailSignup />}
      </main>

       <footer className="w-full max-w-6xl mx-auto text-center mt-16 pb-8">
          <p className="text-stone-500 text-sm">
            &copy; {new Date().getFullYear()} Bioface Inc. All rights reserved. 
            <span className="mx-2">|</span>
            <a href="mailto:support@bioface.ai" className="hover:text-stone-800 underline">Contact Support</a>
          </p>
       </footer>
    </div>
  );
};

export default App;