import { Avatar, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { useDraggable } from '@dnd-kit/core';

const priorityColor = {
  Low: 'default',
  Normal: 'primary',
  High: 'error'
};

export default function TaskCard({ task, canDragTask, onOpenDetail }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { type: 'task', taskId: task.id, column: task.kanbanColumn },
    disabled: !canDragTask
  });

  return (
    <Card
      ref={setNodeRef}
      variant="outlined"
      {...listeners}
      {...attributes}
      onClick={() => onOpenDetail?.(task.id)}
      sx={{
        mb: 1.5,
        borderRadius: 2,
        cursor: canDragTask ? 'grab' : 'pointer',
        visibility: isDragging ? 'hidden' : 'visible'
      }}
    >
      <CardContent sx={{ p: 1.75, '&:last-child': { pb: 1.75 } }}>
        <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>
          {task.title}
        </Typography>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Chip
            label={task.priority}
            size="small"
            color={priorityColor[task.priority] || 'default'}
            variant={task.priority === 'Normal' ? 'outlined' : 'filled'}
          />
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Typography variant="caption" color="text.secondary">
              {task.scheduledDate}
            </Typography>
            <Avatar sx={{ width: 22, height: 22, fontSize: 11, bgcolor: 'primary.main' }}>
              {task.assigneeName?.[0]?.toUpperCase()}
            </Avatar>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
