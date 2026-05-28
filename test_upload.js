const fs = require('fs');

const url = 'https://cjgqmdymyybuldbypryf.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqZ3FtZHlteXlidWxkYnlwcnlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3OTE2NTAsImV4cCI6MjA5NTM2NzY1MH0.YKMIf1LcCJxGQzEc3RexMqybtB-Ma-8XCpbv9NP3-VY';

async function testUpload() {
  const filePath = `surat/2026/test_${Date.now()}.txt`;
  try {
    const res = await fetch(`${url}/storage/v1/object/surat-files/${filePath}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'text/plain',
        'x-upsert': 'false'
      },
      body: 'Hello world'
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', text);
  } catch (err) {
    console.error('Error:', err);
  }
}

testUpload();
