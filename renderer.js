// DOM Elements
const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const tiles = document.querySelectorAll('.tile');
const views = document.querySelectorAll('.mode-view');

// State
let currentMode = 'neural-stream';
let isWait = false;

// --- Window Controls ---
document.querySelector('.close').addEventListener('click', () => {
    // Rely on user action or close event handling
    window.close();
});

// --- Tab/Mode Switching ---
tiles.forEach(tile => {
    tile.addEventListener('click', () => {
        // Remove active class from all
        tiles.forEach(t => t.classList.remove('active'));
        views.forEach(v => v.classList.remove('active'));

        // Add active to clicked
        tile.classList.add('active');
        currentMode = tile.getAttribute('data-mode');
        document.getElementById(currentMode).classList.add('active');

        // Announce mode change in chat if in neural stream or switching back
        if (currentMode === 'neural-stream') {
            // Optional: addSystemMessage(`[SYSTEM] MODE SWITCHED TO: ${currentMode.toUpperCase()}`);
        }
    });
});

// --- Neural Stream Logic ---
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
    msgDiv.appendChild(bubble); // Bubble added first for user message flow handled by CSS flex-direction: row-reverse

    chatContainer.appendChild(msgDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    if (isUser) {
        bubble.textContent = text;
    } else {
        return bubble; // Return bubble for streaming
    }
}

// --- Real-Time Streaming Handler ---
async function handleSend() {
    const text = userInput.value.trim();
    if (!text || isWait) return;

    isWait = true;
    addMessage(text, true);
    userInput.value = '';

    // Create a placeholder bubble for options
    const targetBubble = addMessage("", false);
    targetBubble.innerHTML = '<span class="cursor">|</span>';

    // Send to Backend via Fetch API
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

        // Finalize
        isWait = false;
        targetBubble.innerHTML = fullText.replace(/\n/g, '<br>');

    } catch (error) {
        isWait = false;
        targetBubble.innerHTML = `<span style:> [NEURAL LINK SEVERED]</span> <br> ${error}`;
    }
}

sendBtn.addEventListener('click', handleSend);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
});

userInput.focus();