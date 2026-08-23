const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());

const DATA_DIR = fs.existsSync('/data') ? '/data' : path.join(__dirname, 'data_store');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_FILE = path.join(DATA_DIR, 'db.json');

let database = {};
if (fs.existsSync(DB_FILE)) {
    try {
        database = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (e) {
        database = {};
    }
}

function saveData() {
    fs.writeFileSync(DB_FILE, JSON.stringify(database, null, 2));
}

// ฟังก์ชันแปลงโค้ดแบบเซฟ ปลอดภัย และรันติดแน่นอน
function safeObfuscate(code, watermark = true) {
    let result = code;
    if (watermark) {
        result = `-- [ SOLARIS HUB PROTECTED ]\n-- Generated at: ${new Date().toLocaleString()}\n\n` + result;
    }
    const bytes = Buffer.from(result).toJSON().data;
    const hexArray = bytes.map(b => '\\' + b).join('');
    
    return `local _S = "${hexArray}"
local _D = function(s) return s:gsub('\\\\(%d+)', function(n) return string.char(tonumber(n)) end) end
local _F = loadstring(_D(_S))
if _F then _F() end`;
}

const htmlContent = `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SOLARIS HUB - Luau Security & Script Manager</title>
    <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600&family=Kanit:wght@300;400;500;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #ff416c;
            --secondary: #8b5cf6;
            --bg-dark: #0a0c14;
            --card-bg: rgba(18, 20, 32, 0.9);
            --border: rgba(255, 255, 255, 0.1);
        }
        * { box-sizing: border-box; font-family: 'Kanit', sans-serif; margin: 0; padding: 0; }
        body { 
            background: var(--bg-dark); 
            background-image: radial-gradient(circle at 50% -10%, #2e1065, var(--bg-dark) 80%);
            color: #f3f4f6; 
            padding: 24px 12px; 
            min-height: 100vh;
            display: flex; 
            justify-content: center; 
            align-items: center; 
        }
        .container { 
            background: var(--card-bg); 
            backdrop-filter: blur(20px);
            border: 1px solid var(--border); 
            border-radius: 20px; 
            padding: 28px 24px; 
            width: 100%; 
            max-width: 520px; 
            box-shadow: 0 20px 60px rgba(0,0,0,0.8); 
        }
        .header { text-align: center; margin-bottom: 20px; }
        .logo-title {
            font-size: 28px; 
            font-weight: 700; 
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: 1px;
        }
        .subtitle { font-size: 13px; color: #9ca3af; }

        .nav-tabs {
            display: flex;
            background: rgba(0, 0, 0, 0.4);
            padding: 4px;
            border-radius: 12px;
            border: 1px solid var(--border);
            margin-bottom: 20px;
        }
        .tab-btn {
            flex: 1;
            padding: 10px;
            border: none;
            background: transparent;
            color: #9ca3af;
            font-weight: 600;
            font-size: 13px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .tab-btn.active {
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            color: white;
            box-shadow: 0 4px 12px rgba(255, 65, 108, 0.3);
        }

        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; font-size: 13px; color: #d1d5db; margin-bottom: 8px; }
        
        textarea { 
            width: 100%; 
            background: rgba(10, 12, 20, 0.95); 
            color: #a7f3d0; 
            border: 1px solid var(--border); 
            border-radius: 12px; 
            padding: 14px; 
            font-size: 12px; 
            font-family: 'Fira Code', monospace;
            outline: none;
            height: 200px; 
            resize: vertical; 
            transition: border-color 0.3s;
        }
        textarea:focus { border-color: var(--primary); }

        .options-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 16px;
            background: rgba(255,255,255,0.03);
            padding: 12px;
            border-radius: 10px;
            border: 1px solid var(--border);
        }
        .option-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;
            color: #d1d5db;
        }

        .btn-action-group {
            display: flex;
            gap: 8px;
            margin-top: 8px;
        }
        .btn-mini {
            padding: 6px 12px;
            font-size: 11px;
            background: rgba(255,255,255,0.08);
            border: 1px solid var(--border);
            color: #d1d5db;
            border-radius: 6px;
            cursor: pointer;
        }
        .btn-mini:hover { background: rgba(255,255,255,0.15); }

        .btn { 
            width: 100%; 
            padding: 14px; 
            border: none; 
            color: white; 
            font-weight: 700; 
            border-radius: 12px; 
            cursor: pointer; 
            font-size: 14px; 
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            box-shadow: 0 4px 20px rgba(255, 65, 108, 0.25);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(255, 65, 108, 0.4); }

        .result-box { 
            word-break: break-all; 
            font-family: 'Fira Code', monospace; 
            font-size: 12px; 
            color: #38bdf8; 
            background: rgba(0, 0, 0, 0.4); 
            padding: 12px; 
            border-radius: 10px; 
            border: 1px dashed rgba(56, 189, 248, 0.3); 
            margin-top: 8px;
        }

        .alert-box {
            padding: 10px;
            border-radius: 8px;
            font-size: 12px;
            margin-bottom: 12px;
            display: none;
            text-align: center;
            color: #f87171; 
            background: rgba(239, 68, 68, 0.1); 
            border: 1px solid rgba(239, 68, 68, 0.2);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="logo-title">SOLARIS HUB</h1>
            <p class="subtitle">ระบบจัดการสคริปต์ & ป้องกันโค้ด Luau</p>
        </div>

        <div class="nav-tabs">
            <button class="tab-btn active" onclick="setMode('raw')">⚡ สร้าง Loadstring (ปกติ)</button>
            <button class="tab-btn" onclick="setMode('obf')">🔒 ล็อกโค้ด (Obfuscate)</button>
        </div>

        <div id="alertMsg" class="alert-box"></div>

        <div class="form-group">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <label style="margin:0;">📜 วางโค้ด Lua ของคุณ</label>
                <div class="btn-action-group" style="margin:0;">
                    <button class="btn-mini" onclick="copyInputCode()">📋 คัดลอก</button>
                    <button class="btn-mini" onclick="clearInputCode()">🧹 ล้างช่อง</button>
                </div>
            </div>
            <textarea id="rawCode" placeholder="-- วางสคริปต์ Lua ที่นี่..."></textarea>
        </div>

        <div class="options-grid" id="optionsBox" style="display: none;">
            <div class="option-item">
                <input type="checkbox" id="optWatermark" checked>
                <label for="optWatermark">ใส่ SOLARIS Watermark</label>
            </div>
            <div class="option-item">
                <input type="checkbox" id="optEncode" checked>
                <label for="optEncode">บีบอัดโค้ด Hex</label>
            </div>
        </div>

        <button class="btn" onclick="processScript()">⚡ แปลงสคริปต์ทันที</button>

        <div id="resultArea" style="display: none; margin-top: 16px;">
            <label style="font-size: 12px; color: #9ca3af;">นำโค้ดไปรันใน Roblox:</label>
            <div class="result-box" id="scriptLink"></div>
            <button class="btn" style="margin-top: 10px; background: #10b981;" id="copyBtn" onclick="copyResult()">📋 คัดลอกลิงก์ Loadstring</button>
        </div>
    </div>

    <script>
        let currentMode = 'raw';

        function setMode(mode) {
            currentMode = mode;
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');

            const optionsBox = document.getElementById('optionsBox');
            optionsBox.style.display = mode === 'obf' ? 'grid' : 'none';
        }

        function showAlert(msg) {
            const el = document.getElementById('alertMsg');
            el.innerText = '⚠️ ' + msg;
            el.style.display = 'block';
        }

        function copyInputCode() {
            const code = document.getElementById('rawCode').value;
            if(!code.trim()) return showAlert('ไม่มีโค้ดในช่องวาง');
            navigator.clipboard.writeText(code).then(() => alert('คัดลอกโค้ดเรียบร้อย!'));
        }

        function clearInputCode() {
            document.getElementById('rawCode').value = '';
            document.getElementById('resultArea').style.display = 'none';
        }

        async function processScript() {
            document.getElementById('alertMsg').style.display = 'none';
            const code = document.getElementById('rawCode').value.trim();

            if(!code) return showAlert('โปรดวางโค้ด Lua ก่อนกดทำรายการ');

            const isObfuscate = currentMode === 'obf';
            const useWatermark = document.getElementById('optWatermark').checked;

            const res = await fetch('/api/save-script', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, isObfuscate, useWatermark })
            });

            const data = await res.json();
            if(!res.ok) {
                showAlert(data.error);
            } else {
                const loadstringUrl = 'loadstring(game:HttpGet("' + window.location.origin + '/Scripts?Id=' + data.id + '"))()';
                document.getElementById('scriptLink').innerText = loadstringUrl;
                document.getElementById('resultArea').style.display = 'block';
            }
        }

        function copyResult() {
            const text = document.getElementById('scriptLink').innerText;
            navigator.clipboard.writeText(text).then(() => {
                const btn = document.getElementById('copyBtn');
                btn.innerText = '✅ คัดลอกลิงก์เรียบร้อย!';
                setTimeout(() => { btn.innerText = '📋 คัดลอกลิงก์ Loadstring'; }, 2000);
            });
        }
    </script>
</body>
</html>
`;

app.get('/', (req, res) => res.send(htmlContent));

app.post('/api/save-script', (req, res) => {
    const { code, isObfuscate, useWatermark } = req.body;
    
    if (!code || !code.trim()) {
        return res.status(400).json({ error: 'กรุณากรอกโค้ด Lua' });
    }

    const scriptId = Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
    
    let finalCode = code;
    if (isObfuscate) {
        finalCode = safeObfuscate(code, useWatermark);
    }

    database[scriptId] = { code: finalCode };
    saveData();

    res.json({ id: scriptId });
});

app.get('/Scripts', (req, res) => {
    const scriptId = req.query.Id;
    const scriptInfo = database[scriptId];

    if (!scriptId || !scriptInfo) {
        return res.status(404).send('-- Script Not Found');
    }

    res.type('text/plain; charset=utf-8');
    res.send(scriptInfo.code);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('SOLARIS HUB running on port ' + PORT));
    
