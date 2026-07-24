'use client';

import React, { useState, useEffect } from 'react';
import { Container, Box, Grid, Alert, Snackbar, Typography, LinearProgress } from '@mui/material';
import { Header } from '../components/Header';
import { LandingHero } from '../components/LandingHero';
import { UploadZone } from '../components/UploadZone';
import { ProcessingTimeline, ProcessingStep } from '../components/ProcessingTimeline';
import { DocumentPreview } from '../components/DocumentPreview';
import { AutoFillForm } from '../components/AutoFillForm';
import { AISummaryCard } from '../components/AISummaryCard';
import { ExportActionBar } from '../components/ExportActionBar';
import { HistoryDrawer } from '../components/HistoryDrawer';
import { uploadDocument, pingBackend } from '../lib/api';
import { ExtractedData, ExtractionResponse } from '../types/extraction';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>('idle');
  const [progress, setProgress] = useState(0);
  const [extractionResult, setExtractionResult] = useState<ExtractionResponse | null>(null);
  const [formData, setFormData] = useState<ExtractedData | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [waitingMsg, setWaitingMsg] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Ping backend on page load to wake it up before user uploads
  useEffect(() => {
    pingBackend().catch(() => {});
  }, []);

  const handleFileSelected = async (file: File) => {
    setSelectedFile(file);
    setExtractionResult(null);
    setFormData(null);
    setWaitingMsg(null);
    setElapsedSeconds(0);

    setProcessingStep('uploading');
    setProgress(15);

    // Animate progress naturally up to 88%
    const steps = [
      { step: 'ocr' as ProcessingStep, progress: 40, delay: 600 },
      { step: 'nlp' as ProcessingStep, progress: 65, delay: 1500 },
      { step: 'mapping' as ProcessingStep, progress: 88, delay: 2500 },
    ];
    steps.forEach(({ step, progress, delay }) => {
      setTimeout(() => {
        setProcessingStep(step);
        setProgress(progress);
      }, delay);
    });

    // Show "waking up" message if it takes > 8 seconds
    const wakeTimer = setTimeout(() => {
      setWaitingMsg('⏳ Backend is waking up on Render (free tier cold start). Please wait 30–60s...');
    }, 8000);

    // Tick elapsed time
    const startTime = Date.now();
    const ticker = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    try {
      const result = await uploadDocument(file);

      clearTimeout(wakeTimer);
      clearInterval(ticker);
      setWaitingMsg(null);
      setElapsedSeconds(0);
      setProgress(100);
      setProcessingStep('completed');
      setExtractionResult(result);
      setFormData(result.extracted_data);
      setToastMessage('✅ Document parsed successfully!');
    } catch (err: any) {
      clearTimeout(wakeTimer);
      clearInterval(ticker);
      setWaitingMsg(null);
      setElapsedSeconds(0);
      console.error(err);
      setProcessingStep('idle');
      setProgress(0);
      const detail = err.response?.data?.detail || err.message || '';
      if (err.code === 'ECONNABORTED' || detail.includes('timeout') || !detail) {
        setToastMessage('⚠️ Backend timed out. Please try again — it may need another 30s to wake up.');
      } else {
        setToastMessage(`❌ ${detail}`);
      }
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setProcessingStep('idle');
    setProgress(0);
    setExtractionResult(null);
    setFormData(null);
    setWaitingMsg(null);
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
          <Box>
            <ProcessingTimeline
              currentStep={processingStep}
              progress={progress}
              filename={selectedFile?.name || 'Document'}
            />
            {waitingMsg && (
              <Box sx={{ mt: 3, p: 3, borderRadius: 2, background: 'rgba(255,193,7,0.12)', border: '1px solid rgba(255,193,7,0.4)' }}>
                <Typography variant="body1" sx={{ color: '#ffc107', fontWeight: 600, mb: 1 }}>
                  {waitingMsg}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                  Time elapsed: {elapsedSeconds}s — Your file is safe, just waiting for the server to start.
                </Typography>
                <LinearProgress variant="indeterminate" sx={{ borderRadius: 1, height: 6 }} />
              </Box>
            )}
          </Box>
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
        autoHideDuration={6000}
        onClose={() => setToastMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setToastMessage(null)} severity={toastMessage?.includes('❌') || toastMessage?.includes('⚠️') ? 'error' : 'success'}>
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
