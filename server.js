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

// ฟังก์ชั่นตรวจสอบว่าเป็นโค้ด Lua หรือไม่
function isValidLuaCode(code) {
    const luaKeywords = [
        'local', 'function', 'end', 'if', 'then', 'else', 'elseif', 
        'while', 'do', 'for', 'in', 'repeat', 'until', 'return', 
        'break', 'true', 'false', 'nil', 'and', 'or', 'not',
        'print', 'game', 'workspace', 'script', 'Instance.new',
        'math.', 'string.', 'table.', 'task.wait', 'task.spawn',
        'pairs', 'ipairs', 'type', 'tostring', 'tonumber', 'pcall',
        'HttpGet', 'HttpPost', 'GetObjects', 'require', 'loadstring'
    ];
    
    // เช็คสัญลักษณ์พื้นฐานของโค้ด Lua เช่น =, (), {}, ==, ~=, --
    const hasCodeSymbols = /[=()\{\}\[\]\:]/.test(code) || code.includes('--');
    
    // เช็คว่ามีคีย์เวิร์ดของ Lua อยู่ในข้อความหรือไม่
    const hasLuaKeyword = luaKeywords.some(keyword => {
        const regex = new RegExp('\\b' + keyword.replace('.', '\\.') + '\\b');
        return regex.test(code);
    });

    return hasCodeSymbols || hasLuaKeyword;
}

const htmlContent = `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Encrypt X - SOLARIS HUB</title>
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
            text-shadow: 0 0 20px rgba(255, 65, 108, 0.3);
        }
        .author-tag {
            font-size: 13px;
            color: #fbbf24;
            font-weight: 500;
            margin: 0 0 8px 0;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
        }
        .author-tag a {
            color: #38bdf8;
            text-decoration: none;
            transition: 0.2s;
        }
        .author-tag a:hover {
            text-decoration: underline;
            color: #7dd3fc;
        }
        .subtitle { font-size: 12px; color: #9ca3af; margin: 0; font-weight: 300; }
        
        .code-box { position: relative; margin-bottom: 18px; }
        textarea { 
            width: 100%; 
            height: 180px; 
            background: rgba(10, 12, 18, 0.9); 
            color: #a7f3d0; 
            border: 1px solid rgba(255, 255, 255, 0.1); 
            border-radius: 14px; 
            padding: 16px; 
            font-family: 'Fira Code', monospace; 
            font-size: 13px; 
            outline: none;
            resize: vertical; 
            transition: all 0.3s ease;
        }
        textarea:focus { 
            border-color: #ff416c; 
            box-shadow: 0 0 15px rgba(255, 65, 108, 0.25); 
        }
        
        .error-msg {
            color: #f87171;
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.2);
            padding: 10px 14px;
            border-radius: 10px;
            font-size: 13px;
            margin-bottom: 16px;
            display: none;
            text-align: center;
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
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        .btn-obfuscate { 
            background: linear-gradient(135deg, #ff416c, #ff4b2b); 
            box-shadow: 0 6px 20px rgba(255, 65, 108, 0.35); 
        }
        .btn-obfuscate:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 8px 25px rgba(255, 65, 108, 0.5); 
        }
        .btn-obfuscate:active { transform: translateY(0); }
        
        .result-card { 
            margin-top: 20px; 
            background: rgba(10, 12, 18, 0.9); 
            padding: 16px; 
            border-radius: 14px; 
            border: 1px solid rgba(255, 255, 255, 0.08); 
            display: none; 
            animation: fadeIn 0.4s ease-in-out forwards;
        }
        .result-title { font-size: 12px; color: #6b7280; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
        .result-text { 
            word-break: break-all; 
            font-family: 'Fira Code', monospace; 
            font-size: 12px; 
            color: #38bdf8; 
            background: rgba(0, 0, 0, 0.3);
            padding: 10px;
            border-radius: 8px;
            border: 1px dashed rgba(56, 189, 248, 0.3);
        }
        
        .btn-copy { 
            background: linear-gradient(135deg, #10b981, #059669); 
            margin-top: 12px; 
            box-shadow: 0 6px 20px rgba(16, 185, 129, 0.25);
        }
        .btn-copy:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4); 
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <h1 class="logo-title">ENCRYPT X</h1>
            <div class="author-tag">
                <span>โดย ค่ายSOLARIS HUB</span> 
                <span>•</span>
                <a href="https://tiktok.com/@solaris_official1" target="_blank">🎵 TikTok Profile</a>
            </div>
            <p class="subtitle">Secure & Obfuscate Roblox Lua Scripts</p>
        </div>
        <div class="code-box">
            <textarea id="luaCode" placeholder="-- วางสคริปต์ Lua ของคุณที่นี่..."></textarea>
        </div>
        
        <div class="error-msg" id="errorMsg">⚠️ นี่ไม่ใช่โค้ดโปรดใส่โค้ด</div>

        <button class="btn btn-obfuscate" onclick="generateScript()">⚡ Encrypt Script</button>
        
        <div class="result-card" id="resultCard">
            <div class="result-title">Generated Loadstring:</div>
            <div class="result-text" id="output"></div>
            <button class="btn btn-copy" id="copyBtn" onclick="copyResult()">📋 คัดลอกสคริปต์</button>
        </div>
    </div>

    <script>
        let generatedUrl = "";

        async function generateScript() {
            const code = document.getElementById('luaCode').value;
            const errorMsg = document.getElementById('errorMsg');
            const resultCard = document.getElementById('resultCard');

            errorMsg.style.display = 'none';
            resultCard.style.display = 'none';

            if(!code.trim()) {
                errorMsg.innerText = '⚠️ กรุณาวางโค้ดก่อนครับ!';
                errorMsg.style.display = 'block';
                return;
            }

            const res = await fetch('/api/save-script', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code })
            });

            const data = await res.json();
            
            if(!res.ok || data.error) {
                errorMsg.innerText = '⚠️ ' + (data.error || 'นี่ไม่ใช่โค้ดโปรดใส่โค้ด');
                errorMsg.style.display = 'block';
                return;
            }
            
            generatedUrl = 'loadstring(game:HttpGet("' + window.location.origin + '/Scripts?Id=' + data.id + '"))("' + data.id + '")';
            
            const outDiv = document.getElementById('output');
            const copyBtn = document.getElementById('copyBtn');
            
            outDiv.innerText = generatedUrl;
            resultCard.style.display = 'block';
            copyBtn.innerText = '📋 คัดลอกสคริปต์';
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

app.post('/api/save-script', (req, res) => {
    const rawCode = req.body.code || '';
    
    // ตรวจสอบความถูกต้องของโค้ด
    if (!isValidLuaCode(rawCode)) {
        return res.status(400).json({ error: 'นี่ไม่ใช่โค้ดโปรดใส่โค้ด' });
    }

    const scriptId = Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
    const obfuscated = obfuscateLua(rawCode);
    
    fs.writeFileSync(path.join(DB_DIR, `${scriptId}.lua`), obfuscated);
    res.json({ id: scriptId });
});

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
app.listen(PORT, () => console.log('Server running onคัดลอกเรียบร้อยแล้ว
