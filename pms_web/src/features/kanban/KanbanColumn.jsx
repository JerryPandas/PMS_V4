import { Box, Chip, Paper, Skeleton, Stack, Typography } from '@mui/material';
import { Droppable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';

const columnMeta = {
  Todo: { label: 'To do', color: '#5f6368' },
  InProgress: { label: 'In progress', color: '#1a73e8' },
  Review: { label: 'Review', color: '#f9ab00' },
  Done: { label: 'Done', color: '#188038' }
};

export default function KanbanColumn({ column, tasks, canDragTask, onOpenDetail, isLoading }) {
  const meta = columnMeta[column];

  return (
    <Paper
      variant="outlined"
      sx={{
        flex: 1,
        minWidth: 260,
        p: 1.5,
        borderRadius: 3,
        borderColor: 'divider'
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5, px: 0.5 }}>
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: meta.color }} />
        <Typography variant="subtitle2" fontWeight={500}>
          {meta.label}
        </Typography>
        <Chip label={tasks.length} size="small" sx={{ height: 20, fontSize: 11 }} />
      </Stack>

      <Droppable droppableId={column}>
        {(provided, snapshot) => (
          <Box
            ref={provided.innerRef}
            {...provided.droppableProps}
            sx={{
              minHeight: 80,
              backgroundColor: snapshot.isDraggingOver ? 'action.hover' : 'transparent',
              borderRadius: 1,
              transition: 'background-color 0.2s ease'
            }}
          >
            {isLoading ? (
              <Stack spacing={1.5}>
                <Skeleton variant="rounded" height={80} />
                <Skeleton variant="rounded" height={80} />
              </Stack>
            ) : (
              <>
                {tasks.map((task, index) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    index={index}
                    canDragTask={canDragTask(task)}
                    onOpenDetail={onOpenDetail}
                  />
                ))}
                {tasks.length === 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ px: 0.5 }}>
                    No tasks
                  </Typography>
                )}
              </>
            )}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    </Paper>
  );
}
