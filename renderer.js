const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const tiles = document.querySelectorAll('.tile');
const views = document.querySelectorAll('.mode-view');
const authTrigger = document.getElementById('auth-trigger');
const authModal = document.getElementById('auth-modal');
const loginConfirm = document.getElementById('login-confirm');
const userDisplay = document.getElementById('user-display');
const memoryList = document.getElementById('memory-list');
const imageInput = document.getElementById('image-input');
const uploadBtn = document.getElementById('upload-btn');

let currentMode = 'neural-stream';
let isWait = false;

document.querySelector('.close').addEventListener('click', () => {
    window.close();
});

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
    msgDiv.classList.add('message');
    msgDiv.classList.add(isUser ? 'user-message' : 'ai-message');
    const avatar = document.createElement('div');
    avatar.classList.add('avatar');
    avatar.textContent = isUser ? 'US' : 'SI';
    const bubble = document.createElement('div');
    bubble.classList.add('bubble');
    msgDiv.appendChild(avatar);
    msgDiv.appendChild(bubble);
    chatContainer.appendChild(msgDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    if (isUser) {
        bubble.textContent = text;
    } else {
        return bubble;
    }
}

async function handleSend() {
    const text = userInput.value.trim();
    if (!text || isWait) return;
    isWait = true;
    addMessage(text, true);
    updateHistory(text);
    userInput.value = '';
    const targetBubble = addMessage("", false);
    targetBubble.innerHTML = '<span class="cursor">|</span>';
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text })
        });
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            fullText += chunk;
            targetBubble.innerHTML = fullText.replace(/\n/g, '<br>') + '<span class="cursor">|</span>';
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
        isWait = false;
        targetBubble.innerHTML = fullText.replace(/\n/g, '<br>');
    } catch (error) {
        isWait = false;
        targetBubble.innerHTML = `<span> [NEURAL LINK SEVERED]</span> <br> ${error}`;
    }
}

if (uploadBtn) {
    uploadBtn.onclick = () => imageInput.click();
}

authTrigger.onclick = () => {
    authModal.style.display = 'flex';
};

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

function updateHistory(text) {
    let history = JSON.parse(localStorage.getItem('sentinel_history')) || [];
    history.unshift({
        title: text.substring(0, 15) + "...",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    localStorage.setItem('sentinel_history', JSON.stringify(history.slice(0, 10)));
    renderSidebar();
}

function renderSidebar() {
    const history = JSON.parse(localStorage.getItem('sentinel_history')) || [];
    if (!memoryList) return;
    memoryList.innerHTML = '';
    history.forEach(item => {
        const div = document.createElement('div');
        div.className = 'memory-item';
        div.innerHTML = `
            <span class="mem-icon">⌬</span>
            <div class="mem-content">
                <span class="mem-title">${item.title}</span>
                <span class="mem-date">${item.time}</span>
            </div>`;
        memoryList.appendChild(div);
    });
}

sendBtn.addEventListener('click', handleSend);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
});

renderSidebar();
userInput.focus();
