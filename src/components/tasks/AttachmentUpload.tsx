'use client';

import { useState, useRef } from 'react';
import { useTasksStore } from '@/store/tasks';
import { toast } from 'sonner';

interface AttachmentUploadProps {
  taskId: string;
  onUploaded: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function AttachmentUpload({ taskId, onUploaded }: AttachmentUploadProps) {
  const { uploadAttachment } = useTasksStore();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error('Plik jest za duży. Maksymalny rozmiar to 10MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      await uploadAttachment(taskId, selectedFile);
      toast.success('Plik został przesłany');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onUploaded();
    } catch (error) {
      console.error('Failed to upload attachment:', error);
      toast.error('Nie udało się przesłać pliku');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <h4 className="text-sm font-medium text-gray-700 mb-2">Dodaj załącznik</h4>

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        id="file-upload"
        disabled={uploading}
      />

      {!selectedFile ? (
        <label
          htmlFor="file-upload"
          className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span className="text-sm text-gray-600">
            Kliknij, aby wybrać plik (max 10MB)
          </span>
        </label>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-md">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium"
            >
              {uploading ? 'Przesyłanie...' : 'Prześlij'}
            </button>
            <button
              onClick={handleCancel}
              disabled={uploading}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 text-sm font-medium"
            >
              Anuluj
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
