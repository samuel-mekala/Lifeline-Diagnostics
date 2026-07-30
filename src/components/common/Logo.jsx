import React, { useState } from 'react';

export const Logo = ({
  className = 'w-14 h-14 sm:w-16 sm:h-16',
  showText = true,
  textVariant = 'dark',
  titleClassName = 'text-lg sm:text-2xl font-black tracking-tight leading-none whitespace-nowrap',
  subtitleClassName = 'text-[11px] sm:text-xs font-extrabold uppercase tracking-wider mt-0.5 whitespace-nowrap',
}) => {
  const [imgSrc, setImgSrc] = useState('/logo.png');
  const [useSvg, setUseSvg] = useState(false);

  const handleImageError = () => {
    if (imgSrc === '/logo.png') {
      setImgSrc('/logo.jpg');
    } else {
      setUseSvg(true);
    }
  };

  return (
    <div className="flex items-center gap-2 sm:gap-2.5 select-none shrink-0">
      {/* Official Emblem Logo Image */}
      <div className={`relative shrink-0 ${className}`}>
        {!useSvg ? (
          <img
            src={imgSrc}
            alt="Life Line Diagnostics Logo"
            onError={handleImageError}
            className="w-full h-full object-contain drop-shadow-md rounded-full"
          />
        ) : (
          <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="92" fill="#1E56A0" stroke="#10316B" strokeWidth="4" />
            <circle cx="100" cy="100" r="74" fill="#FFFFFF" />
            <path d="M 30,100 A 70,70 0 1,1 170,100" fill="none" id="textPathTop" />
            <path d="M 170,100 A 70,70 0 0,1 30,100" fill="none" id="textPathBottom" />

            <text fill="#FFFFFF" fontSize="13" fontWeight="900" letterSpacing="1.2">
              <textPath href="#textPathTop" startOffset="50%" textAnchor="middle">
                LIFE LINE DIAGNOSTICS
              </textPath>
            </text>

            <text fill="#FFFFFF" fontSize="12" fontWeight="800" letterSpacing="1.5">
              <textPath href="#textPathBottom" startOffset="50%" textAnchor="middle">
                PATHLABS INDIA
              </textPath>
            </text>

            <circle cx="36" cy="115" r="3" fill="#DC2626" />
            <circle cx="164" cy="115" r="3" fill="#DC2626" />

            <ellipse cx="100" cy="52" rx="7" ry="14" fill="#2E7D32" />
            <ellipse cx="88" cy="56" rx="6" ry="12" fill="#4CAF50" transform="rotate(-25 88 56)" />
            <ellipse cx="112" cy="56" rx="6" ry="12" fill="#4CAF50" transform="rotate(25 112 56)" />
          </svg>
        )}
      </div>

      {showText && (
        <div className="flex flex-col justify-center min-w-0">
          <h1 className={`whitespace-nowrap ${titleClassName} ${textVariant === 'light' ? 'text-white' : 'text-slate-900'}`}>
            Life Line Diagnostics
          </h1>
          <p className={`whitespace-nowrap ${subtitleClassName} ${textVariant === 'light' ? 'text-emerald-400' : 'text-emerald-600'}`}>
            PATH LABS INDIA · ISO 9001:2008
          </p>
        </div>
      )}
    </div>
  );
};

export default Logo;
