# Google Sheets Attendance Setup

Use Google Sheets for the live attendance record. The app also keeps a local
browser backup in `localStorage` before it sends each row. The React frontend
sends attendance records to `/api/attendance`, which is a Vercel Serverless
Function. The backend API forwards attendance records to Google Sheets using the
private `GOOGLE_SHEETS_WEBHOOK_URL` environment variable.

The UI does not wait for Google Sheets before showing the guest map; sheet sync
runs in the background so check-in stays fast.

1. Create a Google Sheet and name the first tab `Attendance`.
2. In the sheet, open `Extensions > Apps Script`.
3. Paste this script:

```js
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Attendance');
  const data = JSON.parse(e.postData.contents);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Recorded At',
      'Event',
      'Guest ID',
      'Name',
      'Company',
      'Table',
      'Timezone',
    ]);
  }

  sheet.appendRow([
    data.recordedAt,
    data.event,
    data.guestId,
    data.name,
    data.company,
    data.table,
    data.timezone,
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

4. Click `Deploy > New deployment`.
5. Choose `Web app`.
6. Set `Execute as` to `Me`.
7. Set `Who has access` to `Anyone`.
8. Copy the web app URL.
9. Add the copied URL to Vercel as an environment variable:

```env
GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

10. Redeploy the Vercel project so the serverless API can read the new variable.

## Attendance Flow

```text
React frontend
  -> /api/attendance
  -> Google Sheets Apps Script webhook
  -> Attendance sheet
```

The browser still saves a `localStorage` backup before syncing. If Google Sheets
is not configured or the sync fails, the guest can still continue to the seat
map and staff can review the local backup later.

When developing locally with `npm run dev`, `/api/attendance` may not run because
Vite does not automatically start Vercel Serverless Functions. The route works
after deployment on Vercel. Use Vercel CLI only if local API testing is needed.

## Timestamp

`Recorded At` is sent in Malaysia time using this format:

```text
YYYY-MM-DD HH:mm:ss MYT
```

The local browser backup also keeps `recordedAtIso` as a UTC ISO timestamp for
debugging.

## Local Browser Backup

Every verified attendance record is saved first in the browser's `localStorage`
under this key:

```text
eventive-attendance-records
```

Local records use `sheetStatus` to show sync state:

```text
pending
sent
failed
not-configured
```

You can manage it in Chrome DevTools:

1. Open the app.
2. Right-click the page and choose `Inspect`.
3. Go to `Application > Local Storage > http://localhost:5173`.
4. Edit or delete `eventive-attendance-records`.

The app also exposes helper commands in the browser console:

```js
eventiveAttendance.list()
eventiveAttendance.delete('RECORD_ID')
eventiveAttendance.clear()
eventiveAttendance.replaceAll([])
```

To edit one record, list the records, change the array, then replace it:

```js
const records = eventiveAttendance.list()
records[0].name = 'Corrected Name'
eventiveAttendance.replaceAll(records)
```
