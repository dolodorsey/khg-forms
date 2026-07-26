import { redirect } from 'next/navigation';

const NOIR_FORMS = {
  rsvp: 'rsvp',
  birthday: 'birthday',
  birthdays: 'birthday',
  vendor: 'vendor',
  vendors: 'vendor',
  table: 'table_reservation',
  tables: 'table_reservation',
  sponsor: 'sponsor',
  sponsorship: 'sponsor',
  media: 'influencer',
  press: 'influencer',
  volunteer: 'volunteer',
  volunteers: 'volunteer',
  perform: 'artist_music',
  performer: 'artist_music',
  performers: 'artist_music',
};

export default function CanonicalNoirFormRedirect({ params }) {
  const form = NOIR_FORMS[params.form];
  redirect(form ? `https://noirworldwide.com/forms/${form}` : 'https://noirworldwide.com/forms');
}
