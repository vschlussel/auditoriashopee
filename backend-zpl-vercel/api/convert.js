// api/convert.js - Vercel Serverless Function
import fetch from 'node-fetch';
import formData from 'form-data';
import fs from 'fs';
import path from 'path';

const LABELIZE_API = process.env.LABELIZE_API || 'http://localhost:8000';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token,X-Requested-With,Accept,Accept-Version,Content-Length,Content-MD5,Content-Type,Date,X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { zplContent, format = 'png', dpmm = '8', width = '4', height = '6' } = req.body;

    if (!zplContent) {
      return res.status(400).json({ error: 'ZPL content is required' });
    }

    console.log('Converting ZPL...');
    console.log('DPI:', dpmm, 'Format:', format, 'Size:', `${width}x${height}`);

    const labelizeResponse = await fetch(`${LABELIZE_API}/render/${format}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'X-Label-Width': width,
        'X-Label-Height': height,
        'X-Density': dpmm
      },
      body: zplContent
    });

    if (!labelizeResponse.ok) {
      const error = await labelizeResponse.text();
      console.error('Labelize error:', error);
      return res.status(labelizeResponse.status).json({ 
        error: `Labelize error: ${labelizeResponse.status}`,
        details: error 
      });
    }

    const buffer = await labelizeResponse.buffer();
    const base64 = buffer.toString('base64');
    const mimeType = format === 'pdf' ? 'application/pdf' : 'image/png';

    return res.status(200).json({
      success: true,
      data: `data:${mimeType};base64,${base64}`,
      format: format
    });

  } catch (error) {
    console.error('Conversion error:', error);
    return res.status(500).json({ 
      error: 'Conversion failed',
      message: error.message 
    });
  }
}
