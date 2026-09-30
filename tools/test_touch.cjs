const {chromium}=require(process.argv[2]||'playwright');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const url=pathToFileURL(path.resolve(__dirname,'../index.html')).href;
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await context.route(/^https?:/,r=>r.abort());
  const page=await context.newPage();
  await page.goto(url+'#great-flood');
  const active=()=>page.locator('#bookHost .page:not([inert])');
  await active().locator('.concept-title').waitFor();
  const cdp=await context.newCDPSession(page);
  async function gesture(x1,y1,x2,y2){
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x1,y:y1}]});
   for(let i=1;i<=6;i++){
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x1+(x2-x1)*i/6,y:y1+(y2-y1)*i/6}]});
    await page.waitForTimeout(20);
   }
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   await page.waitForTimeout(650);
  }
  await gesture(210,630,210,350);
  assert.ok(await active().locator('.page-content').evaluate(el=>el.scrollTop>50),'A vertical touch scrolls the page content');
  assert.equal(await page.evaluate(()=>location.hash),'#great-flood','Vertical scrolling does not turn the page');
  await active().locator('.page-content').evaluate(el=>el.scrollTop=0);
  await gesture(320,350,80,350);
  assert.equal(await page.evaluate(()=>location.hash),'#primordial-void','A horizontal touch turns one page');
  await page.locator('#prevBtn').tap();await page.waitForTimeout(650);
  assert.equal(await page.evaluate(()=>location.hash),'#great-flood','Animated Previous works');
  await page.locator('#nextBtn').tap();await page.waitForTimeout(650);
  assert.equal(await page.evaluate(()=>location.hash),'#primordial-void','Animated Next works');
  await page.locator('#prevBtn').tap();await page.waitForTimeout(650);
  const row=active().locator('.version-row').first(),box=await row.boundingBox();
  await gesture(box.x+box.width-25,box.y+12,box.x+25,box.y+12);
  assert.equal(await page.evaluate(()=>location.hash),'#primordial-void','Swiping a culture row turns without opening it');
  await page.locator('#prevBtn').tap();await page.waitForTimeout(650);
  await active().locator('.version-row').first().tap();
  assert.equal(await page.evaluate(()=>location.hash),'#great-flood/mesopotamian','Tapping a culture row opens its telling');
  console.log('PASS: vertical touch scrolling, horizontal swipes (including culture rows), control taps and animated Previous/Next.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
