import LoginForm from '@/src/components/LoginForm';
import { Suspense } from 'react';

export const metadata = {
  title: 'Sign In – SEU SRR',
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
