import { BarChart } from '@mui/x-charts/BarChart';
import { Paper, Typography } from '@mui/material';

export default function WorkloadChart({ rows }) {
  const hasData = rows && rows.length > 0;

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, flex: 1, minWidth: 340 }}>
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5 }}>
        Team workload
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
        Active vs completed tasks per member
      </Typography>
      {hasData ? (
        <BarChart
          height={300}
          margin={{ top: 20, right: 20, bottom: 70, left: 50 }}
          xAxis={[{ scaleType: 'band', data: rows.map((r) => r.displayName) }]}
          series={[
            { data: rows.map((r) => r.activeTaskCount), label: 'Active', color: '#4dabf7', stack: 'total' },
            { data: rows.map((r) => r.doneTaskCount), label: 'Done', color: '#69db7c', stack: 'total' }
          ]}
          slotProps={{
            legend: { direction: 'row', position: { vertical: 'bottom', horizontal: 'middle' } },
            bar: { rx: 2, ry: 2 }
          }}
          grid={{ vertical: false, horizontal: true }}
        />
      ) : (
        <Typography variant="body2" color="text.secondary">
          No team data yet.
        </Typography>
      )}
    </Paper>
  );
}
