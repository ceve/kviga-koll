import { useState } from 'react';
import { computeFeedPlan } from '../utils/calculations.js';

export default function FeedPlan({ herd }) {
  const [animalId, setAnimalId] = useState('');

  const animal = herd.animals.find((a) => a.id === animalId);
  const latestWeight = animal && animal.weights.length > 0
    ? [...animal.weights].sort((a, b) => a.date.localeCompare(b.date)).at(-1).kg
    : null;

  const plan = latestWeight !== null ? computeFeedPlan(latestWeight) : null;

  return (
    <section className="card">
      <h2>Foderplan</h2>
      {herd.animals.length === 0 ? (
        <p className="empty">Inga djur registrerade.</p>
      ) : (
        <>
          <div className="form-grid" style={{ maxWidth: 300 }}>
            <div>
              <label htmlFor="feed-animal">Välj djur</label>
              <select id="feed-animal" value={animalId} onChange={(e) => setAnimalId(e.target.value)}>
                <option value="">-- Välj --</option>
                {herd.animals.map((a) => (
                  <option key={a.id} value={a.id}>{a.id} – {a.name}</option>
                ))}
              </select>
            </div>
          </div>

          {animal && latestWeight === null && (
            <p className="empty" style={{ marginTop: '1rem' }}>
              Ingen vikt registrerad för {animal.name}. Registrera vikt först.
            </p>
          )}

          {plan && (
            <div className="stat-grid" style={{ marginTop: '1rem' }}>
              <div className="stat-box">
                <div className="value">{plan.bodyWeightKg}</div>
                <div className="label">Kroppsvikt (kg)</div>
              </div>
              <div className="stat-box">
                <div className="value">{plan.dailyDmiKg}</div>
                <div className="label">Dagligt ts-intag (kg)</div>
              </div>
              <div className="stat-box">
                <div className="value">{plan.forageKg}</div>
                <div className="label">Grovfoder (60 %)</div>
              </div>
              <div className="stat-box">
                <div className="value">{plan.concentrateKg}</div>
                <div className="label">Kraftfoder (40 %)</div>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
