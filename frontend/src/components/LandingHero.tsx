'use client';

import React from 'react';
import { Box, Typography, Chip, Stack } from '@mui/material';
import { Star, ShieldCheck, Cpu, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

export const LandingHero: React.FC = () => {
  return (
    <Box sx={{ textAlign: 'center', py: { xs: 4, md: 6 } }}>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Chip
          icon={<Star size={14} color="#0284c7" />}
          label="Next.js 15 + EasyOCR + spaCy + FastAPI Full-Stack Engine"
          variant="outlined"
          color="primary"
          size="small"
          sx={{ mb: 2, fontWeight: 700, px: 1 }}
        />
        <Typography
          variant="h2"
          sx={{
            fontSize: { xs: '2rem', sm: '2.75rem', md: '3.5rem' },
            fontWeight: 800,
            letterSpacing: '-0.03em',
            mb: 2,
          }}
        >
          Intelligent Document Parsing &amp; Auto-Filler
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ maxWidth: 680, mx: 'auto', fontSize: '1.05rem', lineHeight: 1.7, mb: 3 }}
        >
          Upload your PDF, Word document, or Image file. Our AI OCR engine extracts details, calculates field confidence scores, and auto-populates the application form instantly.
        </Typography>

        <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap" gap={1}>
          <Chip icon={<Cpu size={14} />} label="EasyOCR & pdfplumber" size="small" variant="filled" />
          <Chip icon={<ShieldCheck size={14} />} label="100% Secure & Privacy First" size="small" variant="filled" />
          <Chip icon={<FileText size={14} />} label="PDF, DOCX, PNG, JPG" size="small" variant="filled" />
        </Stack>
      </motion.div>
    </Box>
  );
};
