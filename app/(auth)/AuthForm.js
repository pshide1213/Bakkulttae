'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Brand from '@/components/Brand';
import { api } from '@/lib/api';

export default function AuthForm({ mode }) {
  const router = useRouter();
  const isSignup = mode === 'signup';
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api(isSignup ? '/api/auth/signup' : '/api/auth/login', { method: 'POST', body: form });
      router.replace(isSignup ? '/items/new' : '/dashboard');
      router.refresh();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-box">
        <Link href="/">
          <Brand />
        </Link>
        <h1>{isSignup ? '우리 집 목록 만들기' : '로그인'}</h1>
        <p className="lead">
          {isSignup ? '가입하면 바로 첫 품목을 등록할 수 있어요.' : '이메일과 비밀번호를 입력하세요.'}
        </p>
        <form className="form panel panel-pad" onSubmit={onSubmit} noValidate>
          {isSignup && (
            <label className="field">
              <span>이름</span>
              <input className="input" value={form.name} onChange={update('name')} maxLength={20} autoComplete="name" />
            </label>
          )}
          <label className="field">
            <span>이메일</span>
            <input className="input" type="email" value={form.email} onChange={update('email')} autoComplete="email" />
          </label>
          <label className="field">
            <span>비밀번호</span>
            <input
              className="input"
              type="password"
              value={form.password}
              onChange={update('password')}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
            />
            {isSignup && <small>8자 이상</small>}
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="btn btn-lg btn-leaf" disabled={loading}>
            {loading ? '잠시만요…' : isSignup ? '가입하기' : '로그인'}
          </button>
        </form>
        <p className="auth-switch">
          {isSignup ? '이미 계정이 있나요? ' : '처음이신가요? '}
          <Link href={isSignup ? '/login' : '/signup'} className="text-link">
            {isSignup ? '로그인' : '회원가입'}
          </Link>
        </p>
      </div>
    </main>
  );
}
