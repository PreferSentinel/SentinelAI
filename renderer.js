const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const newChatBtn = document.getElementById('new-chat-btn');
const memoryList = document.getElementById('memory-list');
const tiles = document.querySelectorAll('.tile');
const views = document.querySelectorAll('.mode-view');
const authTrigger = document.getElementById('auth-trigger');
const authModal = document.getElementById('auth-modal');
const loginConfirm = document.getElementById('login-confirm');
const userDisplay = document.getElementById('user-display');
const imageInput = document.getElementById('image-input');
const uploadBtn = document.getElementById('upload-btn');

let sessions = JSON.parse(localStorage.getItem('sentinel_sessions')) || [];
let currentSessionId = null;
let isWait = false;

// Kapatma Butonu
document.querySelector('.close').addEventListener('click', () => window.close());

// Mod Değiştirme
tiles.forEach(tile => {
    tile.addEventListener('click', () => {
        tiles.forEach(t => t.classList.remove('active'));
        views.forEach(v => v.classList.remove('active'));
        tile.classList.add('active');
        const mode = tile.getAttribute('data-mode');
        document.getElementById(mode).classList.add('active');
    });
});

function addMessage(text, isUser = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
    msgDiv.innerHTML = `<div class="avatar">${isUser ? 'US' : 'SI'}</div><div class="bubble">${text.replace(/\n/g, '<br>')}</div>`;
    chatContainer.appendChild(msgDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return msgDiv.querySelector('.bubble');
}

function startNewChat() {
    currentSessionId = null;
    chatContainer.innerHTML = '';
    addMessage("System initialized. Sentinel API online. Awaiting commands.", false);
    renderSidebar();
}

function saveToSession(userText, aiText) {
    if (!currentSessionId) {
        currentSessionId = Date.now();
        sessions.unshift({
            id: currentSessionId,
            title: userText.substring(0, 15) + "...",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            messages: []
        });
    }
    const session = sessions.find(s => s.id === currentSessionId);
    if (session) {
        session.messages.push({ role: 'user', content: userText }, { role: 'ai', content: aiText });
        localStorage.setItem('sentinel_sessions', JSON.stringify(sessions));
        renderSidebar();
    }
}

function renderSidebar() {
    if (!memoryList) return;
    memoryList.innerHTML = '';
    sessions.forEach(s => {
        const div = document.createElement('div');
        div.className = `memory-item ${s.id === currentSessionId ? 'active' : ''}`;
        div.style.border = s.id === currentSessionId ? '1px solid #00f2ff' : 'none';
        div.innerHTML = `<span class="mem-icon">⌬</span><div class="mem-content"><span class="mem-title">${s.title}</span><span class="mem-date">${s.time}</span></div>`;
        div.onclick = () => loadSession(s.id);
        memoryList.appendChild(div);
    });
}

function loadSession(id) {
    const session = sessions.find(s => s.id === id);
    if (!session) return;
    currentSessionId = id;
    chatContainer.innerHTML = '';
    session.messages.forEach(m => addMessage(m.content, m.role === 'user'));
    renderSidebar();
}

// HATAYI DÜZELTEN ASIL FONKSİYON
async function handleSend() {
    const text = userInput.value.trim();
    if (!text || isWait) return;
    isWait = true;

    addMessage(text, true);
    userInput.value = '';

    const targetBubble = addMessage("", false);
    targetBubble.innerHTML = '<span class="cursor">|</span>';
    let fullAiResponse = "";

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text })
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            fullAiResponse += chunk;
            targetBubble.innerHTML = fullAiResponse.replace(/\n/g, '<br>') + '<span class="cursor">|</span>';
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        targetBubble.innerHTML = fullAiResponse.replace(/\n/g, '<br>');
        saveToSession(text, fullAiResponse);
    } catch (error) {
        targetBubble.innerHTML = `<span style="color:#ff4b4b; font-weight:bold;">[NEURAL LINK SEVERED]</span><br><small>${error.message}</small>`;
    } finally {
        isWait = false;
    }
}

newChatBtn.onclick = startNewChat;
sendBtn.onclick = handleSend;
userInput.onkeypress = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

authTrigger.onclick = () => authModal.style.display = 'flex';
loginConfirm.onclick = () => {
    const name = document.getElementById('username-input').value;
    if (name) {
        localStorage.setItem('sentinel_user', name);
        userDisplay.innerText = name.toUpperCase();
        authModal.style.display = 'none';
    }
};

if (uploadBtn) uploadBtn.onclick = () => imageInput.click();

const savedUser = localStorage.getItem('sentinel_user');
if (savedUser) userDisplay.innerText = savedUser.toUpperCase();

renderSidebar();
startNewChat();
