'use client';

import { X } from 'lucide-react';
import Image from 'next/image';
import { Button } from './button';

interface FileUploadPreviewProps {
  file: File | null;
  previewUrl: string | null;
  onSelect: (file: File | null) => void;
}

export function FileUploadPreview({ file, previewUrl, onSelect }: FileUploadPreviewProps) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
      {!file ? (
        <label className="flex cursor-pointer items-center justify-center rounded-xl bg-white p-4 text-sm text-slate-600 shadow-sm">
          Pilih Bukti Transfer
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const selected = event.target.files?.[0] ?? null;
              onSelect(selected);
            }}
          />
        </label>
      ) : (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Preview bukti transfer"
                width={640}
                height={400}
                className="h-auto w-full object-cover"
              />
            ) : null}
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-xs text-slate-500">{file.name}</p>
            <Button size="icon" variant="ghost" onClick={() => onSelect(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}