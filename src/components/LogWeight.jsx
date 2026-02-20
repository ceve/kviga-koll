import { useState } from 'react';
import { computeAdg } from '../utils/calculations.js';

export default function LogWeight({ herd, updateHerd }) {
  const today = new Date().toISOString().slice(0, 10);
  const [animalId, setAnimalId] = useState('');
  const [kg, setKg] = useState('');
  const [date, setDate] = useState(today);
  const [lastAdg, setLastAdg] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!animalId || !kg) return;

    const weight = parseFloat(kg);
    if (isNaN(weight) || weight <= 0) return;

    updateHerd((prev) => {
      const animals = prev.animals.map((a) => {
        if (a.id !== animalId) return a;
        const updatedWeights = [...a.weights, { date, kg: weight }];
        const adg = computeAdg(updatedWeights);
        setLastAdg(adg);
        return { ...a, weights: updatedWeights };
      });
      return { animals };
    });

    setKg('');
  };

  const selected = herd.animals.find((a) => a.id === animalId);

  return (
    <section className="card">
      <h2>Registrera vikt</h2>
      {herd.animals.length === 0 ? (
        <p className="empty">Inga djur registrerade. Lägg till ett djur först.</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div>
              <label htmlFor="weight-animal">Välj djur</label>
              <select id="weight-animal" value={animalId} onChange={(e) => { setAnimalId(e.target.value); setLastAdg(null); }}>
                <option value="">-- Välj --</option>
                {herd.animals.map((a) => (
                  <option key={a.id} value={a.id}>{a.id} – {a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="weight-kg">Vikt (kg)</label>
              <input id="weight-kg" type="number" step="0.1" min="0" value={kg} onChange={(e) => setKg(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="weight-date">Datum</label>
              <input id="weight-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <button type="submit">Spara vikt</button>
        </form>
      )}

      {lastAdg !== null && (
        <p style={{ marginTop: '1rem' }}>
          Daglig tillväxt (ADG): <strong>{lastAdg.toFixed(3)} kg/dag</strong>
        </p>
      )}

      {selected && selected.weights.length > 0 && (
        <>
          <h3 style={{ marginTop: '1.5rem' }}>Vikthistorik – {selected.name}</h3>
          <table>
            <thead>
              <tr><th>Datum</th><th>Vikt (kg)</th></tr>
            </thead>
            <tbody>
              {[...selected.weights]
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((w, i) => (
                  <tr key={i}><td>{w.date}</td><td>{w.kg}</td></tr>
                ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}
