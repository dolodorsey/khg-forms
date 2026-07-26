import PlatformLanding from '../../components/PlatformLanding';
import { getActivePlatform } from '../../lib/activePlatforms';

export const metadata = {
  title: 'The Nation — Governance, Community & Enterprise',
  description: 'Learn about The Nation initiative and submit direct citizenship, membership, business, sponsorship and participation inquiries.',
};

export default function NationPage() {
  return <PlatformLanding slug="nation" platform={getActivePlatform('nation')} />;
}
