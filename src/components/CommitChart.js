import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './CommitChart.css';

const CommitChart = ({ commitActivity }) => {
  if (!commitActivity || !Array.isArray(commitActivity) || commitActivity.length === 0) {
    return (
      <div className="commit-chart">
        <h3>Commit Activity (Last 52 Weeks)</h3>
        <p className="no-data">No commit activity data available</p>
      </div>
    );
  }

  // Transform the data for the chart
  const chartData = commitActivity.map((week, index) => {
    const weekStart = new Date(week.week * 1000);
    return {
      week: `Week ${52 - commitActivity.length + index + 1}`,
      commits: week.total,
      date: weekStart.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      fullDate: weekStart.toLocaleDateString()
    };
  });

  const totalCommits = chartData.reduce((sum, week) => sum + week.commits, 0);
  const avgCommitsPerWeek = (totalCommits / chartData.length).toFixed(1);
  const maxCommitsInWeek = Math.max(...chartData.map(w => w.commits));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{data.fullDate}</p>
          <p className="tooltip-value">
            {data.commits} commit{data.commits !== 1 ? 's' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="commit-chart">
      <h3>Commit Activity (Last 52 Weeks)</h3>
      
      <div className="activity-stats">
        <div className="stat">
          <span className="stat-value">{totalCommits}</span>
          <span className="stat-label">Total Commits</span>
        </div>
        <div className="stat">
          <span className="stat-value">{avgCommitsPerWeek}</span>
          <span className="stat-label">Avg per Week</span>
        </div>
        <div className="stat">
          <span className="stat-value">{maxCommitsInWeek}</span>
          <span className="stat-label">Peak Week</span>
        </div>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e1e4e8" />
            <XAxis 
              dataKey="date" 
              stroke="#586069"
              fontSize={12}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke="#586069"
              fontSize={12}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="commits" 
              stroke="#0366d6" 
              strokeWidth={2}
              dot={{ fill: '#0366d6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#0366d6', strokeWidth: 2, fill: 'white' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CommitChart;
