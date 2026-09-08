import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, saveSession } from '../lib/api';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const auth = await login(email, password);
      saveSession(auth);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#EEF3F5' }}>
      <form onSubmit={handleSubmit} style={{ width: 320, padding: 32, background: '#fff', borderRadius: 8, boxShadow: '0 2px 10px rgba(18,62,79,.1)' }}>
        <h1 style={{ fontSize: 20, color: '#123E4F', marginBottom: 4 }}>BizMind BD</h1>
        <p style={{ fontSize: 12, color: '#66798A', marginBottom: 20 }}>Sign in to your account</p>

        {error && (
          <div style={{ background: '#FBE4E4', color: '#D64545', fontSize: 12, padding: '8px 10px', borderRadius: 4, marginBottom: 12 }}>
            {error}
          </div>
        )}

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: '100%', padding: '9px 10px', marginBottom: 10, border: '1px solid #DCE3E8', borderRadius: 4, fontSize: 13 }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: '100%', padding: '9px 10px', marginBottom: 16, border: '1px solid #DCE3E8', borderRadius: 4, fontSize: 13 }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: 10, background: '#1E6E8C', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 'bold', fontSize: 13, cursor: 'pointer' }}
        >
          {loading ? 'Signing in…' : 'Log in'}
        </button>
      </form>
    </div>
  );
}
