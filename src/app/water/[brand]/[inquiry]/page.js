import { notFound } from 'next/navigation';
import ActiveWaterInquiryForm from '../../../../components/ActiveWaterInquiryForm';
import { getWaterBrand, isAllowedWaterInquiry } from '../../../../lib/activeWaterBrands';

export default function ActiveWaterInquiryPage({ params }) {
  const brand = getWaterBrand(params.brand);
  if (!isAllowedWaterInquiry(brand, params.inquiry)) notFound();
  return <ActiveWaterInquiryForm brand={brand} inquiryType={params.inquiry} />;
}
