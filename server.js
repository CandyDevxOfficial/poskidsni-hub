const express = require('express');
const app = express();

app.use(express.json());

// ฐานข้อมูลเก็บโค้ดชั่วคราว
const db = {};

// 1. หน้าเว็บ HTML สำหรับมือถือ (โทนสีเข้ม)
const htmlContent = `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Poskidsni Hub - Script Lock</title>
    <style>
        body { background-color: #0f172a; color: #fff; font-family: sans-serif; padding: 20px; margin: 0; }
        .card { background: #1e293b; padding: 20px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.5); }
        h2 { text-align: center; color: #ef4444; margin-top: 0; }
        textarea { width: 100%; height: 160px; background: #090d16; color: #22c55e; border: 1px solid #334155; padding: 10px; border-radius: 8px; font-family: monospace; box-sizing: border-box; }
        button { width: 100%; padding: 12px; background: #ef4444; border: none; color: white; font-weight: bold; border-radius: 8px; cursor: pointer; margin-top: 10px; font-size: 16px; }
        .result { margin-top: 15px; background: #090d16; padding: 12px; border-radius: 8px; word-break: break-all; font-family: monospace; font-size: 12px; color: #38bdf8; border: 1px solid #1e293b; }
    </style>
</head>
<body>
    <div class="card">
        <h2>Poskidsni Lock System</h2>
        <textarea id="luaCode" placeholder="วางโค้ด Lua ของพอร์ชตรงนี้..."></textarea>
        <button onclick="generateScript()">สร้างลิงก์ Lock Script</button>
        <div class="result" id="output">ลิงก์ loadstring จะขึ้นตรงนี้...</div>
    </div>

    <script>
        async function generateScript() {
            const code = document.getElementById('luaCode').value;
            if(!code) return alert('กรุณาวางโค้ดก่อนครับ!');

            const res = await fetch('/api/save-script', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code })
            });
            const data = await res.json();
            
            const loadstringUrl = "loadstring(game:HttpGet(\"" + window.location.origin + "/Scripts?Id=" + data.id + "\"))()";
            document.getElementById('output').innerText = loadstringUrl;
        }
    </script>
</body>
</html>
`;

// แสดงหน้าเว็บเมื่อเข้า URL หลัก
app.get('/', (req, res) => {
    res.send(htmlContent);
});

// API รับโค้ดมาเซฟและสุ่ม ID
app.post('/api/save-script', (req, res) => {
    const rawCode = req.body.code;
    const scriptId = Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
    
    // แปลงโค้ดให้อ่านไม่ออกเบื้องต้น
    const obfuscated = "local _ = '" + Buffer.from(rawCode).toString('hex') + "';"; 

    db[scriptId] = obfuscated;
    res.json({ id: scriptId });
});

// API สำหรับ Roblox (บล็อกเว็บเบราว์เซอร์)
app.get('/Scripts', (req, res) => {
    const scriptId = req.query.Id;
    const userAgent = req.headers['user-agent'] || '';

    if (!db[scriptId]) {
        return res.status(404).send('Script Not Found');
    }

    // ดักจับคนเปิดใน Chrome/เบราว์เซอร์
    const isBrowser = userAgent.includes('Mozilla') && !userAgent.includes('Roblox');

    if (isBrowser) {
        return res.status(403).send('Access Denied: You cannot view this script in a Web Browser!');
    }

    res.type('text/plain');
    res.send(db[scriptId]);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server is running on port ' + PORT));
        
