import React, { useState, useRef, useEffect } from 'react';
import { 
  ZoomIn, ZoomOut, RotateCw, Check, X, Crop, 
  Move, Image, Sparkles, RefreshCw
} from 'lucide-react';

export const ImageCropperModal = ({ 
  imageSrc, 
  fileName = 'banner.jpg',
  isOpen, 
  onClose, 
  onCropComplete,
  lang = 'km'
}) => {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [aspectRatio, setAspectRatio] = useState('21:9'); // '21:9' | '16:9' | '3:1' | 'free'
  const [imageObj, setImageObj] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load image
  useEffect(() => {
    if (!imageSrc) return;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      setImageObj(img);
      setZoom(1);
      setRotation(0);
      setPan({ x: 0, y: 0 });
    };
  }, [imageSrc]);

  // Draw on Canvas
  useEffect(() => {
    if (!imageObj || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Canvas target dimensions
    const width = 840;
    let height = 360;
    if (aspectRatio === '21:9') height = 360;
    else if (aspectRatio === '16:9') height = 472;
    else if (aspectRatio === '3:1') height = 280;
    else height = 420;

    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    // Save context state
    ctx.save();

    // Center and translate
    ctx.translate(width / 2 + pan.x, height / 2 + pan.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    // Draw image centered
    const imgW = imageObj.width;
    const imgH = imageObj.height;

    // Calculate initial fill scale
    const scale = Math.max(width / imgW, height / imgH);
    const drawW = imgW * scale;
    const drawH = imgH * scale;

    ctx.drawImage(imageObj, -drawW / 2, -drawH / 2, drawW, drawH);

    ctx.restore();

    // Draw crop guide grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);
  }, [imageObj, zoom, rotation, pan, aspectRatio]);

  // Mouse & Touch Dragging
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile admin
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y
      });
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  };

  // Handle Save & Upload to "image promotion" folder
  const handleSaveAndUpload = async () => {
    if (!canvasRef.current) return;
    setIsProcessing(true);

    try {
      const croppedBase64 = canvasRef.current.toDataURL('image/jpeg', 0.9);

      // Try uploading to backend /api/upload-banner
      try {
        const response = await fetch('/api/upload-banner', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: croppedBase64,
            fileName: fileName.replace(/\.[^/.]+$/, '')
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.url) {
            onCropComplete(data.url);
            onClose();
            setIsProcessing(false);
            return;
          }
        }
      } catch (uploadErr) {
        console.warn('Backend upload skipped, saving base64 directly:', uploadErr);
      }

      // Fallback: use cropped base64 directly
      onCropComplete(croppedBase64);
      onClose();
    } catch (err) {
      console.error('Cropping error:', err);
      alert(lang === 'km' ? 'មានបញ្ហាក្នុងការកាត់រូបភាព' : 'Failed to crop image');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black">
                {lang === 'km' ? '✂️ មើល & កាត់រូបភាពផ្ទាំងផ្សព្វផ្សាយ (View & Crop Banner)' : '✂️ View & Crop Banner Image'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {lang === 'km' 
                  ? 'អូសដើម្បីផ្លាស់ប្តូរទីតាំង និងពង្រីក/បង្រួមតាមការចង់បាន' 
                  : 'Drag to reposition, zoom in/out & adjust aspect ratio'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Canvas Viewport */}
        <div 
          className="relative flex-1 bg-slate-950 flex items-center justify-center p-3 sm:p-6 overflow-hidden cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
        >
          <div className="relative border-2 border-dashed border-emerald-500/60 rounded-2xl overflow-hidden shadow-2xl max-w-full">
            <canvas 
              ref={canvasRef} 
              className="max-w-full h-auto object-contain max-h-[48vh] block bg-black"
            />
            {/* Overlay hint */}
            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-full flex items-center space-x-1 pointer-events-none">
              <Move className="w-3 h-3 text-emerald-400" />
              <span>{lang === 'km' ? 'ចុចអូសដើម្បីរំកិល' : 'Click & Drag'}</span>
            </div>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="p-4 sm:p-5 bg-slate-900 border-t border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Aspect Ratio Buttons */}
            <div className="flex items-center space-x-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setAspectRatio('21:9')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  aspectRatio === '21:9' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                21:9 (Wide)
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio('16:9')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  aspectRatio === '16:9' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                16:9 (Standard)
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio('3:1')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  aspectRatio === '3:1' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                3:1 (Slim)
              </button>
            </div>

            {/* Rotate Button */}
            <button
              type="button"
              onClick={() => setRotation(prev => (prev + 90) % 360)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center space-x-1.5 border border-slate-700 transition"
            >
              <RotateCw className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'km' ? 'បង្វិល 90°' : 'Rotate'}</span>
            </button>

            {/* Reset */}
            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setRotation(0);
                setPan({ x: 0, y: 0 });
              }}
              className="px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-white font-medium flex items-center space-x-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          {/* Zoom Slider */}
          <div className="flex items-center space-x-3 text-white text-xs">
            <ZoomOut className="w-4 h-4 text-slate-400" />
            <input
              type="range"
              min="0.6"
              max="2.5"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer h-2"
            />
            <ZoomIn className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-slate-400 text-xs w-10 text-right">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <span className="text-[11px] text-emerald-400/90 font-medium">
              📁 {lang === 'km' ? 'រូបភាពនឹងត្រូវរក្សាទុកក្នុង Folder "image promotion"' : 'Will be saved to "image promotion" folder'}
            </span>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
              >
                {lang === 'km' ? 'បោះបង់' : 'Cancel'}
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={handleSaveAndUpload}
                className="bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white px-5 py-2 rounded-xl font-black text-xs flex items-center space-x-1.5 transition shadow-lg shadow-emerald-700/30"
              >
                <Check className="w-4 h-4" />
                <span>
                  {isProcessing 
                    ? (lang === 'km' ? 'កំពុងដំណើរការ...' : 'Saving...') 
                    : (lang === 'km' ? 'កាត់ & រក្សាទុក (Crop & Save)' : 'Crop & Save Banner')}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
