import { notFound } from 'next/navigation';
import EventIntakeForm from '../../../components/EventIntakeForm';

const FORMS = {
  rsvp: 'rsvp',
  birthdays: 'birthday',
  birthday: 'birthday',
  vendor: 'vendor',
  vendors: 'vendor',
  tables: 'table',
  table: 'table',
  sponsor: 'sponsor',
  sponsorship: 'sponsor',
  media: 'media',
  press: 'media',
};

export default function GrownishDirectFormPage({ params }) {
  const formType = FORMS[params.form];
  if (!formType) notFound();

  return (
    <EventIntakeForm
      brandName="Grown-ish"
      brandKey="grownish"
      tableName="grownish_form_submissions"
      accent="#E89BFF"
      formType={formType}
    />
  );
}
