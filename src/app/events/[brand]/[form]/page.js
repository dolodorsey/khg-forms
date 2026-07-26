import { notFound } from 'next/navigation';
import EnterpriseEventForm from '../../../../components/EnterpriseEventForm';
import { getEventBrand, getEventFormType } from '../../../../lib/eventBrands';

export default function EnterpriseEventDirectFormPage({ params }) {
  const brand = getEventBrand(params.brand);
  const formType = getEventFormType(params.form);

  if (!brand || !formType) notFound();

  return (
    <EnterpriseEventForm
      brandName={brand.name}
      brandKey={params.brand}
      tableName={brand.tableName}
      accent={brand.accent}
      formType={formType}
    />
  );
}
