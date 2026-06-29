'use client';

import Image from 'next/image';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { loginApi } from '../../lib/api';
import { saveAuth } from '../../lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await loginApi(username, password);
      saveAuth(data.token, data.role, data.display_name);

      if (data.role === 'eo') {
        router.replace('/gate-scanner');
      } else {
        router.replace('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-100 px-4">
      <div className="card w-full max-w-sm bg-base-200 shadow-xl">
        <div className="card-body gap-6">
          {/* Logo */}
          <div className="flex flex-col items-center gap-2">
            <Image
              src="/images/logo.webp"
              alt="Family Gathering JSGI"
              width={80}
              height={80}
              style={{
                filter:
                  'brightness(1.15) drop-shadow(0 0 4px rgba(255,255,255,0.95)) drop-shadow(0 0 12px rgba(255,255,255,0.7))',
              }}
            />
            <p className="text-sm text-base-content/60 text-center leading-tight">
              Family Gathering System<br />
              <span className="text-xs">PT. JFE Steel Galvanizing Indonesia</span>
            </p>
          </div>

          <h2 className="text-xl font-bold text-center">Masuk</h2>

          {error && (
            <div className="alert alert-error py-2 text-sm">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="form-control">
              <label className="label pb-1">
                <span className="label-text">Username</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="form-control">
              <label className="label pb-1">
                <span className="label-text">Password</span>
              </label>
              <input
                type="password"
                className="input input-bordered"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              className={`btn btn-primary w-full mt-2${loading ? ' loading' : ''}`}
              disabled={loading}
            >
              {loading ? 'Masuk...' : 'Masuk'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
