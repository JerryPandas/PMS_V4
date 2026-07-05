import { Box, Chip, Paper, Stack, Typography } from '@mui/material';
import { useDroppable } from '@dnd-kit/core';
import TaskCard from './TaskCard';

const columnMeta = {
  Todo: { label: 'To do', color: '#5f6368' },
  InProgress: { label: 'In progress', color: '#1a73e8' },
  Review: { label: 'Review', color: '#f9ab00' },
  Done: { label: 'Done', color: '#188038' }
};

export default function KanbanColumn({ column, tasks, canDragTask, onOpenDetail }) {
  const { setNodeRef, isOver } = useDroppable({ id: column });
  const meta = columnMeta[column];

  return (
    <Paper
      ref={setNodeRef}
      variant="outlined"
      sx={{
        flex: 1,
        minWidth: 260,
        p: 1.5,
        borderRadius: 3,
        borderColor: isOver ? 'primary.main' : 'divider'
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5, px: 0.5 }}>
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: meta.color }} />
        <Typography variant="subtitle2" fontWeight={500}>
          {meta.label}
        </Typography>
        <Chip label={tasks.length} size="small" sx={{ height: 20, fontSize: 11 }} />
      </Stack>

      <Box sx={{ minHeight: 80 }}>
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            canDragTask={canDragTask(task)}
            onOpenDetail={onOpenDetail}
          />
        ))}
        {tasks.length === 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ px: 0.5 }}>
            No tasks
          </Typography>
        )}
      </Box>
    </Paper>
  );
}
