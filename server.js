require('dotenv').config();
const express = require('express');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = 3000;

// ✅ Güvenli API Key Yönetimi
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error('❌ HATA: .env dosyasında GEMINI_API_KEY bulunamadı!');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname))); 

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Sentinel Zekası (API Endpoint) ---
app.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-pro",
            systemInstruction: "Sen Sentinel'sin. Kullanıcıya her konuda yardımcı olan, çok samimi, kanka gibi konuşan ve zeki bir asistansın. Teknik terimler yerine günlük bir dil kullan, şakacı ve dost canlısı davran."
        });
        
        const result = await model.generateContentStream(userMessage);
        
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');
        
        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            res.write(chunkText);
        }
        
        res.end();
    } catch (error) {
        console.error("Gemini Hatası:", error);
        res.status(500).send("Bağlantıda bir sorun var kanka, tekrar dener misin? Hata: " + error.message);
    }
});

app.listen(port, () => {
    console.log(`✅ Sentinel Server online at http://localhost:${port}`);
    console.log('🔗 Neural Link Established.');
});
