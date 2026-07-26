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

export default function RoseOnPiedmontDirectFormPage({ params }) {
  const formType = FORMS[params.form];
  if (!formType) notFound();

  return (
    <EventIntakeForm
      brandName="The Rose on Piedmont"
      brandKey="rose-on-piedmont"
      tableName="rose_on_piedmont_form_submissions"
      accent="#F2C76E"
      formType={formType}
    />
  );
}
