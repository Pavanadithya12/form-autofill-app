'use client';

import React from 'react';
import {
  Paper,
  Box,
  Typography,
  TextField,
  Grid,
  Chip,
  Tooltip,
  Divider,
  Button,
} from '@mui/material';
import { User, Mail, Phone, MapPin, Calendar, CheckCircle, AlertTriangle, HelpCircle } from 'lucide-react';
import { ExtractedData } from '../types/extraction';

interface AutoFillFormProps {
  formData: ExtractedData;
  onChange: (updated: ExtractedData) => void;
}

export const AutoFillForm: React.FC<AutoFillFormProps> = ({ formData, onChange }) => {
  const getConfidenceChip = (confidence: number, isMissing: boolean) => {
    if (isMissing || confidence <= 0) {
      return (
        <Tooltip title="Field was missing in the document">
          <Chip icon={<HelpCircle size={12} />} label="Missing" color="error" size="small" variant="outlined" />
        </Tooltip>
      );
    }
    if (confidence >= 0.85) {
      return (
        <Tooltip title={`High Confidence AI Extraction (${Math.round(confidence * 100)}%)`}>
          <Chip icon={<CheckCircle size={12} />} label={`${Math.round(confidence * 100)}% Match`} color="success" size="small" />
        </Tooltip>
      );
    }
    return (
      <Tooltip title={`Medium Confidence AI Extraction (${Math.round(confidence * 100)}%) - Please review`}>
        <Chip icon={<AlertTriangle size={12} />} label={`${Math.round(confidence * 100)}% Review`} color="warning" size="small" />
      </Tooltip>
    );
  };

  const handleSimpleChange = (fieldKey: keyof ExtractedData, value: string) => {
    const current = formData[fieldKey] as any;
    onChange({
      ...formData,
      [fieldKey]: {
        ...current,
        value,
        is_missing: false,
      },
    });
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 4, height: '100%' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Material UI Auto-Filled Form
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Review, edit, and confirm extracted candidate details below
        </Typography>
      </Box>

      <Grid container spacing={2.5}>
        {/* Full Name */}
        <Grid item xs={12} sm={6}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
              Full Name *
            </Typography>
            {getConfidenceChip(formData.full_name?.confidence || 0, formData.full_name?.is_missing)}
          </Box>
          <TextField
            fullWidth
            size="small"
            value={formData.full_name?.value || ''}
            onChange={(e) => handleSimpleChange('full_name', e.target.value)}
            placeholder="e.g. John Doe"
            InputProps={{
              startAdornment: <User size={16} style={{ marginRight: 8, color: '#0284c7' }} />,
            }}
            error={formData.full_name?.is_missing || (formData.full_name?.confidence || 0) < 0.6}
          />
        </Grid>

        {/* Email */}
        <Grid item xs={12} sm={6}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
              Email Address
            </Typography>
            {getConfidenceChip(formData.email?.confidence || 0, formData.email?.is_missing)}
          </Box>
          <TextField
            fullWidth
            size="small"
            value={formData.email?.value || ''}
            onChange={(e) => handleSimpleChange('email', e.target.value)}
            placeholder="john@example.com"
            InputProps={{
              startAdornment: <Mail size={16} style={{ marginRight: 8, color: '#0284c7' }} />,
            }}
          />
        </Grid>

        {/* Phone */}
        <Grid item xs={12} sm={6}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
              Phone Number
            </Typography>
            {getConfidenceChip(formData.phone?.confidence || 0, formData.phone?.is_missing)}
          </Box>
          <TextField
            fullWidth
            size="small"
            value={formData.phone?.value || ''}
            onChange={(e) => handleSimpleChange('phone', e.target.value)}
            placeholder="+1 (555) 000-0000"
            InputProps={{
              startAdornment: <Phone size={16} style={{ marginRight: 8, color: '#0284c7' }} />,
            }}
          />
        </Grid>

        {/* Date of Birth */}
        <Grid item xs={12} sm={6}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
              Date of Birth
            </Typography>
            {getConfidenceChip(formData.dob?.confidence || 0, formData.dob?.is_missing)}
          </Box>
          <TextField
            fullWidth
            size="small"
            value={formData.dob?.value || ''}
            onChange={(e) => handleSimpleChange('dob', e.target.value)}
            placeholder="DD/MM/YYYY"
            InputProps={{
              startAdornment: <Calendar size={16} style={{ marginRight: 8, color: '#0284c7' }} />,
            }}
          />
        </Grid>

        {/* Address */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
              Address / Location
            </Typography>
            {getConfidenceChip(formData.address?.confidence || 0, formData.address?.is_missing)}
          </Box>
          <TextField
            fullWidth
            size="small"
            value={formData.address?.value || ''}
            onChange={(e) => handleSimpleChange('address', e.target.value)}
            placeholder="City, State, Country"
            InputProps={{
              startAdornment: <MapPin size={16} style={{ marginRight: 8, color: '#0284c7' }} />,
            }}
          />
        </Grid>

        {/* Skills */}
        <Grid item xs={12}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 }}>
            Extracted Skills ({formData.skills?.length || 0})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            {formData.skills && formData.skills.length > 0 ? (
              formData.skills.map((skill, idx) => (
                <Chip key={idx} label={skill} size="small" variant="filled" color="primary" />
              ))
            ) : (
              <Typography variant="caption" color="text.secondary">No skills detected</Typography>
            )}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};
