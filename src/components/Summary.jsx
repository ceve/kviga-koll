import { computeAdg } from '../utils/calculations.js';

export default function Summary({ herd }) {
  const animals = herd.animals;
  const totalCount = animals.length;

  const withWeights = animals.filter((a) => a.weights.length > 0);
  const avgWeight = withWeights.length > 0
    ? withWeights.reduce((sum, a) => {
        const sorted = [...a.weights].sort((x, y) => x.date.localeCompare(y.date));
        return sum + sorted.at(-1).kg;
      }, 0) / withWeights.length
    : 0;

  const belowTarget = animals.filter((a) => {
    if (a.weights.length < 2) return false;
    const adg = computeAdg(a.weights);
    return adg !== null && adg < a.targetDailyGainKg;
  });

  return (
    <section className="card">
      <h2>Sammanfattning</h2>
      {totalCount === 0 ? (
        <p className="empty">Inga djur registrerade.</p>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat-box">
              <div className="value">{totalCount}</div>
              <div className="label">Antal djur</div>
            </div>
            <div className="stat-box">
              <div className="value">{avgWeight > 0 ? avgWeight.toFixed(1) : '–'}</div>
              <div className="label">Medelvikt (kg)</div>
            </div>
            <div className="stat-box">
              <div className="value">{belowTarget.length}</div>
              <div className="label">Under måltillväxt</div>
            </div>
          </div>

          {belowTarget.length > 0 && (
            <>
              <h3 style={{ marginTop: '1.5rem' }}>Djur under måltillväxt</h3>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Namn</th>
                    <th>ADG (kg/dag)</th>
                    <th>Mål (kg/dag)</th>
                  </tr>
                </thead>
                <tbody>
                  {belowTarget.map((a) => {
                    const adg = computeAdg(a.weights);
                    return (
                      <tr key={a.id}>
                        <td>{a.id}</td>
                        <td>{a.name}</td>
                        <td>{adg !== null ? adg.toFixed(3) : '–'}</td>
                        <td>{a.targetDailyGainKg}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}
        </>
      )}
    </section>
  );
}
