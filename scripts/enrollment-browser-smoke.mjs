import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {createServer} from 'vite';
const {chromium} = await import(pathToFileURL(process.env.MAYF_PLAYWRIGHT_MODULE).href);
const server = await createServer({server: {host: '127.0.0.1', port: 5125, strictPort: true}});
let browser;
try {
  await server.listen(); browser = await chromium.launch({headless: true});
  const page = await browser.newPage({viewport: {width: 1280, height: 900}});
  const errors = []; const orders = []; const sdkRequests = [];
  let checkoutEnabled = false;
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname === 'checkout.razorpay.com') sdkRequests.push(url.href);
    if (url.pathname.includes('/payments/create-order')) orders.push(url.href);
    if (url.hostname !== '127.0.0.1') return route.abort();
    if (url.pathname === '/api/annual-pass/config') return route.fulfill({contentType:'application/json', body:JSON.stringify({
      success:true, settings:{enabled:true,name:'Annual Pass',regularPrice:1999,salePrice:999,currency:'INR',durationDays:365,description:'Published learning resources',benefits:['Published study materials'],eligibleContent:[]},
      effectivePriceINR:999,taxRatePercentage:18,checkoutEnabled,
    })});
    if (url.pathname.startsWith('/api/')) return route.fulfill({status:503,contentType:'application/json',body:'{"error":"Isolated test"}'});
    return route.continue();
  });
  // Use the existing development-only preview login. No Google account, payment
  // credentials, real orders or live payment gateway is used in this test.
  await page.goto('http://127.0.0.1:5125/login');
  await page.getByRole('button',{name:'Close tour',exact:true}).click();
  await page.getByRole('button',{name:'Sign out / Switch account',exact:true}).click();
  await page.getByRole('button',{name:'Continue with Google',exact:true}).waitFor();
  await page.getByRole('link',{name:'Annual Pass & Syllabus Coverage',exact:true}).click();
  const enroll = page.getByRole('link',{name:'Enroll in Annual Pass for ₹999',exact:true});
  await enroll.waitFor();
  assert.equal(await page.getByText('Enrollment Currently Closed',{exact:true}).count(),0);
  assert.match(await enroll.getAttribute('href'), /^\/login\?returnTo=/);
  await enroll.click();
  await page.waitForURL('**/login?returnTo=*');
  assert.equal(new URL(page.url()).searchParams.get('returnTo'),'/checkout?plan=annual-pass');
  await page.getByText('Please log in to continue to checkout.',{exact:false}).waitFor();
  assert.equal(sdkRequests.length,0,'no SDK request before login');
  await page.getByRole('button',{name:'Email',exact:true}).click();
  await page.getByPlaceholder('student@example.com').fill('enrollment-preview@example.com');
  await page.getByRole('main').getByRole('button',{name:'Log In',exact:true}).click();
  await page.waitForURL('**/checkout?plan=annual-pass');
  await page.getByRole('heading',{name:'Activate Your Annual Pass',exact:true}).waitFor();
  await page.getByRole('button',{name:'Close tour',exact:true}).click();
  await page.getByText('Payments are temporarily unavailable.',{exact:false}).waitFor();
  assert.equal(sdkRequests.length,0,'globally paused checkout does not load the gateway');
  // Already signed in: enrollment goes straight to checkout and the payment
  // button becomes available when the mocked server permits checkout.
  checkoutEnabled = true;
  await page.getByRole('link',{name:'Annual Pass & Syllabus Coverage',exact:true}).click();
  await enroll.waitFor();
  assert.equal(await enroll.getAttribute('href'),'/checkout?plan=annual-pass');
  await enroll.click();
  await page.waitForURL('**/checkout?plan=annual-pass');
  await page.getByRole('button',{name:/Pay ₹1179/}).waitFor();
  assert.equal(await page.getByRole('button',{name:/Pay ₹1179/}).isEnabled(),true);
  // An already authenticated visitor opening a preserved login destination
  // bypasses the login screen, retaining the full selected checkout URL.
  checkoutEnabled = false;
  const destination='/checkout?plan=annual-pass&coupon=BOARD2026';
  await page.goto('http://127.0.0.1:5125/login?'+new URLSearchParams({returnTo:destination}));
  await page.waitForURL('**/checkout?plan=annual-pass&coupon=BOARD2026');
  await page.getByRole('heading',{name:'Activate Your Annual Pass',exact:true}).waitFor();
  assert.equal(orders.length,0,'navigation never creates an order or charges money');
  assert.deepEqual(errors,[]);
  console.log('PASS: public price, visitor enrollment/login/checkout, authenticated enrollment, coupon return, paused payment control and no automatic orders');
} finally {await browser?.close(); await server.close();}
