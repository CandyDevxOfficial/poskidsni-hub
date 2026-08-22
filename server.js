const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());

const DB_DIR = path.join(__dirname, 'scripts_db');
const USERS_FILE = path.join(__dirname, 'users.json');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR);
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify([]));

// ฟังก์ชั่นช่วยจัดการข้อมูลผู้ใช้
function getUsers() {
    try {
        return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    } catch (e) {
        return [];
    }
}

function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

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
    <title>SOLARIS HUB - Portal</title>
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
            background: rgba(18, 20, 29, 0.75); 
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.08); 
            border-radius: 20px; 
            padding: 28px 20px; 
            width: 100%; 
            max-width: 480px; 
            box-shadow: 0 20px 50px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1); 
        }
        .header { text-align: center; margin-bottom: 24px; }
        .logo-title {
            font-size: 26px; 
            font-weight: 700; 
            letter-spacing: 1.5px;
            background: linear-gradient(135deg, #ff416c, #ff4b2b);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin: 0 0 4px 0;
        }
        .subtitle { font-size: 12px; color: #9ca3af; margin: 0; }
        
        .form-group { margin-bottom: 14px; }
        .form-group label { display: block; font-size: 13px; color: #d1d5db; margin-bottom: 6px; }
        input[type="email"], input[type="password"], textarea { 
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
        textarea { height: 160px; font-family: 'Fira Code', monospace; font-size: 13px; resize: vertical; }
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
        }
        .alert-error { color: #f87171; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); }
        .alert-success { color: #34d399; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); }

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

        .toggle-text {
            text-align: center;
            font-size: 13px;
            color: #9ca3af;
            margin-top: 16px;
        }
        .toggle-text span {
            color: #38bdf8;
            cursor: pointer;
            text-decoration: underline;
        }

        .page-section { display: none; }
        .active-section { display: block; }
        
        .result-text { 
            word-break: break-all; 
            font-family: 'Fira Code', monospace; 
            font-size: 12px; 
            color: #38bdf8; 
            background: rgba(0, 0, 0, 0.3);
            padding: 10px;
            border-radius: 8px;
            border: 1px dashed rgba(56, 189, 248, 0.3);
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <h1 class="logo-title">SOLARIS HUB</h1>
            <p class="subtitle">ระบบจัดการสคริปต์ความปลอดภัยสูง</p>
        </div>

        <!-- หน้าที่ 1: เข้าสู่ระบบ / สลับไปสมัครสมาชิก -->
        <div id="authSection" class="page-section active-section">
            <h2 id="authTitle" style="font-size: 18px; margin-bottom: 16px; text-align: center;">เข้าสู่ระบบ</h2>
            
            <div id="authAlert" class="alert-box alert-error"></div>

            <div class="form-group">
                <label>อีเมล (E-mail)</label>
                <input type="email" id="authEmail" placeholder="example@email.com">
            </div>
            <div class="form-group">
                <label>รหัสผ่าน (Password)</label>
                <input type="password" id="authPassword" placeholder="••••••••">
            </div>

            <button class="btn btn-primary" id="authBtn" onclick="handleAuth()">เข้าสู่ระบบ</button>

            <div class="toggle-text">
                <span id="toggleAuth" onclick="toggleAuthMode()">ยังไม่มีบัญชี? สมัครสมาชิกที่นี่</span>
            </div>
        </div>

        <!-- หน้าที่ 2: ระบบจัดการสคริปต์ (เปิดให้เห็นเมื่อล็อกอินผ่านแล้ว) -->
        <div id="dashboardSection" class="page-section">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <span id="userBadge" style="font-size: 12px; color: #fbbf24;"></span>
                <span onclick="logout()" style="font-size: 12px; color: #f87171; cursor: pointer;">ออกจากระบบ</span>
            </div>

            <div class="form-group">
                <label>วางโค้ด Lua ของคุณ</label>
                <textarea id="luaCode" placeholder="-- วางสคริปต์ Lua ของคุณที่นี่..."></textarea>
            </div>

            <div id="dashAlert" class="alert-box alert-error"></div>

            <button class="btn btn-primary" onclick="generateScript()">⚡ Encrypt Script</button>

            <div id="resultCard" style="display: none; margin-top: 20px;">
                <label style="font-size: 12px; color: #9ca3af;">Generated Loadstring:</label>
                <div class="result-text" id="output"></div>
                <button class="btn btn-success" id="copyBtn" onclick="copyResult()">📋 คัดลอกสคริปต์</button>
            </div>
        </div>
    </div>

    <script>
        let isLoginMode = true;
        let currentUser = null;
        let generatedUrl = "";

        function toggleAuthMode() {
            isLoginMode = !isLoginMode;
            document.getElementById('authTitle').innerText = isLoginMode ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก';
            document.getElementById('authBtn').innerText = isLoginMode ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก';
            document.getElementById('toggleAuth').innerText = isLoginMode ? 'ยังไม่มีบัญชี? สมัครสมาชิกที่นี่' : 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบ';
            document.getElementById('authAlert').style.display = 'none';
        }

        async function handleAuth() {
            const email = document.getElementById('authEmail').value.trim();
            const password = document.getElementById('authPassword').value.trim();
            const alertBox = document.getElementById('authAlert');

            alertBox.style.display = 'none';

            if(!email || !password) {
                alertBox.className = 'alert-box alert-error';
                alertBox.innerText = '⚠️ กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน';
                alertBox.style.display = 'block';
                return;
            }

            const endpoint = isLoginMode ? '/api/login' : '/api/register';
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                alertBox.className = 'alert-box alert-error';
                alertBox.innerText = '⚠️ ' + data.error;
                alertBox.style.display = 'block';
            } else {
                if (!isLoginMode) {
                    alertBox.className = 'alert-box alert-success';
                    alertBox.innerText = '✅ สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ';
                    alertBox.style.display = 'block';
                    toggleAuthMode();
                } else {
                    currentUser = data.email;
                    document.getElementById('userBadge').innerText = '👤 ' + currentUser;
                    document.getElementById('authSection').classList.remove('active-section');
                    document.getElementById('dashboardSection').classList.add('active-section');
                }
            }
        }

        function logout() {
            currentUser = null;
            document.getElementById('dashboardSection').classList.remove('active-section');
            document.getElementById('authSection').classList.add('active-section');
            document.getElementById('authEmail').value = '';
            document.getElementById('authPassword').value = '';
        }

        async function generateScript() {
            const code = document.getElementById('luaCode').value;
            const alertBox = document.getElementById('dashAlert');
            const resultCard = document.getElementById('resultCard');

            alertBox.style.display = 'none';
            resultCard.style.display = 'none';

            if(!code.trim()) {
                alertBox.innerText = '⚠️ กรุณาวางโค้ดก่อนครับ!';
                alertBox.style.display = 'block';
                return;
            }

            const res = await fetch('/api/save-script', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code, email: currentUser })
            });

            const data = await res.json();
            
            if(!res.ok || data.error) {
                alertBox.innerText = '⚠️ ' + (data.error || 'เกิดข้อผิดพลาดในการประมวลผล');
                alertBox.style.display = 'block';
                return;
            }
            
            generatedUrl = 'loadstring(game:HttpGet("' + window.location.origin + '/Scripts?Id=' + data.id + '"))("' + data.id + '")';
            
            document.getElementById('output').innerText = generatedUrl;
            resultCard.style.display = 'block';
        }

        function copyResult() {
            navigator.clipboard.writeText(generatedUrl).then(() => {
                const copyBtn = document.getElementById('copyBtn');
                copyBtn.innerText = '✅ คัดลอกเรียบร้อยแล้ว!';
                setTimeout(() => { copyBtn.innerText = '📋 คัดลอกสคริปต์'; }, 2000);
            });
        }
    </script>
</body>
</html>
`;

app.get('/', (req, res) => res.send(htmlContent));

// ระบบสมัครสมาชิก
app.post('/api/register', (req, res) => {
    const { email, password } = req.body;
    const users = getUsers();

    if (users.find(u => u.email === email)) {
        return res.status(400).json({ error: 'อีเมลนี้ถูกใช้งานไปแล้ว' });
    }

    users.push({ email, password });
    saveUsers(users);
    res.json({ success: true });
});

// ระบบเข้าสู่ระบบ
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const users = getUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
        return res.status(400).json({ error: 'ไม่พบอีเมลนี้ในระบบ' });
    }

    if (user.password !== password) {
        return res.status(400).json({ error: 'รหัสผ่านไม่ถูกต้อง' });
    }

    res.json({ success: true, email: user.email });
});

// ระบบบันทึกสคริปต์
app.post('/api/save-script', (req, res) => {
    const rawCode = req.body.code || '';
    
    if (!isValidLuaCode(rawCode)) {
        return res.status(400).json({ error: 'นี่ไม่ใช่โค้ดโปรดใส่โค้ด' });
    }

    const scriptId = Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
    const obfuscated = obfuscateLua(rawCode);
    
    fs.writeFileSync(path.join(DB_DIR, `${scriptId}.lua`), obfuscated);
    res.json({ id: scriptId });
});

// ระบบดึงสคริปต์ไปรันในเกม
app.get('/Scripts', (req, res) => {
    const scriptId = req.query.Id;
    const userAgent = req.headers['user-agent'] || '';
    const filePath = path.join(DB_DIR, `${scriptId}.lua`);

    if (!scriptId || !fs.existsSync(filePath)) {
        return res.status(404).send('Script Not Found');
    }

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
