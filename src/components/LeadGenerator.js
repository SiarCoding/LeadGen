import React, { useState } from 'react';
import { 
  Container, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Box,
  Typography,
  Alert
} from '@mui/material';
import { searchGoogle, searchInstagram } from '../services/api';
import LeadTable from './LeadTable';

const LeadGenerator = () => {
  const [query, setQuery] = useState('');
  const [source, setSource] = useState('google');
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [numResults, setNumResults] = useState(10);

  const handleSearch = async () => {
    if (!query.trim()) {
      setError('Bitte geben Sie einen Suchbegriff ein');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let results = [];
      if (source === 'google') {
        results = await searchGoogle(query, numResults);
      } else if (source === 'instagram') {
        results = await searchInstagram(query, numResults);
      }

      setLeads(results.map(lead => ({
        ...lead,
        status: 'not-scheduled'
      })));
    } catch (error) {
      console.error('Error searching:', error);
      setError('Fehler bei der Suche. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (leadToDelete) => {
    setLeads(leads.filter(lead => lead !== leadToDelete));
  };

  const handleBlacklist = (leadToBlacklist) => {
    // Add to blacklist in localStorage
    const blacklistedLeads = JSON.parse(localStorage.getItem('blacklistedLeads') || '[]');
    blacklistedLeads.push(leadToBlacklist);
    localStorage.setItem('blacklistedLeads', JSON.stringify(blacklistedLeads));

    // Remove from current leads
    handleDelete(leadToBlacklist);
  };

  const handleStatusChange = (index, newStatus) => {
    const updatedLeads = [...leads];
    updatedLeads[index] = {
      ...updatedLeads[index],
      status: newStatus
    };
    setLeads(updatedLeads);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Lead Generator
        </Typography>
        
        <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'flex-end' }}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Quelle</InputLabel>
            <Select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              label="Quelle"
            >
              <MenuItem value="google">Google Maps</MenuItem>
              <MenuItem value="instagram">Instagram</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Suchbegriff"
            variant="outlined"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            sx={{ flexGrow: 1 }}
          />

          <TextField
            label="Anzahl der Ergebnisse"
            type="number"
            value={numResults}
            onChange={(e) => setNumResults(parseInt(e.target.value))}
            InputProps={{ inputProps: { min: 1, max: 50 } }}
            sx={{ width: 150 }}
          />

          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? 'Suche...' : 'Suchen'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <LeadTable 
          leads={leads}
          onDelete={handleDelete}
          onBlacklist={handleBlacklist}
          onStatusChange={handleStatusChange}
          source={source}
        />
      </Box>
    </Container>
  );
};

export default LeadGenerator;
