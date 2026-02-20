import { useState } from 'react';

export default function AddAnimalForm({ herd, updateHerd }) {
  const [form, setForm] = useState({
    id: '',
    name: '',
    birthDate: '',
    breed: '',
    targetDailyGainKg: '0.8',
  });

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.id || !form.name || !form.birthDate || !form.breed) return;

    if (herd.animals.some((a) => a.id === form.id)) {
      alert('Ett djur med detta ID finns redan.');
      return;
    }

    const animal = {
      id: form.id.trim(),
      name: form.name.trim(),
      birthDate: form.birthDate,
      breed: form.breed.trim(),
      targetDailyGainKg: parseFloat(form.targetDailyGainKg) || 0.8,
      weights: [],
    };

    updateHerd((prev) => ({ animals: [...prev.animals, animal] }));
    setForm({ id: '', name: '', birthDate: '', breed: '', targetDailyGainKg: '0.8' });
  };

  return (
    <section className="card">
      <h2>Lägg till nytt djur</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div>
            <label htmlFor="animal-id">ID-nummer</label>
            <input id="animal-id" value={form.id} onChange={set('id')} placeholder="t.ex. K001" required />
          </div>
          <div>
            <label htmlFor="animal-name">Namn</label>
            <input id="animal-name" value={form.name} onChange={set('name')} placeholder="t.ex. Bella" required />
          </div>
          <div>
            <label htmlFor="birth-date">Födelsedatum</label>
            <input id="birth-date" type="date" value={form.birthDate} onChange={set('birthDate')} required />
          </div>
          <div>
            <label htmlFor="breed">Ras</label>
            <input id="breed" value={form.breed} onChange={set('breed')} placeholder="t.ex. SRB" required />
          </div>
          <div>
            <label htmlFor="target-gain">Måltillväxt (kg/dag)</label>
            <input id="target-gain" type="number" step="0.01" min="0" value={form.targetDailyGainKg} onChange={set('targetDailyGainKg')} />
          </div>
        </div>
        <button type="submit">Lägg till</button>
      </form>

      {herd.animals.length > 0 && (
        <>
          <h3 style={{ marginTop: '1.5rem' }}>Registrerade djur ({herd.animals.length})</h3>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Namn</th>
                <th>Födelsedatum</th>
                <th>Ras</th>
                <th>Måltillväxt</th>
              </tr>
            </thead>
            <tbody>
              {herd.animals.map((a) => (
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td>{a.name}</td>
                  <td>{a.birthDate}</td>
                  <td>{a.breed}</td>
                  <td>{a.targetDailyGainKg} kg/dag</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}
