import React from 'react';

export default function Logo({ className = "w-10 h-10", showText = true }) {
  return (
    <div className={`flex items-center gap-2 group ${className}`}>
      <div className="relative w-full h-full">
        <img 
          src="https://files.oaiusercontent.com/file-S8Z7t9v7v7v7v7v7v7v7v7v7" 
          alt="JAIKO Logo" 
          className="w-full h-full object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300"
          referrerPolicy="no-referrer"
          onError={(e) => {
            // Fallback if the URL expires or is invalid
            e.target.src = "https://picsum.photos/seed/jaiko/200/200";
          }}
        />
      </div>
      {showText && (
        <span className="text-2xl font-display font-extrabold tracking-tighter text-slate-900">
          JAIK<span className="text-blue-600">O!</span>
        </span>
      )}
    </div>
  );
}
