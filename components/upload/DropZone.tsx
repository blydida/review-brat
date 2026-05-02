'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, ImagePlus, X } from 'lucide-react';

interface DropZoneProps {
  sessionId: string;
  mode: 'ideation' | 'flow-review';
  onUploaded: () => void;
}

interface PreviewFile {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  order: number;
}

export function DropZone({ sessionId, mode, onUploaded }: DropZoneProps) {
  const [previews, setPreviews] = useState<PreviewFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const orderRef = useRef(0);

  const uploadFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    setIsUploading(true);

    const formData = new FormData();
    formData.append('sessionId', sessionId);
    files.forEach((f) => formData.append('files', f));

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const newPreviews: PreviewFile[] = (data.uploads as Array<{ id: string; url: string; filename: string; mimeType: string }>).map((u) => ({
        id: u.id,
        name: u.filename,
        url: u.url,
        mimeType: u.mimeType,
        order: orderRef.current++,
      }));
      setPreviews((prev) => [...prev, ...newPreviews]);
      onUploaded();
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  }, [sessionId, onUploaded]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    uploadFiles(files);
  }, [uploadFiles]);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    uploadFiles(files);
    e.target.value = '';
  };

  const removePreview = (id: string) => {
    setPreviews((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-3">
      {/* Drop area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed
          cursor-pointer transition-colors duration-150 min-h-[140px]
          ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-border/80 hover:bg-muted/30'}
          ${isUploading ? 'opacity-60 pointer-events-none' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.txt"
          className="hidden"
          onChange={onInputChange}
        />
        <div className="p-3 rounded-full bg-muted">
          {isUploading ? (
            <Upload className="w-5 h-5 text-muted-foreground animate-bounce" />
          ) : (
            <ImagePlus className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">
            {isUploading ? 'Uploading...' : 'Drop files here or click to browse'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {mode === 'ideation'
              ? 'Images, PDF, or text files — up to 10 files, 10MB each'
              : 'Screenshots in order — left to right = step 1 to last step'}
          </p>
        </div>
      </div>

      {/* Previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {previews.map((p, idx) => (
            <div key={p.id} className="relative group rounded-lg overflow-hidden border border-border bg-muted aspect-video">
              {p.mimeType.startsWith('image/') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground p-2 text-center">
                  {p.name}
                </div>
              )}
              {mode === 'flow-review' && (
                <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-background/90 border border-border flex items-center justify-center text-[10px] font-bold">
                  {idx + 1}
                </div>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); removePreview(p.id); }}
                className="absolute top-1 right-1 p-0.5 rounded-full bg-background/90 border border-border opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
