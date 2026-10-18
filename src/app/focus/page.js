// Current-focus directory. Each brand and its intake remain independently identified.
// Public registration for THE VOTE is never collected here; link users to official state registration resources.
const BRANDS = [
  {
    "name": "American Track & Field",
    "slug": "american-track-field",
    "color": "#165DA8",
    "forms": [
      "athlete-agent",
      "athlete-tryouts",
      "coach-application",
      "fan-updates",
      "franchise-owner",
      "media",
      "officials",
      "sponsor",
      "venue-partner"
    ]
  },
  {
    "name": "Inner Circle",
    "slug": "inner-circle",
    "color": "#367D92",
    "forms": [
      "beverage-placement",
      "kitchen-partner",
      "revenue-assessment",
      "sponsor",
      "venue-partner"
    ]
  },
  {
    "name": "Memory Machine",
    "slug": "memory-machine",
    "color": "#BD8B43",
    "forms": [
      "event-booking",
      "sponsor",
      "support",
      "venue-host"
    ]
  },
  {
    "name": "Good Times",
    "slug": "good-times",
    "color": "#E0573B",
    "forms": [
      "advertiser",
      "ambassador",
      "blogger",
      "early-access",
      "event-submission",
      "host",
      "influencer",
      "model",
      "nda",
      "podcast",
      "promoter",
      "provider-onboarding",
      "venue-partner"
    ]
  },
  {
    "name": "S.O.S. — Superheros On Standby",
    "slug": "sos",
    "color": "#3C6EB0",
    "forms": [
      "ambassador",
      "early-access",
      "fleet-partner",
      "provider-onboarding",
      "sponsor"
    ]
  },
  {
    "name": "Mission 365",
    "slug": "mission-365",
    "color": "#397A52",
    "forms": [
      "ambassador",
      "business-sponsor",
      "donor-interest",
      "organizer",
      "provider-onboarding",
      "volunteer"
    ]
  },
  {
    "name": "Luxe On Demand",
    "slug": "luxe-on-demand",
    "color": "#654C89",
    "forms": [
      "ambassador",
      "concierge-application",
      "customer-waitlist",
      "strategic-partner"
    ]
  },
  {
    "name": "THE VOTE",
    "slug": "the-vote",
    "color": "#496E96",
    "forms": [
      "ambassador",
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
      "ambassador",
      "blogger",
      "collection-host",
      "corporate-partner",
      "dj",
      "nda",
      "pickup-request",
      "shoe-donation",
      "sponsor",
      "vendor",
      "volunteer"
    ]
  },
  {
    "name": "BEVCO",
    "slug": "bevco",
    "color": "#267DB2",
    "forms": [
      "brand-sponsor",
      "vendor",
      "venue-placement"
    ]
  },
  {
    "name": "Casper Group",
    "slug": "casper",
    "color": "#B06C39",
    "forms": [
      "applicant",
      "catering-interest",
      "nda",
      "supplier",
      "venue-kitchen-partner"
    ]
  },
  {
    "name": "Angel Wings",
    "slug": "angel-wings",
    "color": "#A45C31",
    "forms": [
      "ambassador",
      "catering",
      "general-inquiry",
      "venue-partner"
    ]
  },
  {
    "name": "Patty Daddy",
    "slug": "patty-daddy",
    "color": "#A45C31",
    "forms": [
      "ambassador",
      "catering",
      "general-inquiry",
      "venue-partner"
    ]
  },
  {
    "name": "Taco Yaki",
    "slug": "taco-yaki",
    "color": "#A45C31",
    "forms": [
      "ambassador",
      "catering",
      "general-inquiry",
      "venue-partner"
    ]
  },
  {
    "name": "The Morning After",
    "slug": "morning-after",
    "color": "#A45C31",
    "forms": [
      "ambassador",
      "catering",
      "general-inquiry",
      "venue-partner"
    ]
  },
  {
    "name": "Mojo Juice",
    "slug": "mojo-juice",
    "color": "#A45C31",
    "forms": [
      "ambassador",
      "catering",
      "customer-support",
      "distributor",
      "event-activation",
      "general-inquiry",
      "inquiry",
      "retail-stockist",
      "sponsor",
      "vendor",
      "venue-partner",
      "wholesale"
    ]
  },
  {
    "name": "Espresso Co",
    "slug": "espresso-co",
    "color": "#A45C31",
    "forms": [
      "ambassador",
      "catering",
      "customer-support",
      "distributor",
      "event-activation",
      "general-inquiry",
      "inquiry",
      "retail-stockist",
      "sponsor",
      "vendor",
      "venue-partner",
      "wholesale"
    ]
  },
  {
    "name": "Dr. Dorsey",
    "slug": "dr-dorsey",
    "color": "#342A5C",
    "forms": [
      "ambassador",
      "applicant",
      "influencer",
      "intern",
      "nda",
      "partnership",
      "press",
      "speaking",
      "sponsor",
      "vendor"
    ]
  },
  {
    "name": "The Kollective",
    "slug": "kollective",
    "color": "#303D66",
    "forms": [
      "applicant",
      "general-inquiry",
      "intern",
      "investor",
      "nda",
      "sponsor",
      "strategic-partner"
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
  },
  {
    "name": "Member's Elite",
    "slug": "members-elite",
    "color": "#384BA1",
    "forms": [
      "ambassador",
      "media",
      "mens-5v5",
      "mens-combo",
      "officials",
      "sponsor",
      "team-captain",
      "vendor",
      "venue-partner",
      "womens",
      "youth"
    ]
  },
  {
    "name": "FĚNYX",
    "slug": "fenyx",
    "color": "#8F4EB5",
    "forms": [
      "ambassador",
      "athlete-network",
      "general-inquiry",
      "model",
      "sponsor",
      "wholesale"
    ]
  },
  {
    "name": "Pasta Bish",
    "slug": "pasta-bish",
    "color": "#A65D39",
    "forms": [
      "ambassador",
      "catering",
      "general-inquiry",
      "venue-partner"
    ]
  },
  {
    "name": "Sweet Tooth",
    "slug": "sweet-tooth",
    "color": "#A65D39",
    "forms": [
      "ambassador",
      "catering",
      "general-inquiry",
      "venue-partner"
    ]
  },
  {
    "name": "Mr. Oyster",
    "slug": "mr-oyster",
    "color": "#A65D39",
    "forms": [
      "ambassador",
      "catering",
      "general-inquiry",
      "venue-partner"
    ]
  },
  {
    "name": "Peace Pizza",
    "slug": "peace-pizza",
    "color": "#A65D39",
    "forms": [
      "ambassador",
      "catering",
      "general-inquiry",
      "venue-partner"
    ]
  },
  {
    "name": "ORA",
    "slug": "ora",
    "color": "#2877A5",
    "forms": [
      "distributor",
      "inquiry",
      "sponsor",
      "wholesale"
    ]
  },
  {
    "name": "OTINI",
    "slug": "otini",
    "color": "#2877A5",
    "forms": [
      "distributor",
      "inquiry",
      "sponsor",
      "wholesale"
    ]
  },
  {
    "name": "Casa Cantina",
    "slug": "casa-cantina",
    "color": "#2877A5",
    "forms": [
      "distributor",
      "inquiry",
      "sponsor",
      "wholesale"
    ]
  },
  {
    "name": "Double Zero",
    "slug": "double-zero",
    "color": "#2877A5",
    "forms": [
      "distributor",
      "inquiry",
      "sponsor",
      "wholesale"
    ]
  },
  {
    "name": "Tempo",
    "slug": "tempo",
    "color": "#2877A5",
    "forms": [
      "distributor",
      "inquiry",
      "sponsor",
      "wholesale"
    ]
  },
  {
    "name": "Nativa",
    "slug": "nativa",
    "color": "#2877A5",
    "forms": [
      "distributor",
      "inquiry",
      "sponsor",
      "wholesale"
    ]
  },
  {
    "name": "Tribal",
    "slug": "tribal",
    "color": "#2877A5",
    "forms": [
      "distributor",
      "inquiry",
      "sponsor",
      "wholesale"
    ]
  },
  {
    "name": "Privé",
    "slug": "prive",
    "color": "#2877A5",
    "forms": [
      "distributor",
      "inquiry",
      "sponsor",
      "wholesale"
    ]
  },
  {
    "name": "XXX",
    "slug": "xxx",
    "color": "#2877A5",
    "forms": [
      "distributor",
      "inquiry",
      "sponsor",
      "wholesale"
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
