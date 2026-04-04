import React, { useRef, useEffect, useState } from 'react';
import { Camera, X, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { API_BASE_URL as API } from '../config';

export default function LiveCameraOverlay({ onClose, onIssueDetected }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('Initializing camera...');
  const [consecutiveNone, setConsecutiveNone] = useState(0);
  const [debug, setDebug] = useState({ 
    lastFrame: 'None', 
    b64Len: 0, 
    rawResp: 'None',
    count: 0
  });
  const lastIssueRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (e) {
        console.error('Camera error', e);
        setStatus('Camera permission denied or not available.');
      }
    };

    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  const handleVideoLoad = () => {
    console.log("Video metadata loaded, starting analysis...");
    setStatus('Scanning for issues...');
    startAnalysis();
  };

  const startAnalysis = () => {
    // Small delay to ensure stream is stable
    setTimeout(() => {
      intervalRef.current = setInterval(async () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        if (video.videoWidth === 0 || video.videoHeight === 0) {
          console.warn("Video dimensions still 0");
          return;
        }

        // Fix: Explicitly set canvas dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const base64Image = canvas.toDataURL('image/jpeg', 0.5);
        
        setDebug(prev => ({ 
          ...prev, 
          lastFrame: `${canvas.width}x${canvas.height}`,
          b64Len: base64Image.length,
          count: prev.count + 1
        }));

        try {
          const res = await fetch(`${API}/analyze-frame`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image_b64: base64Image })
          });
          
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(`API ${res.status}: ${errorData.message || errorData.error || 'Unknown Error'}`);
          }
          
          const data = await res.json();
          
          setDebug(prev => ({ ...prev, rawResp: JSON.stringify(data) }));

          if (data.severity === 'none' || !data.issue) {
              setConsecutiveNone(prev => {
                  const next = prev + 1;
                  if (next >= 3) setStatus('Hold steady... scanning...');
                  return next;
              });
          } else {
              if (lastIssueRef.current === data.issue) return; 
              lastIssueRef.current = data.issue;
              
              setStatus(`Detected: ${data.issue}!`);
              stopCamera();
              setTimeout(() => {
                  onIssueDetected(data.suggested_query || data.issue);
              }, 1000);
          }

        } catch (err) {
          console.error('Frame analysis error', err);
          setDebug(prev => ({ ...prev, rawResp: `ERROR: ${err.message}` }));
        }
        
      }, 2500);
    }, 1000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      style={{
        position: 'absolute', inset: 0, zIndex: 9999,
        backgroundColor: '#000', display: 'flex', flexDirection: 'column'
      }}
    >
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10000 }}>
        <button 
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.2)', border: 'none', 
            borderRadius: '50%', width: 40, height: 40, 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', cursor: 'pointer'
          }}
        >
          <X size={24} />
        </button>
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          onLoadedMetadata={handleVideoLoad}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        
        {/* Debug Panel */}
        <div style={{
            position: 'absolute', top: 20, left: 20, zIndex: 10000,
            background: 'rgba(0,0,0,0.7)', color: '#0f0', padding: '10px',
            borderRadius: '8px', fontSize: '10px', fontFamily: 'monospace',
            maxWidth: '200px', pointerEvents: 'none'
        }}>
            <div>FRAME: {debug.lastFrame}</div>
            <div>B64: {debug.b64Len}</div>
            <div>COUNT: {debug.count}</div>
            <div style={{ wordBreak: 'break-all', marginTop: '5px' }}>
                RESP: {debug.rawResp}
            </div>
        </div>

        <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: '80%', height: '60%', border: '2px solid rgba(59, 130, 246, 0.5)',
            borderRadius: '20px', boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
            pointerEvents: 'none', overflow: 'hidden'
        }}>
           <div style={{
              width: '100%', height: '2px', background: '#3b82f6',
              boxShadow: '0 0 15px #3b82f6', animation: 'scan 2.5s infinite linear'
           }} />
        </div>

        <div style={{
            position: 'absolute', bottom: 40, left: 0, right: 0,
            display: 'flex', justifyContent: 'center'
        }}>
            <div style={{
                background: 'rgba(15, 23, 42, 0.8)', padding: '10px 20px',
                borderRadius: '30px', color: 'white', backdropFilter: 'blur(10px)',
                display: 'flex', alignItems: 'center', gap: '10px'
            }}>
                <AlertCircle size={18} color="#3b82f6" />
                <span style={{ fontWeight: 'bold' }}>{status}</span>
            </div>
        </div>
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          50% { transform: translateY(400px); }
          100% { transform: translateY(0); }
        }
      `}</style>
    </motion.div>
  );
}
