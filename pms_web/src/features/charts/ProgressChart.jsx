import { BarChart } from '@mui/x-charts/BarChart';
import { Paper, Typography } from '@mui/material';

const columnColor = { Todo: '#adb5bd', InProgress: '#4dabf7', Review: '#fcc419', Done: '#69db7c' };
const columnLabel = { Todo: 'To do', InProgress: 'In progress', Review: 'Review', Done: 'Done' };

export default function ProgressChart({ data }) {
  const hasData = data && data.totalTasks > 0;

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, flex: 1, minWidth: 340 }}>
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5 }}>
        Project progress
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
        Task distribution across Kanban columns
      </Typography>
      {hasData ? (
        <BarChart
          height={300}
          margin={{ top: 20, right: 20, bottom: 70, left: 50 }}
          xAxis={[{ scaleType: 'band', data: data.byColumn.map((c) => columnLabel[c.column]) }]}
          series={[
            {
              data: data.byColumn.map((c) => c.count),
              label: 'Tasks',
              color: '#1a73e8',
              valueFormatter: (v) => `${v} tasks`
            }
          ]}
          colors={data.byColumn.map((c) => columnColor[c.column])}
          slotProps={{
            legend: { hidden: true },
            bar: { rx: 4, ry: 4 }
          }}
          grid={{ vertical: false, horizontal: true }}
        />
      ) : (
        <Typography variant="body2" color="text.secondary">
          No tasks yet for this project.
        </Typography>
      )}
    </Paper>
  );
}
