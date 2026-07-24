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
import { extractDocument, ExtractionResult } from '../lib/extractor';
import { ExtractedData } from '../types/extraction';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>('idle');
  const [progress, setProgress] = useState(0);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [formData, setFormData] = useState<ExtractedData | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error'>('success');

  const handleFileSelected = async (file: File) => {
    setSelectedFile(file);
    setExtractionResult(null);
    setFormData(null);

    setProcessingStep('uploading');
    setProgress(10);

    try {
      // Step 1 — uploading/reading
      await new Promise(r => setTimeout(r, 300));
      setProcessingStep('ocr');
      setProgress(30);

      // Step 2 — run extraction (browser-native, no network)
      const result = await extractDocument(file, (ocrPct) => {
        setProgress(30 + Math.round(ocrPct * 0.4)); // 30–70%
      });

      // Step 3 — NLP
      setProcessingStep('nlp');
      setProgress(80);
      await new Promise(r => setTimeout(r, 400));

      // Step 4 — mapping
      setProcessingStep('mapping');
      setProgress(95);
      await new Promise(r => setTimeout(r, 300));

      // Done
      setProgress(100);
      setProcessingStep('completed');
      setExtractionResult(result);
      setFormData(result.extracted_data as any);
      setToastSeverity('success');
      setToastMessage('✅ Document parsed successfully!');
    } catch (err: any) {
      console.error(err);
      setProcessingStep('idle');
      setProgress(0);
      setToastSeverity('error');
      setToastMessage(`❌ ${err.message || 'Failed to process document. Please try a different file.'}`);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setProcessingStep('idle');
    setProgress(0);
    setExtractionResult(null);
    setFormData(null);
  };

  const handleSelectHistoryItem = (item: any) => {
    setExtractionResult(item);
    setFormData(item.extracted_data);
    setProcessingStep('completed');
    setSelectedFile(null);
    setToastSeverity('success');
    setToastMessage(`Loaded: "${item.filename}"`);
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
        autoHideDuration={5000}
        onClose={() => setToastMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setToastMessage(null)} severity={toastSeverity}>
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
