import { useEffect, useState } from 'react';
import {
  Chip, CircularProgress, Dialog, DialogContent, DialogTitle, Divider,
  IconButton, Stack, Typography
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { getTaskDetail } from '../../api/endpoints/taskApi';

const priorityColor = { Low: 'default', Normal: 'primary', High: 'error' };
const columnLabel = { Todo: 'To do', InProgress: 'In progress', Review: 'Review', Done: 'Done' };
const changeTypeLabel = { DateChanged: 'Rescheduled', AssigneeChanged: 'Reassigned' };

/** Opens whenever `taskId` is non-null; pass `onClose` to clear it. */
export default function TaskDetailDialog({ taskId, onClose }) {
  const [detail, setDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!taskId) {
      setDetail(null);
      return;
    }
    setIsLoading(true);
    getTaskDetail(taskId)
      .then(setDetail)
      .finally(() => setIsLoading(false));
  }, [taskId]);

  return (
    <Dialog open={!!taskId} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Task details
        <IconButton size="small" onClick={onClose}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {isLoading || !detail ? (
          <Stack alignItems="center" sx={{ py: 4 }}>
            <CircularProgress size={28} />
          </Stack>
        ) : (
          <Stack spacing={2}>
            <Typography variant="h6" fontWeight={500}>
              {detail.title}
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip label={columnLabel[detail.kanbanColumn]} size="small" />
              <Chip label={detail.priority} size="small" color={priorityColor[detail.priority]} />
              {detail.projectCode && <Chip label={detail.projectCode} size="small" variant="outlined" />}
              {detail.projectItemTitle && (
                <Chip label={detail.projectItemTitle} size="small" variant="outlined" />
              )}
            </Stack>

            {detail.description && (
              <Typography variant="body2" color="text.secondary">
                {detail.description}
              </Typography>
            )}

            <Divider />

            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">
                Assignee: <strong>{detail.assigneeName}</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Scheduled date: <strong>{detail.scheduledDate}</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Created by {detail.createdByName} on {new Date(detail.createdAt).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Last updated: {new Date(detail.updatedAt).toLocaleString()}
              </Typography>
            </Stack>

            {detail.changeLogs.length > 0 && (
              <>
                <Divider />
                <Typography variant="subtitle2" fontWeight={500}>
                  Activity history
                </Typography>
                <Stack spacing={1}>
                  {detail.changeLogs.map((log, i) => (
                    <Typography key={i} variant="caption" color="text.secondary">
                      {changeTypeLabel[log.changeType] || log.changeType}: {log.oldValue} → {log.newValue}
                      {' · '}by {log.changedByName} on {new Date(log.changedAt).toLocaleString()}
                    </Typography>
                  ))}
                </Stack>
              </>
            )}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
