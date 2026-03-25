// Backfill script: Geocode hospital addresses and store lat/lng into DB
// Usage: node backend/setup_geocode_hospitals.js

const db = require('./config/db');
const geo = require('./services/geoLocationService.service');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function backfill() {
  console.log('Starting hospital geocode backfill...');
  const [rows] = await db.execute(
    'SELECT h_id, h_name, h_address, h_lat, h_lng FROM hospitals ORDER BY h_id'
  );
  let updated = 0, skipped = 0, failed = 0;

  for (const h of rows) {
    try {
      if (h.h_lat && h.h_lng) { skipped++; continue; }
      const addr = h.h_address || '';
      if (!addr.trim()) { skipped++; continue; }

      const result = await geo.geocodeAddress(addr);
      if (!result) { failed++; continue; }

      const lat = Number(result.lat);
      const lng = Number(result.lng);
      await db.execute('UPDATE hospitals SET h_lat = ?, h_lng = ? WHERE h_id = ?', [lat, lng, h.h_id]);
      updated++;
      console.log(`✅ ${h.h_name} -> (${lat}, ${lng})`);

      // Be polite with Nominatim
      await sleep(Number(process.env.GEO_BACKFILL_DELAY_MS || 1200));
    } catch (e) {
      failed++;
      console.warn(`⚠️ Failed to geocode ${h.h_name}:`, e && e.message || e);
      await sleep(500);
    }
  }
  console.log(`Done. Updated: ${updated}, Skipped: ${skipped}, Failed: ${failed}`);
  process.exit(0);
}

backfill().catch(e => { console.error(e); process.exit(1); });
