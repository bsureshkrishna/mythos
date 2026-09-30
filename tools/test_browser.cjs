/* Run: node tools/test_browser.cjs [path to an installed playwright package] */
const {chromium}=require(process.argv[2]||'playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'myths.json'),'utf8'));
const url=pathToFileURL(path.join(root,'index.html')).href;
const output=path.join(root,'tools','screenshots');
fs.mkdirSync(output,{recursive:true});

(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1080},reducedMotion:'reduce'});
  // All content, page turns and search must work without network access.
  await context.route(/^https?:/,route=>route.abort());
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const active=()=>page.locator('#bookHost .page:not([inert])');
  const hash=()=>page.evaluate(()=>location.hash);
  const go=async(fragment)=>{await page.evaluate(h=>location.hash=h,fragment);await page.waitForTimeout(30)};
  const key=async(k)=>{await page.keyboard.press(k);await page.waitForTimeout(100)};
  await page.goto(url);
  await page.waitForFunction(()=>document.querySelector('#bookHost .stf__parent'));
  assert.equal(await active().count(),1,'Only one page is interactive');
  await page.screenshot({path:path.join(output,'cover-desktop.png')});
  await active().getByRole('button',{name:'Begin with the Flood'}).click();
  assert.equal(await hash(),'#great-flood');
  await page.screenshot({path:path.join(output,'flood-desktop.png')});
  assert.match(await active().innerText(),/No\. 01/);
  await key('ArrowRight');assert.equal(await hash(),'#primordial-void');
  await key('ArrowLeft');assert.equal(await hash(),'#great-flood');
  await active().locator('[data-go="0/0"]').click();
  assert.equal(await hash(),'#great-flood/mesopotamian');
  await key('ArrowRight');assert.match(await hash(),/\/mesopotamian(?:\/\d+)?$/);
  assert.notEqual(await hash(),'#great-flood/mesopotamian');
  await key('ArrowLeft');assert.equal(await hash(),'#great-flood/mesopotamian');
  await active().locator('.also [data-go="0/1"]').click();
  assert.equal(await hash(),'#great-flood/indian');
  await key('ArrowUp');assert.equal(await hash(),'#great-flood');
  await key('ArrowDown');assert.equal(await hash(),'#great-flood/indian');
  await page.screenshot({path:path.join(output,'telling-desktop.png')});
  await page.goBack();await page.waitForTimeout(70);assert.equal(await hash(),'#great-flood');
  await page.goForward();await page.waitForTimeout(70);assert.equal(await hash(),'#great-flood/indian');
  await page.locator('#browseMode').click();
  assert.equal(await page.locator('.concept-card').count(),51);
  assert.equal(await page.locator('#bookView').isVisible(),false);
  await page.locator('.concept-card[data-index="50"]').click();
  assert.equal(await hash(),'#world-reborn');
  await page.locator('#tocBtn').click();
  await page.locator('[data-tab="cultures"]').click();
  await page.locator('[data-toc-culture="norse"]').click();
  assert.equal(await hash(),'#culture/norse');
  await key('ArrowRight');assert.match(await hash(),/\/norse$/);
  await page.locator('#search').fill('A1010');
  assert.match(await page.locator('#searchResults').innerText(),/Great Flood/);
  await page.locator('#search').press('Enter');assert.equal(await hash(),'#great-flood');
  await page.locator('#search').fill('zzzxxyynonexistent');
  assert.match(await page.locator('#searchResults').innerText(),/No matching/);
  await page.locator('#search').press('Escape');
  let tellings=0;
  for(const c of data.concepts){
   await go('#'+c.id);
   assert.equal(await active().count(),1,c.id+' has one interactive page');
   assert.equal(await active().locator('.concept-title').innerText(),c.title);
   assert.equal(await active().locator('.version-row').count(),c.versions.length);
   const perCulture={};
   for(const v of c.versions){
    const n=perCulture[v.culture]=(perCulture[v.culture]||0)+1;
    const fragment='#'+c.id+'/'+v.culture+(n>1?'/'+n:'');
    await go(fragment);
    assert.equal(await active().locator('.version-title').innerText(),v.title,fragment);
    assert.ok(await active().locator('.reading-links a').count(),fragment+' has a reading link');
    const content=await active().locator('.page-content').evaluate(el=>({width:el.clientWidth,scroll:el.scrollWidth}));
    assert.ok(content.scroll<=content.width+1,fragment+' does not overflow horizontally');
    tellings++;
   }
  }
  await go('#culture/slavic/end');assert.ok(await page.locator('#nextBtn').isDisabled());
  await go('#end');assert.ok(await page.locator('#nextBtn').isDisabled());
  await go('#');assert.ok(await page.locator('#prevBtn').isDisabled());
  await go('#%E0%A4%A');assert.equal(await active().locator('h1').innerText(),'Mythos');
  await page.setViewportSize({width:390,height:844});
  await go('#great-flood');
  await page.screenshot({path:path.join(output,'flood-mobile.png')});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await active().locator('[data-go="0/0"]').click();
  await active().locator('.page-content').evaluate(el=>el.scrollTop=el.scrollHeight);
  assert.ok(await active().locator('.reading-links a').first().isVisible());
  await page.screenshot({path:path.join(output,'telling-mobile.png')});
  await page.setViewportSize({width:320,height:640});
  await go('#great-flood');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'320px viewport does not overflow');
  assert.deepEqual(errors,[],'No browser exceptions');
  console.log(`PASS: 51 idea pages, ${tellings} tellings, two navigation levels, culture comparison, history, index, search, offline use and mobile widths.`);
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
