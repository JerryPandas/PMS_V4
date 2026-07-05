import { useRef } from 'react';
import { Box, Tooltip, Typography } from '@mui/material';

const priorityBg = {
  Low: '#f1f3f4',
  Normal: '#e8f0fe',
  High: '#fce8e6'
};
const priorityColor = {
  Low: '#5f6368',
  Normal: '#1a73e8',
  High: '#d93025'
};

export default function WeeklyTaskChip({ task, draggable, onDragStart, onOpenDetail }) {
  // Same click-vs-drag disambiguation as the kanban TaskCard.
  const justDraggedRef = useRef(false);

  function handleDragStart(e) {
    justDraggedRef.current = true;
    onDragStart(e, task);
  }

  function handleDragEnd() {
    setTimeout(() => {
      justDraggedRef.current = false;
    }, 0);
  }

  function handleClick() {
    if (justDraggedRef.current) return;
    onOpenDetail?.(task.id);
  }

  return (
    <Tooltip title={task.title} placement="top" arrow>
      <Box
        draggable={draggable}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={handleClick}
        sx={{
          bgcolor: priorityBg[task.priority] || '#f1f3f4',
          color: priorityColor[task.priority] || '#3c4043',
          borderRadius: 1.5,
          px: 1,
          py: 0.5,
          mb: 0.75,
          cursor: draggable ? 'grab' : 'pointer',
          '&:active': { cursor: draggable ? 'grabbing' : 'pointer' },
          '&:hover': { filter: 'brightness(0.96)' }
        }}
      >
        <Typography
          variant="caption"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            fontWeight: 500,
            lineHeight: 1.3
          }}
        >
          {task.title}
        </Typography>
      </Box>
    </Tooltip>
  );
}
