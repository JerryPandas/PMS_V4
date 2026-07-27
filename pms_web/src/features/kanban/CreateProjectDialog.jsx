import { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from '@mui/material';

export default function CreateProjectDialog({ open, onClose, onCreate }) {
  const [projectCode, setProjectCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    setError('');
    setIsSubmitting(true);
    try {
      await onCreate({ projectCode, name, description: description || null });
      setProjectCode('');
      setName('');
      setDescription('');
      onClose();
    } catch (err) {
      setError(err.response?.status === 409 ? 'That project code is already in use.' : 'Could not create the project.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>New project</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            label="Project code"
            placeholder="e.g. 26AA01"
            value={projectCode}
            onChange={(e) => setProjectCode(e.target.value.toUpperCase())}
            autoFocus
            fullWidth
            required
          />
          <TextField label="Project name" value={name} onChange={(e) => setName(e.target.value)} fullWidth required />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
          {error && <span style={{ color: '#d93025', fontSize: 13 }}>{error}</span>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!projectCode || !name || isSubmitting}>
          {isSubmitting ? 'Creating…' : 'Create project'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
