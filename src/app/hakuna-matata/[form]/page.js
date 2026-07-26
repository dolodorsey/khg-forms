import { notFound } from 'next/navigation';
import PlatformInquiryForm from '../../../components/PlatformInquiryForm';
import { getActivePlatform } from '../../../lib/activePlatforms';

export default function HakunaMatataFormPage({ params }) {
  const platform = getActivePlatform('hakuna-matata');
  if (!platform.forms[params.form]) notFound();
  return <PlatformInquiryForm slug="hakuna-matata" platform={platform} formSlug={params.form} />;
}
