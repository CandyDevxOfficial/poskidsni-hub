const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());

const DB_DIR = path.join(__dirname, 'scripts_db');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR);

function obfuscateLua(code) {
    const bytes = Buffer.from(code).toJSON().data;
    const hexArray = bytes.map(b => '\\' + b).join('');
    
    return `local _0x8f2a = "${hexArray}"
local _0x1b4c = function(_0x) return _0x:gsub('\\\\(%d+)', function(_0xb) return string.char(tonumber(_0xb)) end) end
local _0x9e3d = loadstring(_0x1b4c(_0x8f2a))
if _0x9e3d then _0x9e3d() end`;
}

function isValidLuaCode(code) {
    const text = code.toLowerCase();
    const luaKeywords = [
        'local', 'function', 'end', 'if', 'then', 'else', 'elseif', 
        'while', 'do', 'for', 'in', 'repeat', 'until', 'return', 
        'break', 'true', 'false', 'nil', 'print', 'game', 'workspace', 
        'script', 'instance', 'math', 'string', 'table', 'task', 
        'pairs', 'ipairs', 'httpget', 'loadstring', 'pcall'
    ];
    const hasSymbols = /[=()\{\}\[\]\:]/.test(code) || code.includes('--');
    const hasKeyword = luaKeywords.some(kw => text.includes(kw));
    return hasSymbols || hasKeyword;
}

const htmlContent = `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SOLARIS HUB - Script System</title>
    <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600&family=Kanit:wght@300;400;500;700&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; font-family: 'Kanit', sans-serif; }
        body { 
            background: #090a0f; 
            background-image: radial-gradient(circle at 50% -20%, #1e1b4b, #090a0f 80%);
            color: #f3f4f6; 
            padding: 20px 12px; 
            margin: 0; 
            min-height: 100vh;
            display: flex; 
            justify-content: center; 
            align-items: center; 
        }
        .card { 
            background: rgba(18, 20, 29, 0.85); 
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.08); 
            border-radius: 20px; 
            padding: 28px 20px; 
            width: 100%; 
            max-width: 480px; 
            box-shadow: 0 20px 50px rgba(0,0,0,0.7); 
        }
        .header { text-align: center; margin-bottom: 20px; }
        .logo-title {
            font-size: 26px; 
            font-weight: 700; 
            background: linear-gradient(135deg, #ff416c, #ff4b2b);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin: 0 0 4px 0;
        }
        .subtitle { font-size: 12px; color: #9ca3af; margin: 0; }
        
        .form-group { margin-bottom: 14px; }
        .form-group label { display: block; font-size: 13px; color: #d1d5db; margin-bottom: 6px; }
        input[type="text"], input[type="password"], input[type="email"], textarea { 
            width: 100%; 
            background: rgba(10, 12, 18, 0.9); 
            color: #a7f3d0; 
            border: 1px solid rgba(255, 255, 255, 0.1); 
            border-radius: 12px; 
            padding: 12px 14px; 
            font-size: 14px; 
            outline: none;
            transition: all 0.3s ease;
        }
        textarea { height: 160px; font-family: 'Fira Code', monospace; font-size: 12px; resize: vertical; }
        input:focus, textarea:focus { 
            border-color: #ff416c; 
            box-shadow: 0 0 15px rgba(255, 65, 108, 0.25); 
        }
        
        .alert-box {
            padding: 10px 14px;
            border-radius: 10px;
            font-size: 13px;
            margin-bottom: 16px;
            display: none;
            text-align: center;
            color: #f87171; 
            background: rgba(239, 68, 68, 0.1); 
            border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .btn { 
            width: 100%; 
            padding: 14px; 
            border: none; 
            color: white; 
            font-weight: 600; 
            border-radius: 12px; 
            cursor: pointer; 
            font-size: 15px; 
            transition: all 0.25s ease; 
            margin-top: 8px;
        }
        .btn-primary { background: linear-gradient(135deg, #ff416c, #ff4b2b); }
        .btn-success { background: linear-gradient(135deg, #10b981, #059669); }
        .btn:hover { transform: translateY(-2px); }

        .tab-menu { display: flex; gap: 8px; margin-bottom: 16px; }
        .tab-btn {
            flex: 1; padding: 10px; background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1); color: #9ca3af;
            border-radius: 10px; cursor: pointer; text-align: center; font-size: 13px;
        }
        .tab-btn.active { background: #ff416c; color: white; border-color: #ff416c; }

        .page-section { display: none; }
        .active-section { display: block; }
        
        .result-box { 
            word-break: break-all; font-family: 'Fira Code', monospace; 
            font-size: 12px; color: #38bdf8; background: rgba(0, 0, 0, 0.3); 
            padding: 10px; border-radius: 8px; border: 1px dashed rgba(56, 189, 248, 0.3); margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <h1 class="logo-title">SOLARIS HUB</h1>
            <p class="subtitle">ระบบแปลงสคริปต์และปลดล็อกโค้ด</p>
        </div>

        <div class="tab-menu">
            <div class="tab-btn active" onclick="switchTab('create')">⚡ แปลงสคริปต์</div>
            <div class="tab-btn" onclick="switchTab('view')">🔓 ดูโค้ดสคริปต์</div>
        </div>

        <div id="alertMsg" class="alert-box"></div>

        <!-- โหมดที่ 1: สร้างและกำหนดรหัสผ่านสคริปต์ -->
        <div id="createTab" class="page-section active-section">
            <div class="form-group">
                <label>📜 วางโค้ด Lua ของคุณ</label>
                <textarea id="rawCode" placeholder="-- วางโค้ด Lua..."></textarea>
            </div>
            <div class="form-group">
                <label>🔐 ตั้งรหัสผ่านสคริปต์ (ตั้งเองได้เลย)</label>
                <input type="password" id="createPassword" placeholder="ตั้งรหัสผ่านสำหรับสคริปต์นี้">
            </div>
            <button class="btn btn-primary" onclick="createScript()">⚡ แปลงสคริปต์</button>

            <div id="createResult" style="display: none; margin-top: 16px;">
                <label style="font-size: 12px; color: #9ca3af;">นำลิงก์นี้ไปรันใน Roblox:</label>
                <div class="result-box" id="scriptLink"></div>
            </div>
        </div>

        <!-- โหมดที่ 2: ปลดล็อกเพื่อดูโค้ด -->
        <div id="viewTab" class="page-section">
            <!-- หน้า 1: ใส่ Script ID -->
            <div id="viewStep1">
                <div class="form-group">
                    <label>🔑 รหัสสคริปต์ (Script ID)</label>
                    <input type="text" id="scriptIdInput" placeholder="เช่น 1954578116716">
                </div>
                <button class="btn btn-primary" onclick="checkScriptId()">ถัดไป ➔</button>
            </div>

            <!-- หน้า 2: ใส่ E-mail และ รหัสผ่านที่เคยตั้งไว้ -->
            <div id="viewStep2" style="display: none;">
                <div class="form-group">
                    <label>📧 อีเมลของคุณ (E-mail)</label>
                    <input type="email" id="userEmail" placeholder="example@gmail.com">
                </div>
                <div class="form-group">
                    <label>🔐 รหัสผ่านสคริปต์</label>
                    <input type="password" id="inputPassword" placeholder="กรอกรหัสผ่านของสคริปต์นี้">
                </div>
                <button class="btn btn-success" onclick="unlockCode()">ยืนยันเพื่อดูโค้ด 🔓</button>
            </div>

            <!-- หน้า 3: แสดงโค้ดด้านใน + ปุ่มคัดลอก -->
            <div id="viewStep3" style="display: none;">
                <div class="form-group">
                    <label>📜 โค้ดสคริปต์ด้านใน:</label>
                    <textarea id="codeDisplay" readonly></textarea>
                </div>
                <button class="btn btn-success" id="copyCodeBtn" onclick="copyInsideCode()">📋 คัดลอกโค้ด</button>
                <button class="btn btn-primary" style="margin-top: 8px;" onclick="location.reload()">🔄 กลับหน้าหลัก</button>
            </div>
        </div>
    </div>

    <script>
        let targetScriptId = "";

        function showAlert(msg) {
            const el = document.getElementById('alertMsg');
            el.innerText = '⚠️ ' + msg;
            el.style.display = 'block';
        }

        function clearAlert() {
            document.getElementById('alertMsg').style.display = 'none';
        }

        function switchTab(tab) {
            clearAlert();
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('active-section'));
            
            if(tab === 'create') {
                document.querySelectorAll('.tab-btn')[0].classList.add('active');
                document.getElementById('createTab').classList.add('active-section');
            } else {
                document.querySelectorAll('.tab-btn')[1].classList.add('active');
                document.getElementById('viewTab').classList.add('active-section');
            }
        }

        async function createScript() {
            clearAlert();
            const code = document.getElementById('rawCode').value.trim();
            const password = document.getElementById('createPassword').value.trim();

            if(!code) return showAlert('โปรดวางโค้ด Lua ก่อนกดแปลง');
            if(!password) return showAlert('กรุณาตั้งรหัสผ่านสำหรับสคริปต์นี้');

            const res = await fetch('/api/save-script', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code, password: password })
            });

            const data = await res.json();
            if(!res.ok) {
                showAlert(data.error);
            } else {
                const loadstringUrl = 'loadstring(game:HttpGet("' + window.location.origin + '/Scripts?Id=' + data.id + '"))()';
                document.getElementById('scriptLink').innerText = loadstringUrl;
                document.getElementById('createResult').style.display = 'block';
            }
        }

        async function checkScriptId() {
            clearAlert();
            const id = document.getElementById('scriptIdInput').value.trim();
            if(!id) return showAlert('กรุณากรอกรหัสสคริปต์');

            const res = await fetch('/api/check-script?id=' + id);
            const data = await res.json();

            if(!res.ok) {
                showAlert(data.error || 'ไม่พบรหัสสคริปต์นี้');
            } else {
                targetScriptId = id;
                document.getElementById('viewStep1').style.display = 'none';
                document.getElementById('viewStep2').style.display = 'block';
            }
        }

        async function unlockCode() {
            clearAlert();
            const email = document.getElementById('userEmail').value.trim();
            const password = document.getElementById('inputPassword').value.trim();

            if(!email || !email.includes('@')) return showAlert('อีเมลไม่ผ่าน กรุณากรอกอีเมลให้ถูกต้อง');
            if(!password) return showAlert('กรุณากรอกรหัสผ่าน');

            const res = await fetch('/api/get-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scriptId: targetScriptId, email: email, password: password })
            });

            const data = await res.json();
            if(!res.ok) {
                showAlert(data.error);
            } else {
                document.getElementById('codeDisplay').value = data.code;
                document.getElementById('viewStep2').style.display = 'none';
                document.getElementById('viewStep3').style.display = 'block';
            }
        }

        function copyInsideCode() {
            const codeText = document.getElementById('codeDisplay').value;
            navigator.clipboard.writeText(codeText).then(() => {
                const btn = document.getElementById('copyCodeBtn');
                btn.innerText = '✅ คัดลอกเรียบร้อย!';
                setTimeout(() => { btn.innerText = '📋 คัดลอกโค้ด'; }, 2000);
            });
        }
    </script>
</body>
</html>
`;

app.get('/', (req, res) => res.send(htmlContent));

// บันทึกสคริปต์ + รหัสผ่าน
app.post('/api/save-script', (req, res) => {
    const { code, password } = req.body;
    
    if (!isValidLuaCode(code || '')) {
        return res.status(400).json({ error: 'นี่ไม่ใช่โค้ดโปรดใส่โค้ด' });
    }
    if (!password) {
        return res.status(400).json({ error: 'กรุณาตั้งรหัสผ่านสคริปต์' });
    }

    const scriptId = Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
    const obfuscated = obfuscateLua(code);
    
    fs.writeFileSync(path.join(DB_DIR, `${scriptId}.lua`), obfuscated);
    fs.writeFileSync(path.join(DB_DIR, `${scriptId}.json`), JSON.stringify({ password: password, rawCode: code }));

    res.json({ id: scriptId });
});

// ตรวจสอบ Script ID
app.get('/api/check-script', (req, res) => {
    const id = req.query.id;
    const filePath = path.join(DB_DIR, `${id}.lua`);
    if (!id || !fs.existsSync(filePath)) {
        return res.status(400).json({ error: 'รหัสสคริปต์ไม่ผ่าน' });
    }
    res.json({ success: true });
});

// ตรวจสอบ Email + Password เพื่อเปิดดูโค้ด
app.post('/api/get-code', (req, res) => {
    const { scriptId, email, password } = req.body;

    if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'อีเมลไม่ผ่าน' });
    }

    const infoPath = path.join(DB_DIR, `${scriptId}.json`);
    if (!fs.existsSync(infoPath)) {
        return res.status(400).json({ error: 'รหัสไม่ผ่าน' });
    }

    const scriptInfo = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
    
    if (scriptInfo.password !== password) {
        return res.status(400).json({ error: 'รหัสไม่ผ่าน หรือ อีเมลไม่ผ่าน' });
    }

    res.json({ success: true, code: scriptInfo.rawCode });
});

// ดึงสคริปต์ไปรันในเกม Roblox
app.get('/Scripts', (req, res) => {
    const scriptId = req.query.Id;
    const userAgent = req.headers['user-agent'] || '';
    const filePath = path.join(DB_DIR, `${scriptId}.lua`);

    if (!scriptId || !fs.existsSync(filePath)) {
        return res.status(404).send('Script Not Found');
    }

    const isBrowser = userAgent.includes('Mozilla') && !userAgent.includes('Roblox');
    if (isBrowser) {
        return res.status(403).send(`
        <!DOCTYPE html>
        <html lang="th">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Access Denied - SOLARIS HUB</title>
            <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600&display=swap" rel="stylesheet">
            <style>
                * { box-sizing: border-box; font-family: 'Kanit', sans-serif; }
                body { 
                    background: #090a0f; 
                    background-image: radial-gradient(circle at 50% -20%, #1e1b4b, #090a0f 80%);
                    color: #f3f4f6; padding: 20px; margin: 0; min-height: 100vh;
                    display: flex; justify-content: center; align-items: center; text-align: center;
                }
                .card { 
                    background: rgba(18, 20, 29, 0.85); backdrop-filter: blur(16px);
                    border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 20px; padding: 32px 24px; max-width: 400px; width: 100%;
                }
                .icon { font-size: 50px; margin-bottom: 12px; }
                h1 { font-size: 22px; color: #f87171; margin: 0 0 8px 0; }
                p { font-size: 14px; color: #9ca3af; margin: 0 0 20px 0; line-height: 1.5; }
                .btn { 
                    display: inline-block; width: 100%; padding: 12px; 
                    background: linear-gradient(135deg, #ff416c, #ff4b2b); color: white; 
                    text-decoration: none; font-weight: 600; border-radius: 12px; font-size: 14px;
                }
            </style>
        </head>
        <body>
            <div class="card">
                <div class="icon">🔒</div>
                <h1>ACCESS DENIED</h1>
                <p>สคริปต์นี้ถูกคุ้มครองความปลอดภัย<br>ไม่อนุญาตให้เปิดดูผ่านเว็บเบราว์เซอร์ครับ กรุณานำลิงก์ไปรันในเกม Roblox</p>
                <a href="/" class="btn">กลับหน้าหลัก SOLARIS HUB</a>
            </div>
        </body>
        </html>
        `);
    }

    const scriptData = fs.readFileSync(filePath, 'utf8');
    res.type('text/plain');
    res.send(scriptData);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port ' + PORT));
                                                                           
