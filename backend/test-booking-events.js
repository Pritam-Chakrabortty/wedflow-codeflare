const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testBookingEvents() {
  try {
    console.log('Getting bookings...');
    const bookingsResult = await pool.query('SELECT id, booking_number, client_id FROM bookings LIMIT 1');
    console.log('Bookings:', bookingsResult.rows);

    if (bookingsResult.rows.length > 0) {
      const bookingId = bookingsResult.rows[0].id;
      console.log('Booking ID:', bookingId);

      console.log('Getting event days for booking...');
      const eventsResult = await pool.query(
        'SELECT id, event_name, event_date, venue FROM booking_events WHERE booking_id = $1',
        [bookingId]
      );
      console.log('Event days for booking:', eventsResult.rows);
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

testBookingEvents();
