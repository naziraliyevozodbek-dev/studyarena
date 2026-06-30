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
    <div className="fixed inset-0 z-[100] bg-black/80 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white dark:bg-bg-card p-4 flex flex-col max-h-screen overflow-hidden relative">
        <button onClick={onCancel} className="absolute top-2 right-2 p-2 bg-black/10 rounded-full z-10">
          <X size={20} />
        </button>
        <h3 className="font-bold text-center mb-4">Rasmni qirqish</h3>
        
        <div className="flex-1 overflow-auto flex items-center justify-center min-h-[300px] bg-black/5 rounded-xl">
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
                style={{ maxHeight: '60vh', objectFit: 'contain' }}
                onLoad={onImageLoad}
              />
            </ReactCrop>
          )}
        </div>
        
        <div className="flex gap-3 mt-4 flex-shrink-0">
          <Button variant="outline" className="flex-1" onClick={() => onCropComplete(imageFile)}>
            Qirqmasdan yuklash
          </Button>
          <Button className="flex-1" onClick={generateCroppedImage}>
            Qirqishni tasdiqlash
          </Button>
        </div>
      </Card>
    </div>
  );
}
