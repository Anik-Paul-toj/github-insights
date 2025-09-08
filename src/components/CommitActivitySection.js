import React, { useEffect, useMemo, useRef, useState } from 'react';
import githubService from '../services/githubService';

const boxColors = [
  'rgba(34,197,94,0.08)',
  'rgba(34,197,94,0.25)',
  'rgba(34,197,94,0.45)',
  'rgba(34,197,94,0.65)',
  'rgba(34,197,94,0.9)'
];

const CommitActivitySection = ({ githubUsername }) => {
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const containerRef = useRef(null);
  const [cellSize, setCellSize] = useState(14);

  useEffect(() => {
    if (!githubUsername) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        // 1) Try exact contributions calendar via GraphQL (matches GitHub profile)
        const calendar = await githubService.getUserContributions(githubUsername);
        if (cancelled) return;
        if (Array.isArray(calendar) && calendar.length > 0) {
          setWeeks(calendar);
          return;
        }

        // 2) Fallback: merge recent repositories' commit activity
        const repos = await githubService.getAllUserRepositories(githubUsername, 5);
        if (cancelled) return;
        const nonForks = (repos || []).filter(r => !r.fork);
        const recent = nonForks
          .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
          .slice(0, 6);
        const arrays = await Promise.all(
          recent.map(r => githubService.getCommitActivity(r.owner.login, r.name).catch(() => []))
        );
        if (cancelled) return;
        const merged = new Map();
        arrays.forEach(weeksArr => {
          (weeksArr || []).forEach(w => {
            const existing = merged.get(w.week) || { week: w.week, total: 0, days: [0,0,0,0,0,0,0] };
            const days = (w.days || []).map((d, i) => (existing.days[i] || 0) + (d || 0));
            merged.set(w.week, { week: w.week, total: (existing.total || 0) + (w.total || 0), days });
          });
        });
        const mergedWeeks = Array.from(merged.values()).sort((a, b) => a.week - b.week).slice(-52);
        setWeeks(mergedWeeks);
      } catch (e) {
        setError(e?.message || 'Failed to load activity');
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [githubUsername]);

  const maxDay = useMemo(() => {
    let max = 0;
    weeks.forEach(w => (w.days || []).forEach(d => { if (d > max) max = d; }));
    return Math.max(1, max);
  }, [weeks]);

  const weeksCount = weeks.length;
  const gap = 3;

  useEffect(() => {
    const measure = () => {
      const el = containerRef.current;
      if (!el || weeksCount === 0) return;
      const available = el.clientWidth - (weeksCount - 1) * gap - 40;
      const size = Math.max(10, Math.min(18, Math.floor(available / weeksCount)));
      setCellSize(size);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [weeksCount]);

  const monthLabels = useMemo(() => {
    const labels = [];
    let lastMonth = -1;
    weeks.forEach((w) => {
      const d = new Date(w.week * 1000);
      const m = d.getMonth();
      if (m !== lastMonth) {
        labels.push(new Intl.DateTimeFormat('en', { month: 'short' }).format(d));
        lastMonth = m;
      } else {
        labels.push('');
      }
    });
    return labels;
  }, [weeks]);

  return (
    <section id="commit-activity" className="container" style={{ padding: '64px 0' }}>
      <h2 className="section-title">Contributions in the last year</h2>
      {loading && <div style={{ color: '#fff', padding: '12px 0' }}>Loading...</div>}
      {error && <div className="error-inline" style={{ marginBottom: 12 }}>{error}</div>}
      {!loading && !error && (
        <div style={{ overflowX: 'auto' }} ref={containerRef}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${weeksCount}, ${cellSize}px)`, gap, color: '#9ca3af', fontSize: 12, marginBottom: 6 }}>
            {monthLabels.map((m, i) => (
              <div key={`m-${i}`} style={{ textAlign: 'left' }}>{m}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${weeksCount}, ${cellSize}px)`, gap }}>
            {weeks.map((w) => (
              <div key={w.week} style={{ display: 'grid', gridTemplateRows: `repeat(7, ${cellSize}px)`, gap }}>
                {(w.days || []).map((d, di) => {
                  const level = d === 0 ? 0 : Math.min(4, Math.ceil((d / maxDay) * 4));
                  return (
                    <div key={`${w.week}-${di}`} title={`${d} contributions`} style={{ width: cellSize, height: cellSize, borderRadius: 3, background: boxColors[level], border: '1px solid rgba(255,255,255,0.06)' }} />
                  );
                })}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, alignItems: 'center', marginTop: 8, color: '#9ca3af', fontSize: 12 }}>
            <span>Less</span>
            {boxColors.map((c, i) => (
              <div key={i} style={{ width: 12, height: 12, background: c, borderRadius: 2, border: '1px solid rgba(255,255,255,0.08)' }} />
            ))}
            <span>More</span>
          </div>
        </div>
      )}
    </section>
  );
};

export default CommitActivitySection;


