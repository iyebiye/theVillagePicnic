const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const KEY_PATH = path.join(__dirname, 'service-account.json');
const KEY = JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'));

// const KEY = JSON.parse(process.env.GOOGLE_SA_KEY_JSON);
const SHEET_ID = process.env.SHEET_ID;
const SHEET_RANGE = 'Responses!A:D';

const jwtClient = new google.auth.JWT(
    KEY.client_email,
    null,
    KEY.private_key,
    ['https://www.googleapis.com/auth/spreadsheets']
);

async function appendRow(name, contact, color) {
    await jwtClient.authorize();
    const sheets = google.sheets({ version: 'v4', auth: jwtClient });
    const values = [[ new Date().toISOString(), name || '', contact || '', color || '' ]];
    return sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: SHEET_RANGE,
        valueInputOption: 'RAW',
        requestBody: { values }
    });
}

exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const body = JSON.parse(event.body || '{}');
        const { name, contact, color } = body;
        await appendRow(name, contact, color);

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            body: JSON.stringify({ success:true, message:'Saved' })
        };
    } catch (err) {
        console.error('append error', err);
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ success:false, error: err.message || String(err) })
        };
    }
};
