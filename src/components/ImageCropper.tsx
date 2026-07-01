import React, { useState, useRef } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop, Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { X } from 'lucide-react';

interface ImageCropperProps {
  imageFile: File;
  onCropComplete: (croppedFile: File) => void;
  onCancel: () => void;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export function ImageCropper({ imageFile, onCropComplete, onCancel }: ImageCropperProps) {
  const [imgSrc, setImgSrc] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

  React.useEffect(() => {
    setCrop(undefined);
    const reader = new FileReader();
    reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
    reader.readAsDataURL(imageFile);
  }, [imageFile]);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    // We don't force a specific aspect ratio, but we can start with a central crop
    const initialCrop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, 1, width, height),
      width,
      height
    );
    setCrop(initialCrop);
  }

  async function generateCroppedImage() {
    if (!completedCrop || !imgRef.current) return;
    
    const canvas = document.createElement('canvas');
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
    
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(
      imgRef.current,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], imageFile.name, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });
      onCropComplete(file);
    }, 'image/jpeg', 0.9);
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 text-white">
        <h3 className="font-bold">Rasmni qirqish</h3>
        <button onClick={onCancel} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
          <X size={20} />
        </button>
      </div>
      
      {/* Cropper Area */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-2">
        {!!imgSrc && (
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
          >
            <img
              ref={imgRef}
              alt="Crop me"
              src={imgSrc}
              style={{ maxHeight: 'calc(100vh - 160px)', objectFit: 'contain' }}
              onLoad={onImageLoad}
            />
          </ReactCrop>
        )}
      </div>
      
      {/* Footer Actions */}
      <div className="p-4 flex gap-3 flex-shrink-0 border-t border-white/10">
        <Button variant="outline" className="flex-1 bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white" onClick={onCancel}>
          Bekor qilish
        </Button>
        <Button className="flex-1" onClick={generateCroppedImage}>
          Qirqish
        </Button>
      </div>
    </div>
  );
}
