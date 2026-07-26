import { notFound } from 'next/navigation';
import ActiveWaterInquiryForm from '../../../components/ActiveWaterInquiryForm';
import { getWaterBrand, isAllowedWaterInquiry } from '../../../lib/activeWaterBrands';

export default function EverydayWaterGroupInquiryPage({ params }) {
  const brand = getWaterBrand('everyday-water-group');
  if (!isAllowedWaterInquiry(brand, params.inquiry)) notFound();
  return <ActiveWaterInquiryForm brand={brand} inquiryType={params.inquiry} />;
}
