'use client';

import React, { useState } from 'react';
import { Container, Box, Grid, Alert, Snackbar } from '@mui/material';
import { Header } from '../components/Header';
import { LandingHero } from '../components/LandingHero';
import { UploadZone } from '../components/UploadZone';
import { ProcessingTimeline, ProcessingStep } from '../components/ProcessingTimeline';
import { DocumentPreview } from '../components/DocumentPreview';
import { AutoFillForm } from '../components/AutoFillForm';
import { AISummaryCard } from '../components/AISummaryCard';
import { ExportActionBar } from '../components/ExportActionBar';
import { HistoryDrawer } from '../components/HistoryDrawer';
import { uploadDocument } from '../lib/api';
import { ExtractedData, ExtractionResponse } from '../types/extraction';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>('idle');
  const [progress, setProgress] = useState(0);
  const [extractionResult, setExtractionResult] = useState<ExtractionResponse | null>(null);
  const [formData, setFormData] = useState<ExtractedData | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleFileSelected = async (file: File) => {
    setSelectedFile(file);
    setExtractionResult(null);
    setFormData(null);

    setProcessingStep('uploading');
    setProgress(15);

    try {
      setTimeout(() => { setProcessingStep('ocr'); setProgress(45); }, 500);
      setTimeout(() => { setProcessingStep('nlp'); setProgress(75); }, 1200);
      setTimeout(() => { setProcessingStep('mapping'); setProgress(90); }, 1800);

      const result = await uploadDocument(file);

      setProgress(100);
      setProcessingStep('completed');
      setExtractionResult(result);
      setFormData(result.extracted_data);
      setToastMessage('Document parsed successfully!');
    } catch (err: any) {
      console.error(err);
      setProcessingStep('idle');
      setProgress(0);
      setToastMessage(err.response?.data?.detail || 'Failed to extract text from document. Ensure backend is running.');
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setProcessingStep('idle');
    setProgress(0);
    setExtractionResult(null);
    setFormData(null);
  };

  const handleSelectHistoryItem = (item: ExtractionResponse) => {
    setExtractionResult(item);
    setFormData(item.extracted_data);
    setProcessingStep('completed');
    setSelectedFile(null);
    setToastMessage(`Loaded history item "${item.filename}"`);
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header onOpenHistory={() => setHistoryOpen(true)} />

      <Container maxWidth="xl" sx={{ flex: 1, py: 4 }}>
        {!extractionResult && processingStep === 'idle' && (
          <>
            <LandingHero />
            <UploadZone onFileSelected={handleFileSelected} />
          </>
        )}

        {processingStep !== 'idle' && processingStep !== 'completed' && (
          <ProcessingTimeline
            currentStep={processingStep}
            progress={progress}
            filename={selectedFile?.name || 'Document'}
          />
        )}

        {formData && extractionResult && (
          <Box>
            <AISummaryCard
              summary={extractionResult.summary}
              docType={extractionResult.doc_type}
              confidence={extractionResult.avg_confidence}
            />

            <Grid container spacing={3}>
              <Grid item xs={12} md={5}>
                <DocumentPreview file={selectedFile} />
              </Grid>

              <Grid item xs={12} md={7}>
                <AutoFillForm formData={formData} onChange={(updated) => setFormData(updated)} />
              </Grid>
            </Grid>

            <ExportActionBar data={formData} onReset={handleReset} />
          </Box>
        )}
      </Container>

      <HistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onSelectHistoryItem={handleSelectHistoryItem}
      />

      <Snackbar
        open={!!toastMessage}
        autoHideDuration={4000}
        onClose={() => setToastMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setToastMessage(null)} severity={toastMessage?.includes('Failed') ? 'error' : 'success'}>
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
