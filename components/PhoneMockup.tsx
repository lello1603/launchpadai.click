
import React, { useEffect, useState, useMemo } from 'react';

interface Props {
  code: string;
  isSubscribed?: boolean;
}

const PhoneMockup: React.FC<Props> = ({ code, isSubscribed = false }) => {
  const [iframeSrc, setIframeSrc] = useState('');

  const template = useMemo(() => {
    const safeCode = JSON.stringify(code || "").replace(/<\/script>/g, '<\\/script>');
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
          <script src="https://cdn.tailwindcss.com"></script>
          <script src="https://unpkg.com/react@18.2.0/umd/react.development.js"></script>
          <script src="https://unpkg.com/react-dom@18.2.0/umd/react-dom.development.js"></script>
          <script src="https://unpkg.com/@babel/standalone@7.24.7/babel.min.js"></script>
          <script src="https://unpkg.com/framer-motion@11.0.0/dist/framer-motion.js"></script>
          <script src="https://unpkg.com/lucide-react@0.344.0/dist/umd/lucide-react.js"></script>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
          <style>
            * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
            body { 
              margin: 0; 
              padding: 0;
              background: #F6F9FC; 
              font-family: 'Inter', sans-serif; 
              overflow-x: hidden;
              -webkit-font-smoothing: antialiased;
            }
            #root { width: 100%; min-height: 100vh; }
            .error-box {
              padding: 40px;
              font-family: monospace;
              color: #ef4444;
              background: #fef2f2;
              border: 1px solid #fee2e2;
              border-radius: 20px;
              margin: 20px;
              font-size: 11px;
              line-height: 1.5;
            }
          </style>
        </head>
        <body>
          <div id="root"></div>
          <script>
            // Setup Environment
            window.React = React;
            window.useState = React.useState;
            window.useEffect = React.useEffect;
            window.useMemo = React.useMemo;
            window.useRef = React.useRef;
            
            // Map Framer Motion correctly
            if (window.Motion) { 
              window.motion = window.Motion.motion; 
              window.AnimatePresence = window.Motion.AnimatePresence; 
            }

            // Map Lucide icons correctly through a Proxy
            const iconProxy = new Proxy(window, { 
              get: (t, n) => {
                if (window[n]) return window[n];
                if (window.LucideReact && window.LucideReact[n]) return window.LucideReact[n];
                return null;
              }
            });

            try {
              const rawCode = ${safeCode};
              if (!rawCode || rawCode.trim().length < 5) {
                 throw new Error("The synthesis engine returned an empty codebase.");
              }

              // Transform with TSX/Typescript support
              const transformed = Babel.transform(rawCode, { 
                presets: ['react', ['typescript', { isTSX: true, allExtensions: true }]] 
              }).code;
              
              // Create the execution function
              // We inject motion and AnimatePresence directly into the with context
              const executionCode = \`
                with(iconProxy) { 
                  const { motion, AnimatePresence } = window.Motion || {};
                  \${transformed}
                  return (typeof AppDemo !== 'undefined') ? AppDemo : null; 
                }
              \`;

              const execute = new Function('React', 'iconProxy', executionCode);
              const Component = execute(React, iconProxy);
              
              if (!Component) {
                throw new Error("Component 'AppDemo' could not be identified in the build.");
              }

              const root = ReactDOM.createRoot(document.getElementById('root'));
              root.render(React.createElement(Component));
            } catch (err) {
              console.error("Synthesis Runtime Error:", err);
              document.getElementById('root').innerHTML = \`
                <div class="error-box">
                  <h3 style="font-weight:900; text-transform:uppercase; margin-bottom:12px; color:#1a1a1a; letter-spacing:0.1em;">Synthesis Error</h3>
                  <p>\${err.message}</p>
                  <div style="margin-top:20px; font-size:9px; color:#94a3b8; line-height:1.4;">
                    Check the console for full stack trace. Try clicking 'Repair Build' to re-align the logic gates.
                  </div>
                </div>
              \`;
              window.parent.postMessage({ type: 'LAUNCHPAD_DEMO_ERROR', message: err.message }, '*');
            }
          </script>
        </body>
      </html>
    `;
  }, [code]);

  useEffect(() => {
    const blob = new Blob([template], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setIframeSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [template]);

  return (
    <div className="relative mx-auto h-[667px] w-[375px]">
      <div className="h-full w-full bg-white rounded-[3.5rem] overflow-hidden relative shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] border-[10px] border-[#121212]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-[#121212] rounded-b-[1.2rem] z-50 flex items-center justify-center">
           <div className="w-10 h-1 bg-[#222] rounded-full"></div>
        </div>
        <iframe key={code.length} src={iframeSrc} className="w-full h-full border-none" sandbox="allow-scripts allow-same-origin" />
      </div>
    </div>
  );
};

export default PhoneMockup;
