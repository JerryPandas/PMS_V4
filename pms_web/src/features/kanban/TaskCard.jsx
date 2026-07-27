import { Avatar, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { Draggable } from '@hello-pangea/dnd';

const priorityColor = {
  Low: 'default',
  Normal: 'primary',
  High: 'error'
};

export default function TaskCard({ task, index, canDragTask, onOpenDetail }) {
  return (
    <Draggable draggableId={String(task.id)} index={index} isDragDisabled={!canDragTask}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          variant="outlined"
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onOpenDetail?.(task.id)}
          sx={{
            width: '100%',
            mb: 1.5,
            borderRadius: 2,
            borderWidth: 1.5,
            cursor: canDragTask ? 'grab' : 'pointer',
            opacity: snapshot.isDragging ? 0.5 : 1,
            boxShadow: snapshot.isDragging ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
            '&:active': canDragTask ? { cursor: 'grabbing' } : {},
            ...provided.draggableProps.style
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
      )}
    </Draggable>
  );
}
