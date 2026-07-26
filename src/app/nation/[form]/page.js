import { notFound } from 'next/navigation';
import PlatformInquiryForm from '../../../components/PlatformInquiryForm';
import { getActivePlatform } from '../../../lib/activePlatforms';

export default function NationFormPage({ params }) {
  const platform = getActivePlatform('nation');
  if (!platform.forms[params.form]) notFound();
  return <PlatformInquiryForm slug="nation" platform={platform} formSlug={params.form} />;
}
