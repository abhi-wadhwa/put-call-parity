import React, { useState, useEffect, useCallback, useRef } from 'react';

// Game constants matching your Python logic
const MODES = [
  { id: 1, name: "Simple Put-Call Parity", bit: 0b00001 },
  { id: 2, name: "Combo Questions", bit: 0b00010 },
  { id: 3, name: "Straddle Questions", bit: 0b00100 },
  { id: 4, name: "B/W Questions", bit: 0b01000 },
  { id: 5, name: "P&S Questions", bit: 0b10000 },
];

export default function PutCallGame() {
  const [gameState, setGameState] = useState('MENU'); // MENU, SETTINGS, PLAYING, GAMEOVER
  const [seconds, setSeconds] = useState(60);
  const [enabledModes, setEnabledModes] = useState(0x1F);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentProblem, setCurrentProblem] = useState(null);
  const [userInput, setUserInput] = useState("");
  const inputRef = useRef(null);

  // Logic: Generate Prices (Matching your Python generate_prices)
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

  // Logic: Generate Problem (Matching your Python generate_problem)
  const generateProblem = useCallback(() => {
    const prices = generatePrices();
    const activeModes = MODES.filter(m => (enabledModes & m.bit));
    const mode = activeModes[Math.floor(Math.random() * activeModes.length)];
    
    let question = "";
    let answer = "";

    switch (mode.id) {
      case 1: // Basic
        if (Math.random() > 0.5) {
          question = `C = ?\nP = ${prices.P}\nS = ${prices.S}\nK = ${prices.K}\nr/c = ${prices.carry}`;
          answer = prices.C.toString();
        } else {
          question = `C = ${prices.C}\nP = ?\nS = ${prices.S}\nK = ${prices.K}\nr/c = ${prices.carry}`;
          answer = prices.P.toString();
        }
        break;
      case 2: // Combo
        const combo = parseFloat((prices.S - prices.K + prices.carry).toFixed(2));
        question = `Combo = ${combo}\nS = ?\nK = ${prices.K}\nr/c = ${prices.carry}`;
        answer = prices.S.toString();
        break;
      case 3: // Straddle
        const straddle = parseFloat((prices.C + prices.P).toFixed(2));
        if (Math.random() > 0.5) {
          question = `C = ?\nStraddle = ${straddle}\nS = ${prices.S}\nK = ${prices.K}\nr/c = ${prices.carry}`;
          answer = prices.C.toString();
        } else {
          question = `P = ?\nStraddle = ${straddle}\nS = ${prices.S}\nK = ${prices.K}\nr/c = ${prices.carry}`;
          answer = prices.P.toString();
        }
        break;
      case 4: // B/W
        const bw = parseFloat((prices.C + prices.K - prices.S).toFixed(2));
        if (Math.random() > 0.5) {
          question = `C = ?\nB/W = ${bw}\nS = ${prices.S}\nK = ${prices.K}\nr/c = ${prices.carry}`;
          answer = prices.C.toString();
        } else {
          question = `P = ?\nB/W = ${bw}\nS = ${prices.S}\nK = ${prices.K}\nr/c = ${prices.carry}`;
          answer = prices.P.toString();
        }
        break;
      case 5: // P&S
        const ps = parseFloat((prices.P + prices.S - prices.K).toFixed(2));
        if (Math.random() > 0.5) {
          question = `C = ?\nP&S = ${ps}\nS = ${prices.S}\nK = ${prices.K}\nr/c = ${prices.carry}`;
          answer = prices.C.toString();
        } else {
          question = `P = ?\nP&S = ${ps}\nS = ${prices.S}\nK = ${prices.K}\nr/c = ${prices.carry}`;
          answer = prices.P.toString();
        }
        break;
      default: break;
    }
    setCurrentProblem({ question, answer });
    setUserInput("");
  }, [enabledModes]);

  // Start Game
  const startGame = () => {
    setScore(0);
    setTimeLeft(seconds);
    setGameState('PLAYING');
    generateProblem();
  };

  // Timer Effect
  useEffect(() => {
    let timer;
    if (gameState === 'PLAYING' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && gameState === 'PLAYING') {
      setGameState('GAMEOVER');
    }
    return () => clearInterval(timer);
  }, [timeLeft, gameState]);

  // Input Handler
  useEffect(() => {
    if (currentProblem && userInput === currentProblem.answer) {
      setScore(s => s + 1);
      generateProblem();
    }
  }, [userInput, currentProblem, generateProblem]);

  // Auto-focus input
  useEffect(() => {
    if (gameState === 'PLAYING' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameState]);

  return (
    <div style={styles.container}>
      <div style={styles.terminal}>
        {gameState === 'MENU' && (
          <div style={styles.content}>
            <h2>Welcome to Put-Call-Parity!</h2>
            <button style={styles.button} onClick={() => setGameState('SETTINGS')}>Press to Begin</button>
          </div>
        )}

        {gameState === 'SETTINGS' && (
          <div style={styles.content}>
            <p>Game Length (seconds):</p>
            <input 
              type="number" 
              value={seconds} 
              onChange={(e) => setSeconds(parseInt(e.target.value) || 0)}
              style={styles.input}
            />
            <div style={styles.modeList}>
              {MODES.map(mode => (
                <div key={mode.id} onClick={() => setEnabledModes(prev => prev ^ mode.bit)} style={styles.modeItem}>
                  [{ (enabledModes & mode.bit) ? 'X' : ' ' }] {mode.name}
                </div>
              ))}
            </div>
            <button style={styles.button} onClick={startGame}>Start Game (r)</button>
          </div>
        )}

        {gameState === 'PLAYING' && (
          <div style={styles.content}>
            <div style={styles.header}>
              <span>Time: {timeLeft}s</span>
              <span>Score: {score}</span>
            </div>
            <pre style={styles.question}>{currentProblem?.question}</pre>
            <div style={styles.answerArea}>
              <span>Answer: </span>
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                style={styles.gameInput}
                autoFocus
              />
            </div>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div style={styles.content}>
            <h1>GAME OVER</h1>
            <h2>Final Score: {score}</h2>
            <button style={styles.button} onClick={() => setGameState('MENU')}>Return to Menu (r)</button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#1a1a1a',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#00FF00',
    fontFamily: '"Courier New", Courier, monospace',
  },
  terminal: {
    width: '600px',
    height: '450px',
    border: '2px solid #00FF00',
    padding: '20px',
    backgroundColor: '#000',
    boxShadow: '0 0 15px rgba(0, 255, 0, 0.2)',
    position: 'relative',
    overflow: 'hidden'
  },
  content: { display: 'flex', flexDirection: 'column', gap: '15px' },
  button: {
    backgroundColor: 'transparent',
    color: '#00FF00',
    border: '1px solid #00FF00',
    padding: '10px',
    cursor: 'pointer',
    fontSize: '1.1rem',
    marginTop: '10px'
  },
  input: {
    backgroundColor: '#000',
    border: '1px solid #00FF00',
    color: '#00FF00',
    padding: '5px',
    fontSize: '1rem',
    width: '60px'
  },
  gameInput: {
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid #00FF00',
    color: '#00FF00',
    fontSize: '1.2rem',
    outline: 'none',
    width: '150px',
    marginLeft: '10px'
  },
  modeList: { textAlign: 'left', margin: '10px 0' },
  modeItem: { cursor: 'pointer', margin: '5px 0', userSelect: 'none' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '30px' },
  question: { fontSize: '1.2rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' },
  answerArea: { marginTop: '20px' }
};