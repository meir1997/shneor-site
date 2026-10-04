const WORKSHOP = Object.freeze({
  id: 'hora-yael-2026-10-14', title: 'הורה יעיל', price: 80, capacity: 30,
  startsAt: '2026-10-14T21:30:00+03:00', reminderDate: '2026-10-13',
  checkout: 'https://www.paperless.tax/invoice?sID=f5lnDagHVYI_7AAX-6rk7Fu3RPaoeoaTzeeucwA86rQ0IMn-oUeEjQ'
});
const HEADERS = ['מזהה הרשמה', 'נרשם בתאריך', 'שם מלא', 'דוא״ל', 'טלפון',
  'סטטוס תשלום', 'סכום', 'מזהה עסקה', 'אישור שימוש בפרטים', 'קישור זום נשלח', 'הערה'];

function properties_() { return PropertiesService.getScriptProperties(); }
function sheet_() {
  const id = properties_().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('REGISTRATION_NOT_CONFIGURED');
  const sheet = SpreadsheetApp.openById(id).getSheetByName('נרשמים');
  if (!sheet || sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0].join('|') !== HEADERS.join('|')) {
    throw new Error('INVALID_REGISTRATION_SHEET');
  }
  return sheet;
}
function withLock_(callback) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { return callback(); } finally { lock.releaseLock(); }
}
function rows_(sheet) {
  return sheet.getLastRow() < 2 ? [] : sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.length).getValues();
}
function text_(value) {
  // Keep user input literal in Sheets, including names starting with formula characters.
  const text = String(value == null ? '' : value).trim();
  return /^[=+@\-]/.test(text) ? "'" + text : text;
}
function validateRegistration_(input) {
  const name = String(input.name || '').trim();
  const email = String(input.email || '').trim().toLowerCase();
  const phone = String(input.phone || '').replace(/[\s()-]/g, '').replace(/^\+972/, '0');
  if (name.length < 2 || name.length > 100 || /[\r\n<>]/.test(name)) throw new Error('INVALID_NAME');
  if (email.length > 200 || /^[=+\-]/.test(email) || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) throw new Error('INVALID_EMAIL');
  if (!/^0\d{8,9}$/.test(phone)) throw new Error('INVALID_PHONE');
  if (input.consent !== true || input.website) throw new Error('INVALID_CONSENT');
  if (!/^[a-f0-9-]{36}$/.test(String(input.requestId || ''))) throw new Error('INVALID_REQUEST');
  return { name, email, phone, requestId: input.requestId };
}

function doGet() {
  sheet_();
  const template = HtmlService.createTemplateFromFile('Registration');
  const nonce = Utilities.getUuid();
  CacheService.getScriptCache().put('form:' + nonce, '1', 1800);
  template.nonce = nonce;
  return template.evaluate().setTitle('הרשמה להורה יעיל')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function registerWorkshop(input) {
  const data = validateRegistration_(input || {});
  return withLock_(() => {
    const cache = CacheService.getScriptCache();
    if (!cache.get('form:' + String(input.nonce || ''))) throw new Error('FORM_EXPIRED');
    const sheet = sheet_();
    const rows = rows_(sheet);
    const existing = rows.find(row => row[0] === data.requestId);
    if (existing) {
      if (existing[3] !== data.email || existing[4] !== data.phone) throw new Error('INVALID_REQUEST');
      return { saved: true, checkout: WORKSHOP.checkout };
    }
    const paid = rows.filter(row => String(row[5]).startsWith('שולם')).length;
    if (paid >= WORKSHOP.capacity) throw new Error('SOLD_OUT');
    // A public form cannot read records; cap writes to contain abuse and quota usage.
    const today = Utilities.formatDate(new Date(), 'Asia/Jerusalem', 'yyyy-MM-dd');
    const todayCount = rows.filter(row => String(row[1]).startsWith(today)).length;
    if (rows.length >= 1000 || todayCount >= 100) throw new Error('TRY_LATER');
    const duplicate = rows.find(row => row[3] === data.email && row[4] === data.phone);
    if (!duplicate) {
      sheet.appendRow([data.requestId, Utilities.formatDate(new Date(), 'Asia/Jerusalem', "yyyy-MM-dd HH:mm:ss"),
        text_(data.name), data.email, text_(data.phone), 'ממתין לתשלום', WORKSHOP.price,
        '', 'כן', '', '']);
      SpreadsheetApp.flush();
    }
    return { saved: true, checkout: WORKSHOP.checkout };
  });
}

function validatePayment_(payload, settings) {
  if (!settings.key || !settings.pageKey || payload.webhookKey !== settings.key ||
      payload.purchasePageKey !== settings.pageKey) throw new Error('UNAUTHORIZED_WEBHOOK');
  if (Number(payload.paymentSum) !== WORKSHOP.price || Number(payload.amount) !== 1 ||
      !String(payload.transactionCode || '').trim()) throw new Error('INVALID_PAYMENT');
  const email = String(payload.payerEmail || '').trim().toLowerCase();
  const phone = String(payload.payerPhone || '').replace(/[\s()-]/g, '').replace(/^\+972/, '0');
  if (email.length > 200 || /^[=+\-]/.test(email) || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) || !/^0\d{8,9}$/.test(phone)) {
    throw new Error('INVALID_PAYMENT_CONTACT');
  }
  return { email, phone, transaction: String(payload.transactionCode).trim(), name: String(payload.fullName || '').slice(0, 100) };
}

function doPost(event) {
  // Only Grow's confirmed static-page webhook can mark a registration as paid.
  // Browser redirects and registration form parameters are never proof of payment.
  if (!event || !event.postData || event.postData.contents.length > 20000) throw new Error('INVALID_WEBHOOK');
  const payload = JSON.parse(event.postData.contents);
  const props = properties_();
  if (props.getProperty('GROW_WEBHOOK_ENABLED') !== 'true') throw new Error('WEBHOOK_DISABLED');
  const payment = validatePayment_(payload, { key: props.getProperty('GROW_WEBHOOK_KEY'), pageKey: props.getProperty('GROW_PAGE_KEY') });
  withLock_(() => {
    const sheet = sheet_();
    const rows = rows_(sheet);
    if (rows.some(row => String(row[7]) === payment.transaction)) return;
    const matches = rows.map((row, index) => ({ row, index })).filter(item =>
      item.row[3] === payment.email && item.row[4] === payment.phone && item.row[5] === 'ממתין לתשלום');
    if (matches.length === 1) {
      const row = matches[0].row;
      row[5] = 'שולם'; row[7] = text_(payment.transaction);
      sheet.getRange(matches[0].index + 2, 1, 1, HEADERS.length).setValues([row]);
    } else {
      sheet.appendRow([Utilities.getUuid(), Utilities.formatDate(new Date(), 'Asia/Jerusalem', 'yyyy-MM-dd HH:mm:ss'),
        text_(payment.name), payment.email, text_(payment.phone), 'שולם — לבדיקה', WORKSHOP.price,
        text_(payment.transaction), '', '', 'תשלום ללא התאמה יחידה לטופס ההרשמה']);
    }
    SpreadsheetApp.flush();
  });
  return ContentService.createTextOutput(JSON.stringify({ received: true })).setMimeType(ContentService.MimeType.JSON);
}

function sendZoomReminders_() {
  const props = properties_();
  if (props.getProperty('EMAIL_ENABLED') !== 'true') return;
  const zoom = props.getProperty('ZOOM_URL') || '';
  if (!/^https:\/\/[a-z0-9.-]*zoom\.us\/j\//i.test(zoom)) throw new Error('ZOOM_NOT_CONFIGURED');
  if (Utilities.formatDate(new Date(), 'Asia/Jerusalem', 'yyyy-MM-dd') !== WORKSHOP.reminderDate) return;
  withLock_(() => {
    const sheet = sheet_();
    rows_(sheet).forEach((row, index) => {
      if (row[5] !== 'שולם' || row[8] !== 'כן' || row[9]) return;
      // A failed send is left unsent so the next trigger can retry.
      MailApp.sendEmail({ to: row[3], subject: 'הורה יעיל — קישור לסדנה מחר ב־21:30',
        body: 'שלום,\nסדנת הורה יעיל תתקיים מחר, יום רביעי 14.10.2026, בשעה 21:30.\nקישור הזום:\n' + zoom + '\n\nלהתראות,\nשניאור רוכברגר',
        name: 'סדנת הורה יעיל', replyTo: 'shneori770@gmail.com' });
      sheet.getRange(index + 2, 10).setValue(Utilities.formatDate(new Date(), 'Asia/Jerusalem', 'yyyy-MM-dd HH:mm:ss'));
      SpreadsheetApp.flush();
    });
  });
}

function installReminderTrigger_() {
  if (properties_().getProperty('EMAIL_ENABLED') !== 'true') throw new Error('EMAIL_NOT_ENABLED');
  if (!ScriptApp.getProjectTriggers().some(trigger => trigger.getHandlerFunction() === 'sendZoomReminders_')) {
    ScriptApp.newTrigger('sendZoomReminders_').timeBased().everyHours(1).create();
  }
}
