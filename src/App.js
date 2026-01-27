import React, { useState, useEffect, useCallback, useRef } from 'react';

// Game constants matching your Python logic
const MODES = [
  { id: 1, name: "Basic Parity", desc: "Solve for C or P", bit: 0b00001 },
  { id: 2, name: "Combo", desc: "Solve for Spot (S)", bit: 0b00010 },
  { id: 3, name: "Straddle", desc: "C + P logic", bit: 0b00100 },
  { id: 4, name: "B/W", desc: "Buy/Write logic", bit: 0b01000 },
  { id: 5, name: "P&S", desc: "Protective Synthetic", bit: 0b10000 },
];

export default function PutCallGame() {
  const [gameState, setGameState] = useState('MENU'); 
  const [seconds, setSeconds] = useState(60);
  const [enabledModes, setEnabledModes] = useState(0x1F);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentProblem, setCurrentProblem] = useState(null);
  const [userInput, setUserInput] = useState("");
  const inputRef = useRef(null);

  // Core Math Logic from game.py
  const generatePrices = () => {
    const K = (Math.floor(Math.random() * (20 - 2 + 1)) + 2) * 5;
    const S = parseFloat((Math.random() * 20 - 10 + K).toFixed(2));
    const carry = parseFloat(Math.random().toFixed(2));
    const option_premium = parseFloat((Math.random() * 10 + 0.01).toFixed(2));

    let C, P;
    if (S + carry >= K) {
      C = parseFloat((S - K + carry + option_premium).toFixed(2));
      P = parseFloat((C - S + K - carry).toFixed(2));
    } else {
      P = parseFloat((K - S - carry + option_premium).toFixed(2));
      C = parseFloat((P + S - K + carry).toFixed(2));
    }
    return { K, S, carry, C, P };
  };

  const generateProblem = useCallback(() => {
    const prices = generatePrices();
    const activeModes = MODES.filter(m => (enabledModes & m.bit));
    const mode = activeModes[Math.floor(Math.random() * activeModes.length)];
    
    let vars = [];
    let answer = "";

    switch (mode.id) {
      case 1:
        if (Math.random() > 0.5) {
          vars = [['C', '?'], ['P', prices.P], ['S', prices.S], ['K', prices.K], ['r/c', prices.carry]];
          answer = prices.C.toString();
        } else {
          vars = [['C', prices.C], ['P', '?'], ['S', prices.S], ['K', prices.K], ['r/c', prices.carry]];
          answer = prices.P.toString();
        }
        break;
      case 2:
        const combo = parseFloat((prices.S - prices.K + prices.carry).toFixed(2));
        vars = [['Combo', combo], ['S', '?'], ['K', prices.K], ['r/c', prices.carry]];
        answer = prices.S.toString();
        break;
      case 3:
        const straddle = parseFloat((prices.C + prices.P).toFixed(2));
        if (Math.random() > 0.5) {
          vars = [['C', '?'], ['Straddle', straddle], ['S', prices.S], ['K', prices.K], ['r/c', prices.carry]];
          answer = prices.C.toString();
        } else {
          vars = [['P', '?'], ['Straddle', straddle], ['S', prices.S], ['K', prices.K], ['r/c', prices.carry]];
          answer = prices.P.toString();
        }
        break;
      case 4:
        const bw = parseFloat((prices.C + prices.K - prices.S).toFixed(2));
        vars = Math.random() > 0.5 
          ? [['C', '?'], ['B/W', bw], ['S', prices.S], ['K', prices.K]] 
          : [['P', '?'], ['B/W', bw], ['S', prices.S], ['K', prices.K]];
        answer = Math.random() > 0.5 ? prices.C.toString() : prices.P.toString();
        break;
      case 5:
        const ps = parseFloat((prices.P + prices.S - prices.K).toFixed(2));
        vars = Math.random() > 0.5 
          ? [['C', '?'], ['P&S', ps], ['S', prices.S], ['K', prices.K]] 
          : [['P', '?'], ['P&S', ps], ['S', prices.S], ['K', prices.K]];
        answer = Math.random() > 0.5 ? prices.C.toString() : prices.P.toString();
        break;
      default: break;
    }
    setCurrentProblem({ vars, answer });
    setUserInput("");
  }, [enabledModes]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(seconds);
    setGameState('PLAYING');
    generateProblem();
  };

  useEffect(() => {
    let timer;
    if (gameState === 'PLAYING' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && gameState === 'PLAYING') {
      setGameState('GAMEOVER');
    }
    return () => clearInterval(timer);
  }, [timeLeft, gameState]);

  useEffect(() => {
    if (currentProblem && userInput === currentProblem.answer) {
      setScore(s => s + 1);
      generateProblem();
    }
  }, [userInput, currentProblem, generateProblem]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {gameState === 'MENU' && (
          <div style={styles.centered}>
            <h1 style={styles.title}>Put-Call Parity</h1>
            <p style={styles.subtitle}>Test your options pricing speed.</p>
            <button style={styles.primaryBtn} onClick={() => setGameState('SETTINGS')}>Get Started</button>
          </div>
        )}

        {gameState === 'SETTINGS' && (
          <div>
            <h2 style={styles.sectionTitle}>Configuration</h2>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Duration (seconds)</label>
              <input 
                type="number" 
                value={seconds} 
                onChange={(e) => setSeconds(parseInt(e.target.value) || 0)}
                style={styles.textInput}
              />
            </div>
            <div style={styles.modeGrid}>
              {MODES.map(mode => (
                <div 
                  key={mode.id} 
                  onClick={() => setEnabledModes(prev => prev ^ mode.bit)}
                  style={{...styles.modeCard, borderColor: (enabledModes & mode.bit) ? '#4F46E5' : '#E5E7EB', backgroundColor: (enabledModes & mode.bit) ? '#F5F3FF' : '#FFF'}}
                >
                  <div style={styles.modeName}>{mode.name}</div>
                  <div style={styles.modeDesc}>{mode.desc}</div>
                </div>
              ))}
            </div>
            <button style={styles.primaryBtn} onClick={startGame}>Start Session</button>
          </div>
        )}

        {gameState === 'PLAYING' && (
          <div>
            <div style={styles.gameHeader}>
              <div style={styles.statBox}>
                <span style={styles.statLabel}>SCORE</span>
                <span style={styles.statValue}>{score}</span>
              </div>
              <div style={styles.statBox}>
                <span style={styles.statLabel}>TIME</span>
                <span style={{...styles.statValue, color: timeLeft < 10 ? '#EF4444' : '#111827'}}>{timeLeft}s</span>
              </div>
            </div>
            
            <div style={styles.problemGrid}>
              {currentProblem?.vars.map(([label, val]) => (
                <div key={label} style={styles.varRow}>
                  <span style={styles.varLabel}>{label}</span>
                  <span style={styles.varValue}>{val}</span>
                </div>
              ))}
            </div>

            <div style={styles.answerSection}>
              <input
                ref={inputRef}
                type="text"
                placeholder="Type answer..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                style={styles.answerInput}
                autoFocus
              />
            </div>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div style={styles.centered}>
            <div style={styles.iconCircle}>🎉</div>
            <h2 style={styles.title}>Session Complete</h2>
            <div style={styles.finalScore}>{score} <span style={{fontSize: '1rem'}}>correct</span></div>
            <button style={styles.primaryBtn} onClick={() => setGameState('MENU')}>Play Again</button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#F9FAFB',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: '480px',
    padding: '40px',
    borderRadius: '24px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  },
  centered: { textAlign: 'center' },
  title: { fontSize: '1.875rem', fontWeight: '800', color: '#111827', marginBottom: '8px' },
  subtitle: { color: '#6B7280', marginBottom: '32px' },
  sectionTitle: { fontSize: '1.25rem', fontWeight: '700', marginBottom: '24px' },
  primaryBtn: {
    width: '100%',
    backgroundColor: '#4F46E5',
    color: '#FFF',
    padding: '12px',
    borderRadius: '12px',
    border: 'none',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s',
    marginTop: '20px'
  },
  inputGroup: { marginBottom: '24px' },
  label: { display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '8px' },
  textInput: {
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #D1D5DB',
    boxSizing: 'border-box'
  },
  modeGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' },
  modeCard: {
    padding: '12px',
    borderRadius: '12px',
    border: '2px solid',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  modeName: { fontWeight: '600', fontSize: '0.9rem', color: '#111827' },
  modeDesc: { fontSize: '0.75rem', color: '#6B7280' },
  gameHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '40px' },
  statBox: { textAlign: 'center' },
  statLabel: { display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#9CA3AF', letterSpacing: '0.05em' },
  statValue: { fontSize: '1.5rem', fontWeight: '800' },
  problemGrid: { 
    backgroundColor: '#F3F4F6', 
    padding: '20px', 
    borderRadius: '16px', 
    marginBottom: '32px' 
  },
  varRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #E5E7EB' },
  varLabel: { fontWeight: '600', color: '#4B5563' },
  varValue: { color: '#111827', fontFamily: 'monospace', fontSize: '1.1rem' },
  answerSection: { textAlign: 'center' },
  answerInput: {
    width: '100%',
    fontSize: '1.5rem',
    textAlign: 'center',
    border: 'none',
    borderBottom: '3px solid #4F46E5',
    outline: 'none',
    padding: '8px',
    color: '#111827'
  },
  finalScore: { fontSize: '3rem', fontWeight: '800', color: '#4F46E5', margin: '20px 0' },
  iconCircle: { 
    fontSize: '3rem', 
    marginBottom: '20px', 
    display: 'inline-block', 
    background: '#EEF2FF', 
    padding: '20px', 
    borderRadius: '50%' 
  }
};