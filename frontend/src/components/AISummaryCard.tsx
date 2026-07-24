'use client';

import React from 'react';
import { Paper, Box, Typography, Chip, Stack } from '@mui/material';
import { Star, FileCheck, Layers } from 'lucide-react';

interface AISummaryCardProps {
  summary: string;
  docType: string;
  confidence: number;
}

export const AISummaryCard: React.FC<AISummaryCardProps> = ({ summary, docType, confidence }) => {
  return (
    <Paper
      sx={{
        p: 2.5,
        borderRadius: 4,
        background: (theme) =>
          theme.palette.mode === 'light'
            ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.06) 0%, rgba(16, 185, 129, 0.06) 100%)'
            : 'linear-gradient(135deg, rgba(2, 132, 199, 0.12) 0%, rgba(16, 185, 129, 0.12) 100%)',
        border: '1px solid',
        borderColor: 'primary.main',
        mb: 3,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Star size={18} color="#0284c7" />
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            AI Executive Document Summary
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Chip icon={<Layers size={12} />} label={`Type: ${docType}`} size="small" color="primary" />
          <Chip icon={<FileCheck size={12} />} label={`Overall Accuracy: ${Math.round(confidence * 100)}%`} size="small" color="success" />
        </Stack>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
        {summary}
      </Typography>
    </Paper>
  );
};
