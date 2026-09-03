import React, { useState, useRef, useEffect } from 'react';
import { 
  ZoomIn, ZoomOut, RotateCw, Check, X, Crop, 
  Move, Image, Sparkles, RefreshCw, QrCode, Maximize2
} from 'lucide-react';

export const QrCodeCropperModal = ({ 
  imageSrc, 
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
  const [aspectRatio, setAspectRatio] = useState('1:1'); // '1:1' | '3:4' | 'free'
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

  // Auto-Center & Fit QR matrix
  const handleAutoCenterQr = () => {
    if (!imageObj) return;
    // Reset pan & calculate scale to focus on the center square matrix
    const w = imageObj.width;
    const h = imageObj.height;
    
    // Most screenshot QR codes have headers at top and footers at bottom
    // If image is taller than wide (e.g. phone screenshot), zoom in slightly to center QR
    if (h > w) {
      setZoom(1.35);
      setPan({ x: 0, y: Math.round((h - w) * 0.1) });
    } else {
      setZoom(1.1);
      setPan({ x: 0, y: 0 });
    }
    setRotation(0);
  };

  // Draw on Canvas
  useEffect(() => {
    if (!imageObj || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Canvas target dimensions (High Definition Square 600x600)
    const canvasWidth = 600;
    let canvasHeight = 600;
    if (aspectRatio === '3:4') canvasHeight = 800;
    else if (aspectRatio === '4:3') canvasHeight = 450;
    else canvasHeight = 600; // '1:1' standard square

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Fill background with clean white for QR scanning contrast
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Save context state
    ctx.save();

    // Center and translate
    ctx.translate(canvasWidth / 2 + pan.x, canvasHeight / 2 + pan.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    // Draw image centered
    const imgW = imageObj.width;
    const imgH = imageObj.height;

    // Calculate initial fill scale
    const scale = Math.max(canvasWidth / imgW, canvasHeight / imgH);
    const drawW = imgW * scale;
    const drawH = imgH * scale;

    ctx.drawImage(imageObj, -drawW / 2, -drawH / 2, drawW, drawH);

    ctx.restore();

    // Draw subtle border around canvas guide
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, canvasWidth, canvasHeight);
  }, [imageObj, zoom, rotation, pan, aspectRatio]);

  // Mouse Dragging
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

  // Handle Crop Completion
  const handleSaveCrop = () => {
    if (!canvasRef.current) return;
    setIsProcessing(true);

    try {
      // High-quality JPEG Base64 output
      const croppedBase64 = canvasRef.current.toDataURL('image/jpeg', 0.95);
      onCropComplete(croppedBase64);
      onClose();
    } catch (err) {
      console.error('QR Cropping error:', err);
      alert(lang === 'km' ? 'មានបញ្ហាក្នុងការកាត់រូបភាព QR Code' : 'Failed to crop QR Code image');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black">
                {lang === 'km' ? '✂️ កាត់តម្រឹមរូបភាព QR Code (Crop & Adjust QR)' : '✂️ Crop & Adjust QR Code Image'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {lang === 'km' 
                  ? 'អូសរូបភាព ពង្រីក/បង្រួម ឬចុច "Auto-Crop QR" ដើមី្បកាត់យកតែ QR កណ្តាលច្បាស់ 100%' 
                  : 'Drag to reposition, zoom in/out or click "Auto-Crop QR" to focus center QR matrix'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Canvas Viewport */}
        <div 
          className="relative flex-1 bg-slate-950 flex items-center justify-center p-4 overflow-hidden cursor-grab active:cursor-grabbing min-h-[300px] sm:min-h-[360px]"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
        >
          <div className="relative border-2 border-emerald-500 rounded-2xl overflow-hidden shadow-2xl max-w-[280px] sm:max-w-[340px] aspect-square flex items-center justify-center">
            <canvas 
              ref={canvasRef} 
              className="w-full h-full object-contain bg-white"
            />

            {/* Corner Crop Indicators */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-3 border-l-3 border-emerald-400 pointer-events-none" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-3 border-r-3 border-emerald-400 pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-3 border-l-3 border-emerald-400 pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-3 border-r-3 border-emerald-400 pointer-events-none" />
          </div>

          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-slate-400 text-[11px] pointer-events-none">
            <span className="bg-black/60 px-2.5 py-1 rounded-lg backdrop-blur-xs flex items-center gap-1">
              <Move className="w-3 h-3 text-emerald-400" />
              <span>{lang === 'km' ? 'អូសដើមី្បផ្លាស់ប្តូរទីតាំង' : 'Drag to re-position'}</span>
            </span>
            <span className="bg-black/60 px-2.5 py-1 rounded-lg backdrop-blur-xs font-mono text-emerald-400 font-bold">
              {Math.round(zoom * 100)}% Zoom
            </span>
          </div>
        </div>

        {/* Toolbar & Controls */}
        <div className="p-4 sm:p-5 bg-slate-900 border-t border-slate-800 space-y-4">
          
          {/* Quick Preset Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            
            {/* Auto-Crop Center QR Button */}
            <button
              type="button"
              onClick={handleAutoCenterQr}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center space-x-1.5 transition shadow-md cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{lang === 'km' ? '🎯 កាត់យកតែ QR កណ្តាល (Auto-Crop QR)' : '🎯 Auto-Crop Center QR'}</span>
            </button>

            {/* Aspect Ratio Presets */}
            <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setAspectRatio('1:1')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  aspectRatio === '1:1' ? 'bg-emerald-600 text-white font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                1:1 (Square)
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio('3:4')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  aspectRatio === '3:4' ? 'bg-emerald-600 text-white font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                3:4 (Card)
              </button>
            </div>
          </div>

          {/* Zoom Slider & Adjustments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center pt-2 border-t border-slate-800">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-bold text-slate-400 whitespace-nowrap">Zoom:</span>
              <button
                type="button"
                onClick={() => setZoom(prev => Math.max(0.5, prev - 0.15))}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition border border-slate-700 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setZoom(prev => Math.min(3, prev + 0.15))}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition border border-slate-700 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setRotation(prev => (prev + 90) % 360)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition border border-slate-700 flex items-center space-x-1 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>{lang === 'km' ? 'បង្វិល 90°' : 'Rotate 90°'}</span>
              </button>

              <button
                type="button"
                onClick={() => { setZoom(1); setRotation(0); setPan({ x: 0, y: 0 }); }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition border border-slate-700 flex items-center space-x-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{lang === 'km' ? 'កំណត់ឡើងវិញ' : 'Reset'}</span>
              </button>
            </div>
          </div>

          {/* Action Footer Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold transition cursor-pointer"
            >
              {lang === 'km' ? 'បោះបង់ (Cancel)' : 'Cancel'}
            </button>

            <button
              type="button"
              onClick={handleSaveCrop}
              disabled={isProcessing}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-2xl text-xs font-black flex items-center space-x-2 transition shadow-lg shadow-emerald-600/30 cursor-pointer"
            >
              {isProcessing ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Check className="w-4 h-4 stroke-[3]" />
              )}
              <span>{lang === 'km' ? '✅ រក្សាទុករូប QR ដែលបាន Crop' : 'Apply & Save Cropped QR'}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
