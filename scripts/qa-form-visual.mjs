import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

// Visual + validation testing against production. EVERY POST is intercepted; no data sent.
const focus = new Set(['members_elite','pasta_bish','sweet_tooth','mr_oyster','peace_pizza','american_dragon','ora','otini','casa_cantina','double_zero','tempo','nativa','tribal','prive','xxx','american_track_field','inner_circle','memory_machine','sole_exchange','good_times','sos','mission_365','luxe_on_demand','the_vote','bevco','casper','dr_dorsey','kollective','og','bodega','stush','fenyx','bare','maga','angel_wings','patty_daddy','taco_yaki','morning_after','mojo_juice','espresso_co']);
const rows=JSON.parse(fs.readFileSync('scripts/qa-forms-routes.json','utf8')).routes;
const shard=Number(process.env.QA_SHARD||0), total=Number(process.env.QA_TOTAL||1);
const work=rows.filter((_,i)=>i%total===shard);
const root='qa-results/shard-'+shard;
fs.mkdirSync(root,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const results=[];
for(const rec of work){
 const route='/f/'+rec.brand_key.replaceAll('_','-')+'/'+rec.role_type.replaceAll('_','-')+'?brand_key='+encodeURIComponent(rec.brand_key);
 const safe=rec.brand_key.replace(/[^a-z0-9_-]/g,'_')+'--'+rec.role_type.replace(/[^a-z0-9_-]/g,'_');
 const item={brand:rec.brand_key,role:rec.role_type,path:route,desktop:'pending',mobile:'pending',validation:'pending',filled_simulation:'not_run',errors:[]};
 for(const device of ['desktop','mobile']){
  const ctx=await browser.newContext({viewport:device==='desktop'?{width:1440,height:900}:{width:390,height:844},deviceScaleFactor:1,isMobile:device==='mobile',hasTouch:device==='mobile',reducedMotion:'reduce'});
  const page=await ctx.newPage();
  // Prevent ALL public form submissions, GHL webhooks, or uploads from being sent.
  await page.route('**/*',async routeReq=>{
    const req=routeReq.request();
    if(req.method()!=='GET' && req.method()!=='HEAD' && req.method()!=='OPTIONS') {
      if(req.url().includes('khg-form-intake') && req.method()==='POST') return routeReq.fulfill({status:201,contentType:'application/json',body:JSON.stringify(req.url().includes('action=upload')?{ok:true,file:{path:'qa/no-write-test.pdf'}}:{ok:true,submission_ref:'QA-SIMULATED-NO-WRITE',submission:{submission_ref:'QA-SIMULATED-NO-WRITE'}})});
      return routeReq.abort('blockedbyclient');
    }
    return routeReq.continue();
  });
  page.on('pageerror',e=>item.errors.push(device+' JS '+String(e).slice(0,250)));
  try{
   let response;
   for (let attempt=0;attempt<3;attempt++){
     try {
       response=await page.goto('https://forms.thekollectivehospitality.com'+route,{waitUntil:'domcontentloaded',timeout:20000});
       await page.locator('form').first().waitFor({state:'visible',timeout:15000});
       break;
     } catch(loadError) {
       if(attempt===2)throw loadError;
       await page.waitForTimeout(1200*(attempt+1));
     }
   }
   await page.locator('h1').first().waitFor({state:'visible',timeout:7000});
   await page.screenshot({path:path.join(root,safe+'--'+device+'.png'),fullPage:true,animations:'disabled'});
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+6);
   if(overflow)item.errors.push(device+' horizontal overflow');
   item[device]=response?.status()===200?'rendered':'http_'+response?.status();
   if(device==='desktop'){
     const api='https://dzlmtvodpyhetvektfuo.supabase.co/functions/v1/khg-form-intake?'+new URLSearchParams({brand_key:rec.brand_key,role_type:rec.role_type});
     const cfgResponse=await page.request.get(api,{headers:{Origin:'https://forms.thekollectivehospitality.com'},timeout:16000});
     const cfgPayload=await cfgResponse.json().catch(()=>({}));
     item.exact_key_check=cfgResponse.status()===200 && cfgPayload.config?.brand_key===rec.brand_key && cfgPayload.config?.role_type===rec.role_type ? 'pass':'failed';
     if(item.exact_key_check!=='pass')item.errors.push('exact key mismatch '+cfgResponse.status());
     const form=page.locator('form').first();
     const submit=form.locator('button[type=submit]').last();
     await submit.click({timeout:6000});
     await page.waitForTimeout(200);
     const banner=await page.getByText('Please complete the required fields.').count();
     item.validation=banner>0?'required_fields_rejected':'review_missing_client_banner';
     await page.screenshot({path:path.join(root,safe+'--validation.png'),fullPage:true,animations:'disabled'});
     if(true){ // All active forms receive isolated simulated fill; POST is intercepted above.
       try{
        const textInputs=form.locator('input:not([type=checkbox]):not([type=radio]):not([type=file]):not([tabindex="-1"])');
        const n=await textInputs.count();
        for(let i=0;i<n;i++){const el=textInputs.nth(i),type=await el.getAttribute('type');if(type==='hidden')continue;const samples={email:'qa-form-test@invalid.example',tel:'2025550110',url:'https://example.com/qa',number:'10',date:'2026-11-20','datetime-local':'2026-11-20T12:00',time:'12:00',month:'2026-11',week:'2026-W47',color:'#223366'};
         if(['hidden','range','file','submit','reset'].includes(type))continue;
         await el.fill(samples[type]||'QA sample only');}
        const ta=form.locator('textarea');for(let i=0;i<await ta.count();i++)await ta.nth(i).fill('QA automated browser simulation only - no personal or live business data.');
        const selects=form.locator('select');for(let i=0;i<await selects.count();i++){const sel=selects.nth(i);const opts=await sel.locator('option').evaluateAll(os=>os.map(o=>o.value).filter(Boolean));if(opts.length)await sel.selectOption(opts[0]);}
        const check=form.locator('input[type=checkbox]');for(let i=0;i<await check.count();i++)await check.nth(i).check({force:true});
        const cv=form.locator('canvas'); if(await cv.count()){const box=await cv.first().boundingBox();if(box){await page.mouse.move(box.x+40,box.y+50);await page.mouse.down();await page.mouse.move(box.x+160,box.y+70,{steps:10});await page.mouse.up();}}
        const fileInputs=form.locator('input[type=file]');for(let i=0;i<await fileInputs.count();i++){await fileInputs.nth(i).setInputFiles({name:'qa-placeholder.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4\n% QA synthetic file only\n%%EOF')}).catch(()=>{});}
        const chipButtons=form.locator('button[type=button]');const nn=await chipButtons.count();
        // Role multi-select chips: click choices; skip CLEAR SIGNATURE and next-step buttons.
        for(let i=0;i<Math.min(nn,28);i++){const b=chipButtons.nth(i);const txt=(await b.innerText()).trim().toLowerCase();if(/clear|back|next|upload|signature/.test(txt))continue;if(await b.isVisible())await b.click({force:true,timeout:1300}).catch(()=>{});}
        await submit.click({timeout:4500});
        await page.waitForTimeout(300);
        const receipt=await page.getByText('QA-SIMULATED-NO-WRITE',{exact:false}).count();
        item.filled_simulation=receipt>0?'mock_success_no_write':'validation_or_flow_review';
        await page.screenshot({path:path.join(root,safe+'--filled-simulation.png'),fullPage:true,animations:'disabled'});
       }catch(e){item.filled_simulation='error';item.errors.push('fill '+String(e).slice(0,230))}
     }
   }
  }catch(e){
   item[device]='failed';item.errors.push(device+' '+String(e).slice(0,250));
   await page.screenshot({path:path.join(root,safe+'--error.png'),fullPage:true}).catch(()=>{});
  }finally{await ctx.close();}
 }
 results.push(item);
 console.log(JSON.stringify({route,desktop:item.desktop,mobile:item.mobile,validation:item.validation,filled:item.filled_simulation,errors:item.errors.length}));
}
await browser.close();
fs.writeFileSync(path.join(root,'results.json'),JSON.stringify(results,null,2));
const failures=results.filter(x=>x.desktop!=='rendered'||x.mobile!=='rendered'||x.errors.length);
console.log('QA SUMMARY',JSON.stringify({shard,total:results.length,rendered:results.length-failures.length,failures:failures.length,validation:results.filter(x=>x.validation==='required_fields_rejected').length,mockedSuccess:results.filter(x=>x.filled_simulation==='mock_success_no_write').length}));
if(failures.length)process.exitCode=1;
