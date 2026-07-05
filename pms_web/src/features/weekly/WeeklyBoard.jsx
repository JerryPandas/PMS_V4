import { useEffect, useMemo, useState } from 'react';
import { Avatar, Box, IconButton, Paper, Stack, Typography } from '@mui/material';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import TodayRoundedIcon from '@mui/icons-material/TodayRounded';
import WeeklyTaskChip from './WeeklyTaskChip';
import DragConfirmDialog from './DragConfirmDialog';
import TaskDetailDialog from '../tasks/TaskDetailDialog';
import { getWeeklyBoard, dragTask } from '../../api/endpoints/taskApi';
import { useAuth } from '../auth/useAuth';
import {
  getMondayOf, getWeekDates, addDaysISO, formatWeekdayLabel, formatDateShort, formatWeekRange, isToday
} from './date-utils';

export default function WeeklyBoard() {
  const { user } = useAuth();
  const canManageOthers = user.role === 'Admin' || user.role === 'Manager';

  const [weekStart, setWeekStart] = useState(getMondayOf(new Date()));
  const [board, setBoard] = useState(null);
  const [pendingChange, setPendingChange] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragOverCell, setDragOverCell] = useState(null); // `${userId}_${date}`
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);

  useEffect(() => {
    getWeeklyBoard(weekStart).then(setBoard);
  }, [weekStart]);

  function reload() {
    getWeeklyBoard(weekStart).then(setBoard);
  }

  function canDrag(task) {
    return canManageOthers || task.assigneeId === user.id;
  }

  function handleDragStart(e, task, sourceUserId) {
    e.dataTransfer.setData('text/plain', JSON.stringify({ taskId: task.id, sourceUserId }));
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDrop(e, targetUserId, targetDate) {
    e.preventDefault();
    setDragOverCell(null);

    const raw = e.dataTransfer.getData('text/plain');
    if (!raw) return;
    const { taskId, sourceUserId } = JSON.parse(raw);

    const sourceRow = board.rows.find((r) => r.userId === sourceUserId);
    const task = sourceRow?.tasks.find((t) => t.id === taskId);
    if (!task) return;

    const isReassign = targetUserId !== sourceUserId;
    const isReschedule = targetDate !== task.scheduledDate;
    if (!isReassign && !isReschedule) return; // dropped back where it was

    // Members cannot reassign to someone else — the backend would reject it too.
    if (isReassign && !canManageOthers) return;

    const targetRow = board.rows.find((r) => r.userId === targetUserId);

    setPendingChange({
      task,
      sourceUserId,
      targetUserId,
      targetUserName: targetRow?.displayName,
      targetDate,
      isReassign,
      isReschedule
    });
  }

  async function confirmChange() {
    if (!pendingChange) return;
    setIsSubmitting(true);
    try {
      await dragTask(pendingChange.task.id, {
        newScheduledDate: pendingChange.isReschedule ? pendingChange.targetDate : undefined,
        newAssigneeId: pendingChange.isReassign ? pendingChange.targetUserId : undefined
      });
      setPendingChange(null);
      reload();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!board) return null;

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Typography variant="h5" fontWeight={500}>
          Team weekly board
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton onClick={() => setWeekStart(addDaysISO(weekStart, -7))} size="small">
            <ChevronLeftRoundedIcon />
          </IconButton>
          <Typography variant="body2" sx={{ minWidth: 160, textAlign: 'center' }}>
            {formatWeekRange(board.weekStart, board.weekEnd)}
          </Typography>
          <IconButton onClick={() => setWeekStart(addDaysISO(weekStart, 7))} size="small">
            <ChevronRightRoundedIcon />
          </IconButton>
          <IconButton onClick={() => setWeekStart(getMondayOf(new Date()))} size="small" title="This week">
            <TodayRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'auto' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '180px repeat(7, minmax(150px, 1fr))',
            minWidth: 180 + 150 * 7
          }}
        >
          {/* Header row */}
          <Box
            sx={{
              position: 'sticky', left: 0, zIndex: 2, bgcolor: 'grey.100',
              borderBottom: '1px solid', borderRight: '1px solid', borderColor: 'divider',
              p: 1.5
            }}
          >
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              TEAM MEMBER
            </Typography>
          </Box>
          {weekDates.map((date, i) => (
            <Box
              key={date}
              sx={{
                borderBottom: '1px solid', borderColor: 'divider', p: 1.5, textAlign: 'center',
                bgcolor: isToday(date) ? '#e8f0fe' : 'grey.100'
              }}
            >
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                {formatWeekdayLabel(i).toUpperCase()}
              </Typography>
              <Typography variant="body2" fontWeight={isToday(date) ? 600 : 400}>
                {formatDateShort(date)}
              </Typography>
            </Box>
          ))}

          {/* Rows: one per person */}
          {board.rows.map((row) => (
            <Box key={row.userId} sx={{ display: 'contents' }}>
              <Box
                sx={{
                  position: 'sticky', left: 0, zIndex: 1, bgcolor: 'background.paper',
                  borderBottom: '1px solid', borderRight: '1px solid', borderColor: 'divider',
                  p: 1.5, display: 'flex', alignItems: 'center', gap: 1
                }}
              >
                <Avatar sx={{ width: 26, height: 26, fontSize: 12, bgcolor: 'primary.main' }}>
                  {row.displayName[0]?.toUpperCase()}
                </Avatar>
                <Typography variant="body2" noWrap>
                  {row.displayName}
                </Typography>
              </Box>

              {weekDates.map((date) => {
                const cellKey = `${row.userId}_${date}`;
                const cellTasks = row.tasks.filter((t) => t.scheduledDate === date);
                return (
                  <Box
                    key={cellKey}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverCell(cellKey);
                    }}
                    onDragLeave={() => setDragOverCell((c) => (c === cellKey ? null : c))}
                    onDrop={(e) => handleDrop(e, row.userId, date)}
                    sx={{
                      borderBottom: '1px solid', borderColor: 'divider', p: 1, minHeight: 64,
                      bgcolor: dragOverCell === cellKey ? 'action.hover' : 'transparent',
                      transition: 'background-color 120ms ease'
                    }}
                  >
                    {cellTasks.map((task) => (
                      <WeeklyTaskChip
                        key={task.id}
                        task={task}
                        draggable={canDrag(task)}
                        onDragStart={(e) => handleDragStart(e, task, row.userId)}
                        onOpenDetail={setSelectedTaskId}
                      />
                    ))}
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>
      </Paper>

      <DragConfirmDialog
        pendingChange={pendingChange}
        onCancel={() => setPendingChange(null)}
        onConfirm={confirmChange}
        isSubmitting={isSubmitting}
      />
      <TaskDetailDialog taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />
    </Stack>
  );
}
