import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import './RepositoryModal.css';
import githubService from '../services/githubService';

const boxColors = [
  'rgba(34,197,94,0.08)',
  'rgba(34,197,94,0.25)',
  'rgba(34,197,94,0.45)',
  'rgba(34,197,94,0.65)',
  'rgba(34,197,94,0.9)'
];

const CommitActivityModal = ({ isOpen, onClose, githubUsername }) => {
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMax, setIsMax] = useState(false);
  const containerRef = useRef(null);
  const [cellSize, setCellSize] = useState(14);

  useEffect(() => {
    if (!isOpen || !githubUsername) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const repos = await githubService.getAllUserRepositories(githubUsername, 5);
        if (cancelled) return;
        const nonForks = (repos || []).filter(r => !r.fork);
        const recent = nonForks.sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at)).slice(0, 6);
        const arrays = await Promise.all(recent.map(r => githubService.getCommitActivity(r.owner.login, r.name).catch(() => [])));
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
  }, [isOpen, githubUsername]);

  const maxDay = useMemo(() => {
    let max = 0;
    weeks.forEach(w => (w.days || []).forEach(d => { if (d > max) max = d; }));
    return Math.max(1, max);
  }, [weeks]);

  const weeksCount = weeks.length;
  const cell = isMax ? cellSize : 14;
  const gap = isMax ? 4 : 3;

  useEffect(() => {
    if (!isMax) {
      setCellSize(14);
      return;
    }
    const measure = () => {
      const el = containerRef.current;
      if (!el || weeksCount === 0) return;
      const available = el.clientWidth - (weeksCount - 1) * gap - 40;
      const size = Math.max(10, Math.min(20, Math.floor(available / weeksCount)));
      setCellSize(size);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [isMax, weeksCount, gap]);

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

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal>
      <div className="modal-content" style={{ maxWidth: isMax ? '95vw' : 900 }}>
        <div className="modal-header">
          <h2>Contributions in the last year</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="close-button" onClick={() => setIsMax(!isMax)} aria-label={isMax ? 'Shrink' : 'Enlarge'}>
              {isMax ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button className="close-button" onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="modal-body" style={{ paddingBottom: 24 }}>
          {loading && <div style={{ color: '#fff', padding: '12px 0' }}>Loading...</div>}
          {error && <div className="error-inline" style={{ marginBottom: 12 }}>{error}</div>}
          {!loading && !error && (
            <div style={{ overflowX: 'auto' }} ref={containerRef}>
              {isMax && (
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${weeksCount}, ${cell}px)`, gap, color: '#9ca3af', fontSize: 12, marginBottom: 6 }}>
                  {monthLabels.map((m, i) => (
                    <div key={`m-${i}`} style={{ textAlign: 'left' }}>{m}</div>
                  ))}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${weeksCount}, ${cell}px)`, gap }}>
                {weeks.map((w) => (
                  <div key={w.week} style={{ display: 'grid', gridTemplateRows: `repeat(7, ${cell}px)`, gap }}>
                    {(w.days || []).map((d, di) => {
                      const level = d === 0 ? 0 : Math.min(4, Math.ceil((d / maxDay) * 4));
                      return (
                        <div key={`${w.week}-${di}`} title={`${d} contributions on ${new Date(w.week*1000 + di*24*60*60*1000).toLocaleDateString()}`} style={{ width: cell, height: cell, borderRadius: 3, background: boxColors[level], border: '1px solid rgba(255,255,255,0.06)' }} />
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
        </div>
      </div>
    </div>
  );
};

export default CommitActivityModal;


