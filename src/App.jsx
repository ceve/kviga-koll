import { useState, useEffect, useCallback } from 'react';
import { loadHerd, saveHerd } from './utils/storage.js';
import AddAnimalForm from './components/AddAnimalForm.jsx';
import LogWeight from './components/LogWeight.jsx';
import DueTasks from './components/DueTasks.jsx';
import FeedPlan from './components/FeedPlan.jsx';
import Summary from './components/Summary.jsx';

const TABS = [
  { key: 'add', label: 'Lägg till djur' },
  { key: 'weight', label: 'Registrera vikt' },
  { key: 'tasks', label: 'Kommande uppgifter' },
  { key: 'feed', label: 'Foderplan' },
  { key: 'summary', label: 'Sammanfattning' },
];

export default function App() {
  const [herd, setHerd] = useState(() => loadHerd());
  const [tab, setTab] = useState('add');

  useEffect(() => {
    saveHerd(herd);
  }, [herd]);

  const updateHerd = useCallback((updater) => {
    setHerd((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return { ...next };
    });
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Kviga-Koll</h1>
        <span>Kviguppföljning</span>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={tab === t.key ? 'active' : ''}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'add' && <AddAnimalForm herd={herd} updateHerd={updateHerd} />}
      {tab === 'weight' && <LogWeight herd={herd} updateHerd={updateHerd} />}
      {tab === 'tasks' && <DueTasks herd={herd} />}
      {tab === 'feed' && <FeedPlan herd={herd} />}
      {tab === 'summary' && <Summary herd={herd} />}
    </div>
  );
}
