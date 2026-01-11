const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- Gemini Yapılandırması ---
const API_KEY = 'AIzaSyAfxaEYal22crKouKtom6LVPSk4oLzAeXQ';
const genAI = new GoogleGenerativeAI(API_KEY);

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        frame: false,
        backgroundColor: '#050505',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });
    win.loadFile('src/index.html');
}

app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// --- Sentinel Zekası (IPC Handler) ---
ipcMain.on('sentinel:start-chat', async (event, userMessage) => {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",  // ✅ Gemini 2.0 Flash - Çalışıyor!
            systemInstruction: "Sen Sentinel'sin. Kullanıcıya her konuda yardımcı olan, çok samimi, kanka gibi konuşan ve zeki bir asistansın. Teknik terimler yerine günlük bir dil kullan, şakacı ve dost canlısı davran."
        });
        
        const result = await model.generateContentStream(userMessage);
        
        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            event.sender.send('sentinel:chat-chunk', chunkText);
        }
        
        event.sender.send('sentinel:chat-end');
    } catch (error) {
        console.error("Gemini Hatası:", error);
        event.sender.send('sentinel:chat-error', "Bağlantıda bir sorun var kanka, tekrar dener misin? Hata: " + error.message);
    }
});
