import { useState } from 'react';
import { computeDueTasks } from '../utils/calculations.js';

const BADGE_CLASS = {
  'Vaccination': 'badge',
  'Klövkontroll': 'badge info',
  'Brunst-/betäckningskontroll': 'badge warn',
};

export default function DueTasks({ herd }) {
  const [days, setDays] = useState(30);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const allTasks = herd.animals.flatMap((a) => computeDueTasks(a, today, days));
  allTasks.sort((a, b) => (a.date || a.windowStart).localeCompare(b.date || b.windowStart));

  return (
    <section className="card">
      <h2>Kommande uppgifter</h2>
      <div className="form-grid" style={{ maxWidth: 300, marginBottom: '1rem' }}>
        <div>
          <label htmlFor="horizon">Horisont (dagar)</label>
          <input
            id="horizon"
            type="number"
            min="1"
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value) || 30)}
          />
        </div>
      </div>

      {allTasks.length === 0 ? (
        <p className="empty">Inga uppgifter inom {days} dagar.</p>
      ) : (
        <ul className="task-list">
          {allTasks.map((t, i) => (
            <li key={i}>
              <div>
                <span className={BADGE_CLASS[t.task] || 'badge'}>{t.task}</span>{' '}
                <strong>{t.animalName}</strong> ({t.animalId})
              </div>
              <div style={{ fontSize: '0.85rem', color: '#555' }}>
                {t.date ? t.date : `${t.windowStart} – ${t.windowEnd}`}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
