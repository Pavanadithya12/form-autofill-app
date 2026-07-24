'use client';

import React, { useRef, useState } from 'react';
import { Box, Typography, Button, Paper, Alert } from '@mui/material';
import { UploadCloud, File, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelected, disabled = false }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSelect = (file: File) => {
    setError(null);
    if (file.size > 20 * 1024 * 1024) {
      setError('File size exceeds 20 MB limit.');
      return;
    }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'docx', 'doc', 'png', 'jpg', 'jpeg', 'webp'].includes(ext || '')) {
      setError('Unsupported file type. Please upload a PDF, DOCX, or Image file.');
      return;
    }
    onFileSelected(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} icon={<AlertCircle size={18} />}>
          {error}
        </Alert>
      )}

      <motion.div whileHover={{ scale: disabled ? 1 : 1.01 }} whileTap={{ scale: disabled ? 1 : 0.99 }}>
        <Paper
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          sx={{
            p: 5,
            textAlign: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            borderStyle: 'dashed',
            borderWidth: 2,
            borderColor: isDragOver ? 'primary.main' : 'divider',
            backgroundColor: isDragOver ? 'action.hover' : 'background.paper',
            borderRadius: 4,
            transition: 'all 0.2s ease-in-out',
            opacity: disabled ? 0.6 : 1,
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            hidden
            accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.webp"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                validateAndSelect(e.target.files[0]);
              }
            }}
          />

          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: 'primary.light',
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
              opacity: 0.8,
            }}
          >
            <UploadCloud size={32} />
          </Box>

          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
            Drag &amp; Drop Document Here
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Support PDF, DOCX, PNG, JPG, JPEG (Max size: 20MB)
          </Typography>

          <Button variant="contained" disabled={disabled} sx={{ pointerEvents: 'none' }}>
            Browse Computer
          </Button>
        </Paper>
      </motion.div>
    </Box>
  );
};
