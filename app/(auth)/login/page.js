import AuthForm from '../AuthForm';

export const metadata = { title: '로그인 — 바꿀때' };

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
