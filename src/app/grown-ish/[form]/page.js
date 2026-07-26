import { notFound } from 'next/navigation';
import EnterpriseEventForm from '../../../components/EnterpriseEventForm';

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
  volunteer: 'volunteer',
  volunteers: 'volunteer',
  perform: 'perform',
  performer: 'perform',
};

export default function GrownishDirectFormPage({ params }) {
  const formType = FORMS[params.form];
  if (!formType) notFound();

  return (
    <EnterpriseEventForm
      brandName="Grown-ish"
      brandKey="grown-ish"
      tableName="grownish_form_submissions"
      accent="#E89BFF"
      formType={formType}
    />
  );
}
