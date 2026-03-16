'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { toast } from '@/lib/utils/toast';
import type { Translations } from '@/lib/i18n/es';

const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

interface StepUploadProps {
  t: Translations;
  isUploading: boolean;
  onUpload: (file: File) => void;
  onCancel: () => void;
}

export function StepUpload({ t, isUploading, onUpload, onCancel }: StepUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (f: File): boolean => {
      if (!f.name.toLowerCase().endsWith('.pdf') && f.type !== 'application/pdf') {
        toast.error(t.convenios.upload.invalidFile);
        return false;
      }
      if (f.size > MAX_SIZE_BYTES) {
        toast.error(t.convenios.upload.fileTooLarge);
        return false;
      }
      return true;
    },
    [t.convenios.upload.invalidFile, t.convenios.upload.fileTooLarge],
  );

  const handleFileSelect = useCallback(
    (selected: File | null) => {
      if (!selected) return;
      if (!validateFile(selected)) return;
      setFile(selected);
    },
    [validateFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = e.dataTransfer.files[0] ?? null;
      handleFileSelect(dropped);
    },
    [handleFileSelect],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFileSelect(e.target.files?.[0] ?? null);
      e.target.value = '';
    },
    [handleFileSelect],
  );

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-12 transition-colors duration-150',
          isUploading
            ? 'cursor-wait border-white/[0.08] bg-white/[0.02]'
            : 'cursor-pointer',
          !isUploading && isDragging
            ? 'border-[#2563EB] bg-[#2563EB]/[0.06]'
            : !isUploading
              ? 'border-white/[0.12] bg-white/[0.02] hover:border-white/[0.2] hover:bg-white/[0.04]'
              : '',
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleInputChange}
          className="hidden"
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin" />
            <p className="text-sm font-medium text-slate-300">
              {t.convenios.upload.uploading}
            </p>
          </div>
        ) : file ? (
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-red-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-white">{file.name}</p>
              <p className="text-xs text-slate-400">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
              className="ml-2 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 text-slate-500" />
            <p className="text-sm text-slate-300">
              {t.convenios.upload.dropzoneText}
            </p>
            <p className="text-xs text-slate-500">
              {t.convenios.upload.dropzoneHint}
            </p>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          onClick={() => file && onUpload(file)}
          disabled={!file || isUploading}
          className="gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
        >
          <Upload className="w-4 h-4" />
          {isUploading ? t.convenios.upload.uploading : t.convenios.upload.stepUpload}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={isUploading}>
          {t.convenios.upload.cancelUpload}
        </Button>
      </div>
    </div>
  );
}
