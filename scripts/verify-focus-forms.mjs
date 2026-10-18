/* Read-only verification. No applicant data is sent or created. */
const routes={
  "american_track_field": [
    "athlete_tryouts",
    "coach_application",
    "athlete_agent",
    "franchise_owner",
    "sponsor",
    "venue_partner",
    "officials",
    "media",
    "fan_updates"
  ],
  "inner_circle": [
    "venue_partner",
    "revenue_assessment",
    "beverage_placement",
    "kitchen_partner",
    "sponsor"
  ],
  "memory_machine": [
    "sponsor",
    "venue_host",
    "event_booking",
    "support"
  ],
  "good_times": [
    "venue_partner",
    "event_submission",
    "advertiser",
    "early_access"
  ],
  "sos": [
    "early_access",
    "fleet_partner",
    "sponsor"
  ],
  "mission_365": [
    "organizer",
    "business_sponsor",
    "donor_interest",
    "volunteer"
  ],
  "luxe_on_demand": [
    "customer_waitlist",
    "strategic_partner",
    "concierge_application"
  ],
  "the_vote": [
    "civic_partner",
    "correction",
    "media"
  ],
  "sole_exchange": [
    "shoe_donation",
    "pickup_request",
    "collection_host",
    "corporate_partner",
    "sponsor"
  ],
  "bevco": [
    "vendor",
    "venue_placement",
    "brand_sponsor"
  ],
  "casper": [
    "venue_kitchen_partner",
    "supplier",
    "catering_interest"
  ],
  "dr_dorsey": [
    "speaking",
    "partnership",
    "press"
  ],
  "kollective": [
    "investor",
    "sponsor",
    "strategic_partner",
    "general_inquiry"
  ],
  "og": [
    "collaboration",
    "media_booking"
  ]
};
const api='https://dzlmtvodpyhetvektfuo.supabase.co/functions/v1/khg-form-intake';
let ok=0,failures=[];
const checks=Object.entries(routes).flatMap(([brand,roles])=>roles.map(role=>({brand,role})));
for(let offset=0;offset<checks.length;offset+=5){
 await Promise.all(checks.slice(offset,offset+5).map(async ({brand,role})=>{
  const url=api+'?'+new URLSearchParams({brand_key:brand,role_type:role});
  try{
   const response=await fetch(url,{headers:{Origin:'https://forms.thekollectivehospitality.com',Accept:'application/json'},signal:AbortSignal.timeout(15000)});
   const data=await response.json().catch(()=>({}));
   if(response.status===200 && data.config?.brand_key===brand && data.config?.role_type===role){ok++}
   else failures.push({brand,role,status:response.status,error:data.error||'MISMATCH'});
  }catch(error){failures.push({brand,role,error:String(error)})}
 }));
}
console.log('Current focus form routes:',checks.length,'verified:',ok,'failed:',failures.length);
for(const x of failures)console.error(JSON.stringify(x));
if(failures.length)process.exitCode=1;
