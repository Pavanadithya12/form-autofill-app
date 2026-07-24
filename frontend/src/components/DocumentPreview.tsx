'use client';

import React, { useState } from 'react';
import { Paper, Box, Typography, IconButton, Tooltip } from '@mui/material';
import { FileText, Eye, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface DocumentPreviewProps {
  file: File | null;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({ file }) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!file) {
    return (
      <Paper sx={{ p: 4, height: '100%', minHeight: 450, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}>
        <Typography variant="body2" color="text.secondary">
          No document selected
        </Typography>
      </Paper>
    );
  }

  const isImage = file.type.startsWith('image/');
  const fileUrl = URL.createObjectURL(file);

  return (
    <Paper sx={{ p: 2, height: '100%', minHeight: 500, display: 'flex', flexDirection: 'column', borderRadius: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1.5, borderBottom: '1px solid', borderColor: 'divider', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FileText size={18} color="#0284c7" />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {file.name}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Zoom In">
            <IconButton size="small" onClick={() => setZoom((z) => Math.min(z + 0.2, 2))}>
              <ZoomIn size={16} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom Out">
            <IconButton size="small" onClick={() => setZoom((z) => Math.max(z - 0.2, 0.6))}>
              <ZoomOut size={16} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Rotate">
            <IconButton size="small" onClick={() => setRotation((r) => (r + 90) % 360)}>
              <RotateCw size={16} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'action.hover',
          borderRadius: 2,
          p: 2,
        }}
      >
        {isImage ? (
          <img
            src={fileUrl}
            alt="Uploaded Preview"
            style={{
              maxWidth: '100%',
              maxHeight: 500,
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s ease',
              borderRadius: 8,
            }}
          />
        ) : (
          <iframe
            src={fileUrl}
            title="PDF Document Preview"
            width="100%"
            height="500px"
            style={{ border: 'none', borderRadius: 8 }}
          />
        )}
      </Box>
    </Paper>
  );
};
