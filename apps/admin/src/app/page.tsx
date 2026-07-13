import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to dashboard (login check happens in middleware)
  redirect('/dashboard');
}
