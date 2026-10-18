// Current-focus directory. Each brand and its intake remain independently identified.
// Public registration for THE VOTE is never collected here; link users to official state registration resources.
const BRANDS = [
  {
    "name": "American Track & Field",
    "slug": "american-track-field",
    "color": "#165DA8",
    "forms": [
      "athlete-tryouts",
      "coach-application",
      "athlete-agent",
      "franchise-owner",
      "sponsor",
      "venue-partner",
      "officials",
      "media",
      "fan-updates"
    ]
  },
  {
    "name": "Inner Circle",
    "slug": "inner-circle",
    "color": "#367D92",
    "forms": [
      "venue-partner",
      "revenue-assessment",
      "beverage-placement",
      "kitchen-partner",
      "sponsor"
    ]
  },
  {
    "name": "Memory Machine",
    "slug": "memory-machine",
    "color": "#BD8B43",
    "forms": [
      "sponsor",
      "venue-host",
      "event-booking",
      "support"
    ]
  },
  {
    "name": "Good Times",
    "slug": "good-times",
    "color": "#E0573B",
    "forms": [
      "venue-partner",
      "event-submission",
      "advertiser",
      "early-access",
      "ambassador"
    ]
  },
  {
    "name": "S.O.S. — Superheros On Standby",
    "slug": "sos",
    "color": "#3C6EB0",
    "forms": [
      "provider-onboarding",
      "early-access",
      "fleet-partner",
      "sponsor",
      "ambassador"
    ]
  },
  {
    "name": "Mission 365",
    "slug": "mission-365",
    "color": "#397A52",
    "forms": [
      "organizer",
      "business-sponsor",
      "donor-interest",
      "volunteer",
      "provider-onboarding"
    ]
  },
  {
    "name": "Luxe On Demand",
    "slug": "luxe-on-demand",
    "color": "#654C89",
    "forms": [
      "concierge-application",
      "customer-waitlist",
      "strategic-partner",
      "ambassador"
    ]
  },
  {
    "name": "THE VOTE",
    "slug": "the-vote",
    "color": "#496E96",
    "forms": [
      "civic-partner",
      "correction",
      "media"
    ]
  },
  {
    "name": "Sole Exchange",
    "slug": "sole-exchange",
    "color": "#347A54",
    "forms": [
      "shoe-donation",
      "pickup-request",
      "collection-host",
      "corporate-partner",
      "sponsor"
    ]
  },
  {
    "name": "BEVCO",
    "slug": "bevco",
    "color": "#267DB2",
    "forms": [
      "vendor",
      "venue-placement",
      "brand-sponsor"
    ]
  },
  {
    "name": "Casper Group",
    "slug": "casper",
    "color": "#B06C39",
    "forms": [
      "venue-kitchen-partner",
      "supplier",
      "catering-interest",
      "applicant"
    ]
  },
  {
    "name": "Angel Wings",
    "slug": "angel-wings",
    "color": "#A45C31",
    "forms": [
      "ambassador"
    ]
  },
  {
    "name": "Patty Daddy",
    "slug": "patty-daddy",
    "color": "#A45C31",
    "forms": [
      "ambassador"
    ]
  },
  {
    "name": "Taco Yaki",
    "slug": "taco-yaki",
    "color": "#A45C31",
    "forms": [
      "ambassador"
    ]
  },
  {
    "name": "The Morning After",
    "slug": "morning-after",
    "color": "#A45C31",
    "forms": [
      "ambassador"
    ]
  },
  {
    "name": "Mojo Juice",
    "slug": "mojo-juice",
    "color": "#A45C31",
    "forms": [
      "ambassador"
    ]
  },
  {
    "name": "Espresso Co",
    "slug": "espresso-co",
    "color": "#A45C31",
    "forms": [
      "ambassador",
      "inquiry",
      "wholesale",
      "sponsor"
    ]
  },
  {
    "name": "Dr. Dorsey",
    "slug": "dr-dorsey",
    "color": "#342A5C",
    "forms": [
      "speaking",
      "partnership",
      "press",
      "ambassador",
      "sponsor"
    ]
  },
  {
    "name": "The Kollective",
    "slug": "kollective",
    "color": "#303D66",
    "forms": [
      "investor",
      "sponsor",
      "strategic-partner",
      "general-inquiry",
      "applicant"
    ]
  },
  {
    "name": "OG",
    "slug": "og",
    "color": "#67418C",
    "forms": [
      "collaboration",
      "media-booking"
    ]
  }
];
const pretty = (s) => s.replaceAll('-', ' ').replace(/\b\w/g, x => x.toUpperCase());
export const metadata = {title:'KHG | Current Focus Forms', description:'Applications, sponsorships, partners and signups for active Kollective companies.'};
export default function FocusFormsDirectory(){
  return <main style={{minHeight:'100vh',background:'#F4F1EA',color:'#191919',fontFamily:'Inter,Arial,sans-serif',padding:'32px 18px 90px'}}>
    <div style={{maxWidth:1180,margin:'0 auto'}}>
      <a href="/" style={{color:'#6B6670',fontSize:12,textDecoration:'none',fontWeight:700}}>← All KHG Forms</a>
      <header style={{padding:'42px 0 24px',borderBottom:'1px solid #DAD5CC'}}>
        <div style={{fontSize:11,letterSpacing:3,fontWeight:800,color:'#7C6449'}}>THE KOLLECTIVE HOSPITALITY GROUP</div>
        <h1 style={{fontSize:'clamp(30px,5vw,52px)',letterSpacing:-2,lineHeight:1.05,margin:'13px 0'}}>Current Focus Forms</h1>
        <p style={{color:'#6B6670',fontSize:15,maxWidth:680,lineHeight:1.6}}>Brand-specific applications, venues, sponsors, partnerships, recruitment and community interest. Every submission keeps its company identity. A completed form is a request, not an approval, booking or contract.</p>
      </header>
      <section aria-label="Independent brand forms" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,310px),1fr))',gap:18,marginTop:24}}>
        {BRANDS.map(b=><article key={b.slug} style={{background:'#FFFFFF',border:'1px solid #DDD7CF',borderRadius:16,padding:22,boxShadow:'0 3px 14px rgba(30,20,5,.035)',borderTop:'4px solid '+b.color}}>
          <h2 style={{fontSize:19,margin:'0 0 10px',letterSpacing:-.3}}>{b.name}</h2>
          <a href={'/brand/'+b.slug} style={{fontSize:12,color:b.color,fontWeight:800,textDecoration:'none'}}>All {b.name} forms →</a>
          <nav aria-label={b.name+' forms'} style={{display:'flex',flexWrap:'wrap',gap:7,marginTop:16}}>
            {b.forms.map(role=><a key={role} href={'/f/'+b.slug+'/'+role} style={{display:'inline-block',padding:'9px 11px',border:'1px solid #E8E5E0',borderRadius:9,textDecoration:'none',fontSize:12,color:'#28282D',background:'#FAFAF8',fontWeight:600}}>{pretty(role)}</a>)}
          </nav>
        </article>)}
      </section>
      <footer style={{paddingTop:36,color:'#79736B',fontSize:12}}>This directory links to our configured form routes. Submission routing and brand-specific follow-ups are subject to operational verification.</footer>
    </div>
  </main>;
}
