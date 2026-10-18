/* Read-only daily registry verification: no applicant data and no POST operations. */
import fs from 'node:fs';
const data=JSON.parse(fs.readFileSync('scripts/qa-forms-routes.json','utf8'));
const checks=data.routes.map(x=>({brand:x.brand_key,role:x.role_type}));
const endpoint='https://dzlmtvodpyhetvektfuo.supabase.co/functions/v1/khg-form-intake';
const failures=[];let pass=0;
for(let start=0;start<checks.length;start+=5){
 await Promise.all(checks.slice(start,start+5).map(async ({brand,role})=>{
   const url=endpoint+'?'+new URLSearchParams({brand_key:brand,role_type:role});
   for(let attempt=0;attempt<2;attempt++){
     try{
       const res=await fetch(url,{headers:{Origin:'https://forms.thekollectivehospitality.com',Accept:'application/json'},signal:AbortSignal.timeout(16000)});
       const payload=await res.json().catch(()=>({}));
       if(res.status===200 && payload.config?.brand_key===brand && payload.config?.role_type===role){pass++;return;}
       if(attempt===1)failures.push({brand,role,status:res.status,error:payload.error||'WRONG_CONFIG'});
     }catch(e){if(attempt===1)failures.push({brand,role,error:String(e)})}
   }
 }));
}
console.log('Daily form source check:',JSON.stringify({total:checks.length,verified:pass,failed:failures.length}));
for(const x of failures)console.error(JSON.stringify(x));
if(failures.length)process.exitCode=1;
