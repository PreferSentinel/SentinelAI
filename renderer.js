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
let currentMode = 'neural-stream';

document.querySelector('.close').addEventListener('click', () => window.close());

tiles.forEach(tile => {
    tile.addEventListener('click', () => {
        tiles.forEach(t => t.classList.remove('active'));
        views.forEach(v => v.classList.remove('active'));
        tile.classList.add('active');
        currentMode = tile.getAttribute('data-mode');
        document.getElementById(currentMode).classList.add('active');
    });
});

function addMessage(text, isUser = false) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', isUser ? 'user-message' : 'ai-message');
    const avatar = document.createElement('div');
    avatar.classList.add('avatar');
    avatar.textContent = isUser ? 'US' : 'SI';
    const bubble = document.createElement('div');
    bubble.classList.add('bubble');
    bubble.innerHTML = text.replace(/\n/g, '<br>');
    msgDiv.appendChild(avatar);
    msgDiv.appendChild(bubble);
    chatContainer.appendChild(msgDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    if (!isUser) return bubble;
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
        const newSession = {
            id: currentSessionId,
            title: userText.substring(0, 18) + '...',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            messages: []
        };
        sessions.unshift(newSession);
    }
    const sessionIndex = sessions.findIndex(s => s.id === currentSessionId);
    if (sessionIndex > -1) {
        if (userText) sessions[sessionIndex].messages.push({ role: 'user', content: userText });
        if (aiText) sessions[sessionIndex].messages.push({ role: 'ai', content: aiText });
        const updatedSession = sessions.splice(sessionIndex, 1)[0];
        updatedSession.time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        sessions.unshift(updatedSession);
        localStorage.setItem('sentinel_sessions', JSON.stringify(sessions));
        renderSidebar();
    }
}

function renderSidebar() {
    if (!memoryList) return;
    memoryList.innerHTML = '';
    sessions.forEach(session => {
        const div = document.createElement('div');
        div.className = `memory-item ${session.id === currentSessionId ? 'active' : ''}`;
        if(session.id === currentSessionId) div.style.border = '1px solid #00f2ff';
        div.innerHTML = `
            <span class="mem-icon">⌬</span>
            <div class="mem-content">
                <span class="mem-title">${session.title}</span>
                <span class="mem-date">${session.time}</span>
            </div>`;
        div.onclick = () => loadSession(session.id);
        memoryList.appendChild(div);
    });
}

function loadSession(id) {
    const session = sessions.find(s => s.id === id);
    if (!session) return;
    currentSessionId = id;
    chatContainer.innerHTML = '';
    session.messages.forEach(msg => {
        addMessage(msg.content, msg.role === 'user');
    });
    renderSidebar();
}

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
        isWait = false;
        targetBubble.innerHTML = fullAiResponse.replace(/\n/g, '<br>');
        saveToSession(text, fullAiResponse);
    } catch (error) {
        isWait = false;
        targetBubble.innerHTML = `<span style="color:red">[NEURAL LINK SEVERED]</span><br>${error}`;
        saveToSession(text, "[Error]");
    }
}

if (newChatBtn) newChatBtn.onclick = startNewChat;
sendBtn.onclick = handleSend;
userInput.onkeypress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
};

if (uploadBtn) uploadBtn.onclick = () => imageInput.click();
authTrigger.onclick = () => authModal.style.display = 'flex';
loginConfirm.onclick = () => {
    const name = document.getElementById('username-input').value;
    if (name) {
        localStorage.setItem('sentinel_user', name);
        userDisplay.innerText = name.toUpperCase();
        authModal.style.display = 'none';
    }
};

const savedUser = localStorage.getItem('sentinel_user');
if (savedUser) userDisplay.innerText = savedUser.toUpperCase();

renderSidebar();
startNewChat();
