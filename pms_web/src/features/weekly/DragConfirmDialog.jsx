import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { formatDateShort } from './date-utils';

export default function DragConfirmDialog({ pendingChange, onCancel, onConfirm, isSubmitting }) {
  if (!pendingChange) return null;
  const { task, isReschedule, isReassign, targetDate, targetUserName } = pendingChange;

  let message;
  if (isReschedule && isReassign) {
    message = `Move "${task.title}" to ${formatDateShort(targetDate)} and reassign it to ${targetUserName}?`;
  } else if (isReassign) {
    message = `Reassign "${task.title}" to ${targetUserName}?`;
  } else {
    message = `Move "${task.title}" to ${formatDateShort(targetDate)}?`;
  }

  return (
    <Dialog open onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>Confirm change</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button variant="contained" onClick={onConfirm} disabled={isSubmitting}>
          {isSubmitting ? 'Applying…' : 'Confirm'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
