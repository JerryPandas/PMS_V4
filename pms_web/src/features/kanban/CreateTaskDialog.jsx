import { useState } from 'react';
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle,
  MenuItem, Stack, TextField
} from '@mui/material';

const priorities = ['Low', 'Normal', 'High'];

export default function CreateTaskDialog({ open, onClose, onCreate, assignableUsers, defaultAssigneeId }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState(defaultAssigneeId || '');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().slice(0, 10));
  const [priority, setPriority] = useState('Normal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      await onCreate({ title, description, assigneeId, scheduledDate, priority });
      setTitle('');
      setDescription('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>New task</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus fullWidth required />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
          <TextField
            select
            label="Assignee"
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            fullWidth
            required
          >
            {assignableUsers.map((u) => (
              <MenuItem key={u.id} value={u.id}>
                {u.displayName}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Scheduled date"
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField select label="Priority" value={priority} onChange={(e) => setPriority(e.target.value)} fullWidth>
            {priorities.map((p) => (
              <MenuItem key={p} value={p}>
                {p}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!title || !assigneeId || isSubmitting}
        >
          {isSubmitting ? 'Creating…' : 'Create task'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
