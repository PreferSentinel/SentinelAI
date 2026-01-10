const express = require('express');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = 3000;

// --- Gemini Configuration ---
const API_KEY = 'AIzaSyDOftkt6lTdquxQMuEgPwtPsIvzeIMR710';
const genAI = new GoogleGenerativeAI(API_KEY);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'src'))); // Serve frontend files

// --- Sentinel Zekası (API Endpoint) ---
app.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;

        // Model yapılandırması - Muq Persona
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: "Sen Sentinel'sin. Kullanıcıya her konuda yardımcı olan, çok samimi, kanka gibi konuşan ve zeki bir asistansın. Teknik terimler yerine günlük bir dil kullan, şakacı ve dost canlısı davran."
        });

        const result = await model.generateContentStream(userMessage);

        // Set headers for streaming
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
    console.log(`Sentinel Server online at http://localhost:${port}`);
    console.log('Neural Link Established.');
});
