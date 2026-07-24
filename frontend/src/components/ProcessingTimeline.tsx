'use client';

import React from 'react';
import { Box, Typography, Paper, LinearProgress, Stack } from '@mui/material';
import { CheckCircle2, Loader2, FileUp, Cpu, Brain, CheckSquare } from 'lucide-react';
import { motion } from 'framer-motion';

export type ProcessingStep = 'idle' | 'uploading' | 'ocr' | 'nlp' | 'mapping' | 'completed';

interface ProcessingTimelineProps {
  currentStep: ProcessingStep;
  progress: number;
  filename: string;
}

const stepsList = [
  { key: 'uploading', label: '1. File Uploading & Reading', icon: FileUp },
  { key: 'ocr', label: '2. EasyOCR & Document Parser', icon: Cpu },
  { key: 'nlp', label: '3. spaCy NLP Entity Recognition', icon: Brain },
  { key: 'mapping', label: '4. Material UI Field Mapping', icon: CheckSquare },
];

export const ProcessingTimeline: React.FC<ProcessingTimelineProps> = ({
  currentStep,
  progress,
  filename,
}) => {
  if (currentStep === 'idle') return null;

  return (
    <Paper sx={{ p: 4, maxWidth: 640, mx: 'auto', mb: 4, borderRadius: 4 }}>
      <Box sx={{ textAlignment: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
          Processing "{filename}"
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Live AI Processing Pipeline
        </Typography>
      </Box>

      <Box sx={{ width: '100%', mb: 3 }}>
        <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 5 }} />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlignment: 'right', mt: 0.5, fontWeight: 700 }}>
          {progress}%
        </Typography>
      </Box>

      <Stack spacing={2}>
        {stepsList.map((st, idx) => {
          const Icon = st.icon;
          const isDone = progress >= (idx + 1) * 25;
          const isCurrent = currentStep === st.key;

          return (
            <motion.div
              key={st.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: isCurrent ? 'action.selected' : 'transparent',
                  border: isCurrent ? '1px solid' : '1px solid transparent',
                  borderColor: isCurrent ? 'primary.main' : 'transparent',
                }}
              >
                {isDone ? (
                  <CheckCircle2 size={20} color="#10b981" />
                ) : isCurrent ? (
                  <Box sx={{ animation: 'spin 2s linear infinite', display: 'flex' }}>
                    <Loader2 size={20} color="#0284c7" />
                  </Box>
                ) : (
                  <Icon size={20} color="#94a3b8" />
                )}

                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: isCurrent || isDone ? 700 : 500,
                    color: isDone ? 'secondary.main' : isCurrent ? 'primary.main' : 'text.secondary',
                  }}
                >
                  {st.label}
                </Typography>
              </Box>
            </motion.div>
          );
        })}
      </Stack>
    </Paper>
  );
};
