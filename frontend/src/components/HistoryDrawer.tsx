'use client';

import React, { useEffect, useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  CircularProgress,
} from '@mui/material';
import { X, Clock, FileText } from 'lucide-react';
import { fetchHistory } from '../lib/api';
import { ExtractionResponse } from '../types/extraction';

interface HistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  onSelectHistoryItem: (item: ExtractionResponse) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({ open, onClose, onSelectHistoryItem }) => {
  const [historyItems, setHistoryItems] = useState<ExtractionResponse[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetchHistory()
        .then((data) => setHistoryItems(data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [open]);

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 400 }, p: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Clock size={20} color="#0284c7" />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            MongoDB Upload History
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <X size={20} />
        </IconButton>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Saved extractions stored in MongoDB Atlas
      </Typography>

      <Divider sx={{ mb: 2 }} />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={28} />
        </Box>
      ) : historyItems.length === 0 ? (
        <Box sx={{ textAlignment: 'center', py: 6, color: 'text.secondary' }}>
          <FileText size={32} style={{ opacity: 0.5, marginBottom: 8 }} />
          <Typography variant="body2">No upload history found in MongoDB.</Typography>
        </Box>
      ) : (
        <List sx={{ p: 0 }}>
          {historyItems.map((item, idx) => (
            <React.Fragment key={item.id || idx}>
              <ListItem
                button
                onClick={() => {
                  onSelectHistoryItem(item);
                  onClose();
                }}
                sx={{ borderRadius: 2, mb: 1, p: 1.5, border: '1px solid', borderColor: 'divider' }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {item.filename}
                      </Typography>
                      <Chip label={item.doc_type} size="small" color="primary" sx={{ height: 20, fontSize: '0.7rem' }} />
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      Accuracy: {Math.round((item.avg_confidence || 0.9) * 100)}% • {new Date(item.created_at).toLocaleDateString()}
                    </Typography>
                  }
                />
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      )}
    </Drawer>
  );
};
