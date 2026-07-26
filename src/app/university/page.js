import PlatformLanding from '../../components/PlatformLanding';
import { getActivePlatform } from '../../lib/activePlatforms';

export const metadata = {
  title: 'The University — Trades, Entrepreneurship & Workforce',
  description: 'Explore The University workforce initiative and submit admissions, program, employer, instructor and campus inquiries.',
};

export default function UniversityPage() {
  return <PlatformLanding slug="university" platform={getActivePlatform('university')} />;
}
