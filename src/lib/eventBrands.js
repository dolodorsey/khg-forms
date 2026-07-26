export const EVENT_BRANDS = {
  'grown-ish': {
    name: 'Grown-ish',
    tableName: 'grownish_form_submissions',
    accent: '#E89BFF',
  },
  'rose-on-piedmont': {
    name: 'The Rose on Piedmont',
    tableName: 'rose_on_piedmont_form_submissions',
    accent: '#F2C76E',
  },
  'taste-of-art': {
    name: 'Taste of Art',
    tableName: 'taste_of_art_form_submissions',
    accent: '#FF8D5C',
  },
  noir: {
    name: 'NOIR',
    tableName: 'noir_form_submissions',
    accent: '#D7B56D',
  },
  remix: {
    name: 'REMIX',
    tableName: 'remix_form_submissions',
    accent: '#9DFFDF',
  },
  'wrst-bhvr': {
    name: 'WRST BHVR',
    tableName: 'wrst_bhvr_form_submissions',
    accent: '#FF5A5F',
  },
  'the-kulture': {
    name: 'The Kulture',
    tableName: 'the_kulture_form_submissions',
    accent: '#F0B74B',
  },
  paparazzi: {
    name: 'Paparazzi',
    tableName: 'paparazzi_form_submissions',
    accent: '#FF78C4',
  },
  'sundays-best': {
    name: 'Sundays Best',
    tableName: 'sundays_best_form_submissions',
    accent: '#F5D77A',
  },
  'gangsta-gospel': {
    name: 'Gangsta Gospel',
    tableName: 'gangsta_gospel_form_submissions',
    accent: '#C79BFF',
  },
  'beauty-and-the-beast': {
    name: 'Beauty & The Beast',
    tableName: 'beauty_and_the_beast_form_submissions',
    accent: '#FF7BA7',
  },
  'cinco-de-drinko': {
    name: 'Cinco de Drinko',
    tableName: 'cinco_de_drinko_form_submissions',
    accent: '#62D66F',
  },
  'secret-society': {
    name: 'The Secret Society',
    tableName: 'secret_society_form_submissions',
    accent: '#C5A46D',
  },
  'parking-lot-pimpin': {
    name: 'Parking Lot Pimpin',
    tableName: 'parking_lot_pimpin_form_submissions',
    accent: '#68C9FF',
  },
  pawchella: {
    name: 'Pawchella',
    tableName: 'pawchella_form_submissions',
    accent: '#FFB86B',
  },
  stella: {
    name: 'Stella',
    tableName: 'stella_form_submissions',
    accent: '#EBA3FF',
  },
  'forever-futbol': {
    name: 'Forever Futbol',
    tableName: 'forever_futbol_form_submissions',
    accent: '#59D993',
  },
  huglife: {
    name: 'HugLife',
    tableName: 'huglife_event_form_submissions',
    accent: '#FF7548',
  },
  'soul-sessions': {
    name: 'Soul Sessions',
    tableName: 'soul_sessions_form_submissions',
    accent: '#D8A8FF',
  },
  'black-ball': {
    name: 'Black Ball',
    tableName: 'black_ball_form_submissions',
    accent: '#D1B26F',
  },
  'underground-king': {
    name: 'Underground King',
    tableName: 'underground_king_form_submissions',
    accent: '#FF6A54',
  },
  cravings: {
    name: 'Cravings',
    tableName: 'cravings_form_submissions',
    accent: '#FF9C66',
  },
  'diaspora-atl': {
    name: 'Diaspora ATL',
    tableName: 'diaspora_atl_form_submissions',
    accent: '#F5B83D',
  },
  'freedom-fest': {
    name: 'Freedom Fest',
    tableName: 'freedom_fest_form_submissions',
    accent: '#FF6B5D',
  },
};

export const EVENT_FORM_TYPES = {
  rsvp: 'rsvp',
  birthday: 'birthday',
  birthdays: 'birthday',
  vendor: 'vendor',
  vendors: 'vendor',
  table: 'table',
  tables: 'table',
  sponsor: 'sponsor',
  sponsorship: 'sponsor',
  media: 'media',
  press: 'media',
  volunteer: 'volunteer',
  volunteers: 'volunteer',
  perform: 'perform',
  performer: 'perform',
  performers: 'perform',
};

export function getEventBrand(slug) {
  return EVENT_BRANDS[slug] || null;
}

export function getEventFormType(slug) {
  return EVENT_FORM_TYPES[slug] || null;
}
