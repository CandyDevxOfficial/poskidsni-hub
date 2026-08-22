const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());

// โฟลเดอร์สำหรับเซฟสคริปต์กันข้อมูลหาย
const DB_DIR = path.join(__dirname, 'scripts_db');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR);

// ตัวแปลงโค้ด Lua ให้เป็น Obfuscated String แบบยุ่งเหยิง
function obfuscateLua(code) {
    const bytes = Buffer.from(code).toJSON().data;
    const hexArray = bytes.map(b => '\\' + b).join('');
    
    // สร้างโครงสร้างสคริปต์แบบครอบด้วย Function ซับซ้อน
    return `local _0x8f2a = "${hexArray}"
local _0x1b4c = function(_0x) return _0x:gsub('\\\\(%d+)', function(_0xb) return string.char(tonumber(_0xb)) end) end
local _0x9e3d = loadstring(_0x1b4c(_0x8f2a))
if _0x9e3d then _0x9e3d() end`;
}

// หน้าเว็บหลัก
const htmlContent = `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Encrypt X Obfuscator</title>
    <style>
        body { background-color: #0d1117; color: #c9d1d9; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; margin: 0; display: flex; justify-content: center; }
        .card { background: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 24px; width: 100%; max-width: 480px; box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
        h2 { text-align: center; color: #ff4a4a; font-size: 22px; margin-top: 0; font-weight: 700; letter-spacing: 1px; }
        textarea { width: 100%; height: 180px; background: #0d1117; color: #7ee787; border: 1px solid #30363d; border-radius: 8px; padding: 12px; font-family: monospace; box-sizing: border-box; font-size: 13px; resize: vertical; }
        button { width: 100%; padding: 14px; background: #ea4aaa; border: none; color: white; font-weight: bold; border-radius: 8px; cursor: pointer; margin-top: 16px; font-size: 16px; transition: 0.2s; }
        button:hover { background: #d03795; }
        .result { margin-top: 16px; background: #0d1117; padding: 12px; border-radius: 8px; word-break: break-all; font-family: monospace; font-size: 12px; color: #58a6ff; border: 1px solid #30363d; display: none; }
    </style>
</head>
<body>
    <div class="card">
        <h2>Encrypt X Obfuscator</h2>
        <textarea id="luaCode" placeholder="วางโค้ด Lua ของคุณที่นี่..."></textarea>
        <button onclick="generateScript()">Obfuscate</button>
        <div class="result" id="output"></div>
    </div>

    <script>
        async function generateScript() {
            const code = document.getElementById('luaCode').value;
            if(!code.trim()) return alert('กรุณาวางโค้ดก่อนครับ!');

            const res = await fetch('/api/save-script', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code })
            });
            const data = await res.json();
            
            const loadstringUrl = 'loadstring(game:HttpGet("' + window.location.origin + '/Scripts?Id=' + data.id + '"))("' + data.id + '")';
            const outDiv = document.getElementById('output');
            outDiv.innerText = loadstringUrl;
            outDiv.style.display = 'block';
        }
    </script>
</body>
</html>
`;

app.get('/', (req, res) => res.send(htmlContent));

// บันทึกโค้ดแบบ Obfuscate ลงไฟล์
app.post('/api/save-script', (req, res) => {
    const rawCode = req.body.code || '';
    const scriptId = Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
    
    const obfuscated = obfuscateLua(rawCode);
    
    // บันทึกลงดิสก์
    fs.writeFileSync(path.join(DB_DIR, `${scriptId}.lua`), obfuscated);
    res.json({ id: scriptId });
});

// ส่งโค้ดกลับเมื่อดึงจาก Roblox (พร้อมระบบบล็อก Browser)
app.get('/Scripts', (req, res) => {
    const scriptId = req.query.Id;
    const userAgent = req.headers['user-agent'] || '';
    const filePath = path.join(DB_DIR, `${scriptId}.lua`);

    if (!scriptId || !fs.existsSync(filePath)) {
        return res.status(404).send('Script Not Found');
    }

    // บล็อกการเปิดจาก Web Browser
    const isBrowser = userAgent.includes('Mozilla') && !userAgent.includes('Roblox');
    if (isBrowser) {
        return res.status(403).send('ACCESS DENIED: This script is protected.');
    }

    const scriptData = fs.readFileSync(filePath, 'utf8');
    res.type('text/plain');
    res.send(scriptData);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port ' + PORT));
