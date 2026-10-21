'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function SettingsClient() {
  const router = useRouter();
  const [account, setAccount] = useState(null);
  const [profile, setProfile] = useState({ name: '', household_size: 1 });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [msg, setMsg] = useState({});

  useEffect(() => {
    api('/api/account').then(({ account: a }) => {
      setAccount(a);
      setProfile({ name: a.name, household_size: a.household_size });
    });
  }, []);

  async function saveProfile(e) {
    e.preventDefault();
    try {
      await api('/api/account', {
        method: 'PATCH',
        body: { name: profile.name, household_size: Number(profile.household_size) },
      });
      setMsg({ profile: '저장했어요.' });
      router.refresh();
    } catch (err) {
      setMsg({ profileError: err.message });
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    try {
      await api('/api/account', { method: 'PATCH', body: pw });
      setPw({ currentPassword: '', newPassword: '' });
      setMsg({ pw: '비밀번호를 바꿨어요.' });
    } catch (err) {
      setMsg({ pwError: err.message });
    }
  }

  async function logout() {
    await api('/api/auth/logout', { method: 'POST' });
    router.replace('/');
    router.refresh();
  }

  async function withdraw() {
    if (!confirm('탈퇴하면 등록한 물건과 교체 기록이 모두 사라져요. 정말 탈퇴할까요?')) return;
    await api('/api/account', { method: 'DELETE' });
    router.replace('/');
    router.refresh();
  }

  if (!account) return <div className="skeleton" style={{ height: 300, maxWidth: 680 }} />;

  return (
    <div className="page page-narrow">
      <header className="page-head">
        <div>
          <h1 className="page-title">설정</h1>
          <p className="page-sub">
            {account.email}, 물건 {account.item_count}개, 교체 기록 {account.log_count}건
          </p>
        </div>
      </header>

      <div style={{ display: 'grid', gap: 20 }}>
        <form className="panel panel-pad form" onSubmit={saveProfile}>
          <h2 className="panel-title">우리 집 정보</h2>
          <div className="form-row">
            <label className="field">
              <span>이름</span>
              <input
                className="input"
                value={profile.name}
                maxLength={20}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </label>
            <label className="field">
              <span>함께 사는 사람 수</span>
              <input
                className="input"
                type="number"
                min={1}
                max={10}
                value={profile.household_size}
                onChange={(e) => setProfile({ ...profile, household_size: e.target.value })}
              />
              <small>AI가 주기를 추천할 때 참고해요.</small>
            </label>
          </div>
          {msg.profileError && <p className="error">{msg.profileError}</p>}
          {msg.profile && <p className="notice">{msg.profile}</p>}
          <div>
            <button className="btn">저장</button>
          </div>
        </form>

        <form className="panel panel-pad form" onSubmit={savePassword}>
          <h2 className="panel-title">비밀번호 변경</h2>
          <div className="form-row">
            <label className="field">
              <span>현재 비밀번호</span>
              <input
                className="input"
                type="password"
                value={pw.currentPassword}
                autoComplete="current-password"
                onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
              />
            </label>
            <label className="field">
              <span>새 비밀번호</span>
              <input
                className="input"
                type="password"
                value={pw.newPassword}
                autoComplete="new-password"
                onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
              />
              <small>8자 이상</small>
            </label>
          </div>
          {msg.pwError && <p className="error">{msg.pwError}</p>}
          {msg.pw && <p className="notice">{msg.pw}</p>}
          <div>
            <button className="btn">비밀번호 바꾸기</button>
          </div>
        </form>

        <div className="panel panel-pad" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <button type="button" className="btn btn-line" onClick={logout}>
            로그아웃
          </button>
          <button type="button" className="btn btn-danger" onClick={withdraw}>
            회원 탈퇴
          </button>
        </div>
      </div>
    </div>
  );
}
