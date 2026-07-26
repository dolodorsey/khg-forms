import PlatformLanding from '../../components/PlatformLanding';
import { getActivePlatform } from '../../lib/activePlatforms';

export const metadata = {
  title: 'The Tribe — Property, Community & Enterprise',
  description: 'Explore The Tribe campus initiative and submit property, tenant, community, vendor and employment inquiries.',
};

export default function TribePage() {
  return <PlatformLanding slug="tribe" platform={getActivePlatform('tribe')} />;
}
