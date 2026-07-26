import { redirect } from 'next/navigation';

export default function LegacySOSFormRedirect({ params }) {
  const target = params.role === 'applicant'
    ? 'https://thesuperherosonstandby.com/become-a-hero'
    : 'https://thesuperherosonstandby.com';

  redirect(target);
}
