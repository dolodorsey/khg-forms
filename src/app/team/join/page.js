import './team-join.css';
import TeamOnboardingForm from '../../../components/TeamOnboardingForm';

export const metadata = {
  title: 'Join the team | The Kollective Hospitality Group',
  description: 'Teammate onboarding and NDA signing for The Kollective Hospitality Group.',
  robots: { index: false, follow: false },
};

export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function TeamJoinPage({ searchParams }) {
  const entity = typeof searchParams?.entity === 'string' ? searchParams.entity : '';
  const preview = typeof searchParams?.preview === 'string' ? searchParams.preview : '';
  const invite = typeof searchParams?.invite === 'string' && /^[0-9a-f]{32}$/.test(searchParams.invite) ? searchParams.invite : '';
  return <TeamOnboardingForm initialEntity={entity} previewKey={preview} inviteToken={invite} />;
}
