import { notFound } from 'next/navigation';
import WaterInquiryForm from '../../../components/WaterInquiryForm';

const INQUIRIES = new Set([
  'bulk-water',
  'municipal',
  'data-centers',
  'private-label',
  'emergency-supply',
  'distribution',
  'partner',
  'request-information',
]);

export default function EverydayWaterGroupInquiryPage({ params }) {
  if (!INQUIRIES.has(params.inquiry)) notFound();
  return <WaterInquiryForm inquiryType={params.inquiry} />;
}
