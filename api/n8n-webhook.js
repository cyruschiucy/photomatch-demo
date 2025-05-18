const fetch = require('node-fetch');
const formidable = require('formidable');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const webhookUrl = process.env.N8N_WEBHOOK_URL || 'https://missingface.app.n8n.cloud/webhook-test/6de446b5-0b18-4fb4-ba2d-f1ddbe41a179';

  // Parse incoming multipart/form-data
  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Error parsing form:', err);
      return res.status(500).json({ error: 'Failed to parse form data' });
    }

    // Create new FormData for forwarding to n8n
    const FormData = require('form-data');
    const formData = new FormData();
    const file = files.file; // Assumes the file input name is 'file'
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Append the file to FormData
    const fs = require('fs');
    formData.append('file', fs.createReadStream(file.filepath), {
      filename: file.originalFilename,
      contentType: file.mimetype
    });

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders()
      });

      const text = await response.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse n8n response:', parseError);
        return res.status(response.status).json({ error: 'Invalid response from n8n' });
      }

      res.status(response.status).json(json);
    } catch (error) {
      console.error('Error forwarding to n8n:', error);
      res.status(500).json({ error: 'Failed to proxy request to n8n' });
    }
  });
};
