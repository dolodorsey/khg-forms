import { notFound } from 'next/navigation';
import PlatformInquiryForm from '../../../components/PlatformInquiryForm';
import { getActivePlatform } from '../../../lib/activePlatforms';

export default function TribeFormPage({ params }) {
  const platform = getActivePlatform('tribe');
  if (!platform.forms[params.form]) notFound();
  return <PlatformInquiryForm slug="tribe" platform={platform} formSlug={params.form} />;
}
