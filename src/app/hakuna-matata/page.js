import PlatformLanding from '../../components/PlatformLanding';
import { getActivePlatform } from '../../lib/activePlatforms';

export const metadata = {
  title: 'Hakuna Matata — The Book by Dr. Dorsey',
  description: 'Order Hakuna Matata or submit bulk-order, speaking, book-club and media inquiries.',
};

export default function HakunaMatataPage() {
  return <PlatformLanding slug="hakuna-matata" platform={getActivePlatform('hakuna-matata')} />;
}
