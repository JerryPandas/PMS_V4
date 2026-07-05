import { useEffect, useState } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import { Paper, Typography } from '@mui/material';
import { getWeeklyBoard } from '../../api/endpoints/taskApi';
import { getWeekDates, formatWeekdayLabel, getMondayOf } from '../weekly/date-utils';

export default function WeeklyTrendChart() {
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    const weekStart = getMondayOf(new Date());
    getWeeklyBoard(weekStart).then((board) => {
      const dates = getWeekDates(board.weekStart);
      const perDay = dates.map(
        (date) => board.rows.reduce((sum, row) => sum + row.tasks.filter((t) => t.scheduledDate === date).length, 0)
      );
      setCounts(perDay);
    });
  }, []);

  const hasData = counts && counts.some((c) => c > 0);

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, flex: 1, minWidth: 340 }}>
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5 }}>
        This week's task load
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
        Scheduled tasks per day
      </Typography>
      {hasData ? (
        <LineChart
          height={300}
          margin={{ top: 20, right: 20, bottom: 70, left: 50 }}
          xAxis={[{ scaleType: 'point', data: [0, 1, 2, 3, 4, 5, 6].map(formatWeekdayLabel) }]}
          series={[
            {
              data: counts,
              label: 'Tasks scheduled',
              color: '#4dabf7',
              area: true,
              showMark: true,
              valueFormatter: (v) => `${v} tasks`,
              curve: 'natural'
            }
          ]}
          slotProps={{
            legend: { hidden: true }
          }}
          grid={{ vertical: false, horizontal: true }}
        />
      ) : (
        <Typography variant="body2" color="text.secondary">
          No tasks scheduled this week yet.
        </Typography>
      )}
    </Paper>
  );
}
