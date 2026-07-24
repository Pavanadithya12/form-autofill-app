'use client';

import React, { useState } from 'react';
import { Paper, Box, Button, Stack, Typography, CircularProgress } from '@mui/material';
import { Download, FileText, Check, RotateCcw } from 'lucide-react';
import { exportDataJSON, exportDataPDF } from '../lib/api';

interface ExportActionBarProps {
  data: any;
  onReset: () => void;
}

export const ExportActionBar: React.FC<ExportActionBarProps> = ({ data, onReset }) => {
  const [downloadingJson, setDownloadingJson] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleExportJSON = async () => {
    try {
      setDownloadingJson(true);
      await exportDataJSON(data);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloadingJson(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setDownloadingPdf(true);
      await exportDataPDF(data);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <Paper sx={{ p: 2.5, borderRadius: 4, mt: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Form Auto-Fill Completed
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Download your parsed structured data as JSON or PDF
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RotateCcw size={16} />}
            onClick={onReset}
          >
            Upload Another
          </Button>

          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={downloadingJson ? <CircularProgress size={14} color="inherit" /> : <Download size={16} />}
            onClick={handleExportJSON}
            disabled={downloadingJson}
          >
            Export JSON
          </Button>

          <Button
            variant="contained"
            color="secondary"
            size="small"
            startIcon={downloadingPdf ? <CircularProgress size={14} color="inherit" /> : <FileText size={16} />}
            onClick={handleExportPDF}
            disabled={downloadingPdf}
            sx={{ color: '#000', fontWeight: 700 }}
          >
            Export PDF Report
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
};
