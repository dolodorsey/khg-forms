import { notFound } from 'next/navigation';
import PlatformInquiryForm from '../../../components/PlatformInquiryForm';
import { getActivePlatform } from '../../../lib/activePlatforms';

export default function UniversityFormPage({ params }) {
  const platform = getActivePlatform('university');
  if (!platform.forms[params.form]) notFound();
  return <PlatformInquiryForm slug="university" platform={platform} formSlug={params.form} />;
}
