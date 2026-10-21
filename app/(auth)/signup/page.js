import AuthForm from '../AuthForm';

export const metadata = { title: '회원가입 — 바꿀때' };

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
