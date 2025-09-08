import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import '../css/LanguageChart.css';

const LanguageChart = ({ languages }) => {
  if (!languages || Object.keys(languages).length === 0) {
    return (
      <div className="language-chart">
        <h3>Language Composition</h3>
        <p className="no-data">No language data available</p>
      </div>
    );
  }

  // Calculate total bytes and convert to percentage
  const totalBytes = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0);
  
  const chartData = Object.entries(languages)
    .map(([language, bytes]) => ({
      name: language,
      value: bytes,
      percentage: ((bytes / totalBytes) * 100).toFixed(1)
    }))
    .sort((a, b) => b.value - a.value);

  // Color palette for different languages
  const COLORS = [
    '#0366d6', '#28a745', '#ffd33d', '#f1502f', '#563d7c',
    '#e34c26', '#f1e05a', '#083fa1', '#178600', '#cb171e',
    '#555555', '#c6538c', '#3572a5', '#89e051', '#701516'
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{data.name}</p>
          <p className="tooltip-value">{data.percentage}%</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }) => {
    if (parseFloat(percentage) < 5) return null; // Don't show labels for small slices
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${percentage}%`}
      </text>
    );
  };

  return (
    <div className="language-chart">
      <h3>Language Composition</h3>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={360}>
          <PieChart margin={{ top: 20, right: 32, bottom: 56, left: 32 }}>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={110}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              align="center"
              layout="horizontal"
              iconType="circle"
              wrapperStyle={{ paddingTop: 8 }}
              formatter={(value, entry) => `${value} (${entry.payload.percentage}%)`}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="language-stats">
        {chartData.slice(0, 5).map((lang, index) => (
          <div key={lang.name} className="language-stat">
            <div 
              className="language-color" 
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            ></div>
            <span className="language-name">{lang.name}</span>
            <span className="language-percentage">{lang.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LanguageChart;
