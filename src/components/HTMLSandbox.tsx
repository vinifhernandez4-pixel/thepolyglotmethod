import { useEffect, useRef } from 'react';

interface HTMLSandboxProps {
  htmlContent: string;
  className?: string;
}

export default function HTMLSandbox({ htmlContent, className = '' }: HTMLSandboxProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeRef.current || !htmlContent) return;

    const iframe = iframeRef.current;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    
    if (!doc) return;

    // Create a complete HTML document with the content
    const fullHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    * { -webkit-tap-highlight-color: transparent; }
    body { 
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 0;
      overflow-x: hidden;
    }
    /* Custom scrollbar */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(30, 74, 110, 0.3); border-radius: 3px; }
    
    /* Animation keyframes */
    @keyframes fall {
      from { transform: translateY(-100px); }
      to { transform: translateY(75vh); }
    }
    .rain-item {
      position: absolute;
      animation: fall linear forwards;
      cursor: pointer;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fadeIn 0.3s ease-out;
    }
    
    /* Card flip */
    .card-flip-inner {
      transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      transform-style: preserve-3d;
    }
    .card-flipped .card-flip-inner {
      transform: rotateY(180deg);
    }
    .card-face {
      backface-visibility: hidden;
    }
    .card-back {
      transform: rotateY(180deg);
    }
    
    /* Hide scrollbar but allow scroll */
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  </style>
</head>
<body class="bg-[#1a3673] min-h-screen">
  ${htmlContent}
</body>
</html>`;

    doc.open();
    doc.write(fullHTML);
    doc.close();

    // Adjust iframe height to match content
    const adjustHeight = () => {
      if (iframe.contentWindow?.document?.body) {
        const height = iframe.contentWindow.document.body.scrollHeight;
        iframe.style.height = `${height + 50}px`;
      }
    };

    // Adjust height after load
    iframe.onload = adjustHeight;
    setTimeout(adjustHeight, 100);
    setTimeout(adjustHeight, 500);

    // Listen for resize messages from iframe
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'resize' && e.data?.height) {
        iframe.style.height = `${e.data.height + 50}px`;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [htmlContent]);

  return (
    <iframe
      ref={iframeRef}
      className={`w-full border-0 ${className}`}
      style={{ minHeight: '500px' }}
      sandbox="allow-scripts allow-same-origin"
      title="Session Content"
    />
  );
}
