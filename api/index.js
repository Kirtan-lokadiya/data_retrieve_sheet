const express = require('express');
const { google } = require('googleapis');

const app = express();

// Function to extract spreadsheetId from URL
function extractSpreadsheetId(url) {
  const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Fetch data from Google Sheet
async function getSheetData(spreadsheetId) {
  const auth = new google.auth.GoogleAuth({
    keyFile: './credentials.json', // Path to credentials
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const range = 'Sheet1!A1:B4'; // Your data range

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  return response.data.values;
}

// API endpoint
app.get('/api/students', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ success: false, error: 'Please provide a Google Sheet URL' });
  }

  const spreadsheetId = extractSpreadsheetId(url);
  if (!spreadsheetId) {
    return res.status(400).json({ success: false, error: 'Invalid Google Sheet URL' });
  }

  try {
    const data = await getSheetData(spreadsheetId);
    const [headers, ...rows] = data;
    const formattedData = rows.map(row => ({
      [headers[0]]: row[0],
      [headers[1]]: row[1],
    }));
    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to fetch sheet data' });
  }
});

// Start server locally (only if not in Vercel environment)
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Export for Vercel
module.exports = app;