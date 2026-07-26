export const WATER_INQUIRY_META = {
  'bulk-water': { eyebrow: 'Commercial Water Supply', title: 'Bulk Water Request', description: 'Request raw, treated or potable water for commercial, industrial, agricultural or project use.', submit: 'Submit bulk water request' },
  municipal: { eyebrow: 'Public-Sector Supply', title: 'Municipal Inquiry', description: 'Start a conversation about municipal supply, emergency capacity, infrastructure support or long-term procurement.', submit: 'Submit municipal inquiry' },
  'data-centers': { eyebrow: 'Mission-Critical Infrastructure', title: 'Data Center Water Inquiry', description: 'Share cooling, make-up water, redundancy and delivery requirements for a data center or digital infrastructure project.', submit: 'Submit data center inquiry' },
  'private-label': { eyebrow: 'Packaged Water Programs', title: 'Private-Label Inquiry', description: 'Request sourcing, bottle formats, volume planning and fulfillment support for a branded packaged-water program.', submit: 'Submit private-label inquiry' },
  'emergency-supply': { eyebrow: 'Rapid Water Response', title: 'Emergency Supply Request', description: 'Request urgent water capacity for disaster response, outages, institutions, communities or commercial continuity.', submit: 'Submit emergency supply request' },
  distribution: { eyebrow: 'Channel Expansion', title: 'Distribution Inquiry', description: 'Apply to distribute, resell, transport or represent this brand and its products or supply services.', submit: 'Submit distribution inquiry' },
  partner: { eyebrow: 'Strategic Relationships', title: 'Partnership Inquiry', description: 'Propose a sourcing, infrastructure, logistics, bottling, investment or strategic operating partnership.', submit: 'Submit partnership inquiry' },
  wholesale: { eyebrow: 'Wholesale Programs', title: 'Wholesale Inquiry', description: 'Request case, pallet, truckload or recurring wholesale supply for retail, hospitality, events or institutional use.', submit: 'Submit wholesale inquiry' },
  hospitality: { eyebrow: 'Hotels, Restaurants & Nightlife', title: 'Hospitality Supply Inquiry', description: 'Request product placement, recurring supply or custom service for a hospitality venue or portfolio.', submit: 'Submit hospitality inquiry' },
  retail: { eyebrow: 'Retail Placement', title: 'Retail Inquiry', description: 'Request retail distribution, store placement, chain onboarding or regional product availability.', submit: 'Submit retail inquiry' },
  events: { eyebrow: 'Events & Activations', title: 'Event Supply Inquiry', description: 'Request product, branded hydration, sampling, vending or beverage support for an event or activation.', submit: 'Submit event inquiry' },
  sponsorship: { eyebrow: 'Brand Partnerships', title: 'Sponsorship Inquiry', description: 'Propose a sponsorship, sampling activation, cultural partnership or audience-development opportunity.', submit: 'Submit sponsorship inquiry' },
  'request-information': { eyebrow: 'Direct Inquiry', title: 'Request Information', description: 'Tell us what you are evaluating and the correct team will respond with the next step.', submit: 'Request information' },
};

const SOURCE_TYPES = ['bulk-water','municipal','data-centers','private-label','emergency-supply','distribution','partner','request-information'];
const CONSUMER_TYPES = ['wholesale','distribution','hospitality','retail','events','sponsorship','partner','request-information'];

export const ACTIVE_WATER_BRANDS = {
  'everyday-water-group': { name: 'EVERYDAY WATER GROUP', tableName: 'everyday_water_group_inquiries', source: 'everyday-water-group-direct-form', accent: '#45CDDD', inquiryTypes: SOURCE_TYPES },
  'nativa-waterworks': { name: 'NATIVA WATERWORKS', tableName: 'nativa_waterworks_inquiries', source: 'nativa-waterworks-direct-form', accent: '#7FD8C9', inquiryTypes: SOURCE_TYPES },
  'aquifer-waterworks': { name: 'AQUIFER WATERWORKS', tableName: 'aquifer_waterworks_inquiries', source: 'aquifer-waterworks-direct-form', accent: '#58B9E7', inquiryTypes: SOURCE_TYPES },
  'infinity-water': { name: 'INFINITY WATER', tableName: 'infinity_water_inquiries', source: 'infinity-water-direct-form', accent: '#C7A85B', inquiryTypes: CONSUMER_TYPES },
  'pronto-energy': { name: 'PRONTO ENERGY', tableName: 'pronto_energy_inquiries', source: 'pronto-energy-direct-form', accent: '#F5B942', inquiryTypes: CONSUMER_TYPES },
  'tribal-water': { name: 'TRIBAL WATER', tableName: 'tribal_water_inquiries', source: 'tribal-water-direct-form', accent: '#D18A4B', inquiryTypes: [...new Set([...SOURCE_TYPES, ...CONSUMER_TYPES])] },
};

export function getWaterBrand(slug) { return ACTIVE_WATER_BRANDS[slug] || null; }
export function isAllowedWaterInquiry(brand, inquiryType) { return Boolean(brand?.inquiryTypes.includes(inquiryType) && WATER_INQUIRY_META[inquiryType]); }
