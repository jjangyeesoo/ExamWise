import express from 'express';
import db from '../config/db.js';
import translate from 'google-translate-api-next';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Define API routes here
router.get('/', (req, res) => {
    res.json({ message: 'Welcome to ExamWise API' });
});

// GET /api/questions - Fetch all questions (exclude soft deleted)
router.get('/questions', (req, res) => {
    const query = 'SELECT * FROM questions WHERE is_deleted = 0 ORDER BY number ASC';

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error fetching questions:', err.message);
            return res.status(500).json({ error: 'Failed to fetch questions' });
        }

        // Parse the JSON string fields back to arrays/objects before sending to client
        const formattedQuestions = rows.map(row => {
            // Ensure safe parsing of text into JSON
            let optionsArray = [];
            let answerArray = [];
            try {
                optionsArray = JSON.parse(row.options || '[]');
            } catch (e) {
                optionsArray = row.options;
            }
            try {
                answerArray = JSON.parse(row.answer || '[]');
            } catch (e) {
                answerArray = row.answer;
            }

            let keywordsArray = [];
            try {
                keywordsArray = JSON.parse(row.keywords || '[]');
            } catch (e) {
                keywordsArray = row.keywords;
            }

            return {
                ...row,
                options: optionsArray,
                answer: answerArray,
                keywords: keywordsArray
            };
        });

        res.json(formattedQuestions);
    });
});

// POST /api/questions - Create a new question
router.post('/questions', (req, res) => {
    const { type, category, question_en, question_ko, options, answer, explanation, keywords, number } = req.body;

    // Validate basic required fields
    if (!type || !category || !question_en || !options || !answer) {
        return res.status(400).json({ error: 'Missing required question fields.' });
    }

    const insertQuestion = (numberVal) => {
        const query = `
            INSERT INTO questions (number, type, category, question_en, question_ko, options, answer, explanation, keywords)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            numberVal,
            type,
            category,
            question_en,
            question_ko || '',
            JSON.stringify(options),
            JSON.stringify(answer),
            explanation || '',
            JSON.stringify(keywords || [])
        ];

        db.run(query, params, function (err) {
            if (err) {
                console.error('Error creating question:', err.message);
                return res.status(500).json({ error: 'Failed to create question' });
            }

            res.status(201).json({
                message: 'Question created successfully',
                id: this.lastID,
                number: numberVal
            });
        });
    };

    if (number !== undefined && number !== null) {
        insertQuestion(number);
    } else {
        // Calculate max number
        db.get("SELECT MAX(number) as maxNum FROM questions", [], (err, row) => {
            if (err) {
                console.error("Error fetching max number:", err.message);
                return res.status(500).json({ error: "Failed to calculate question number" });
            }
            const nextNum = row && row.maxNum ? row.maxNum + 1 : 1;
            insertQuestion(nextNum);
        });
    }
});

// PUT /api/questions/:id - Update an existing question
router.put('/questions/:id', (req, res) => {
    const { id } = req.params;
    const { type, category, question_en, question_ko, options, answer, explanation, keywords, number } = req.body;

    if (!type || !category || !question_en || !options || !answer) {
        return res.status(400).json({ error: 'Missing required question fields for update.' });
    }

    const query = `
        UPDATE questions 
        SET number = ?, type = ?, category = ?, question_en = ?, question_ko = ?, 
            options = ?, answer = ?, explanation = ?, keywords = ?
        WHERE id = ?
    `;

    const params = [
        number || null,
        type,
        category,
        question_en,
        question_ko || '',
        JSON.stringify(options),
        JSON.stringify(answer),
        explanation || '',
        JSON.stringify(keywords || []),
        id
    ];

    db.run(query, params, function (err) {
        if (err) {
            console.error('Error updating question:', err.message);
            return res.status(500).json({ error: 'Failed to update question' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Question not found' });
        }

        res.json({ message: 'Question updated successfully', id });
    });
});

// PATCH /api/questions/:id/bookmark - Toggle bookmark status
router.patch('/questions/:id/bookmark', (req, res) => {
    const { id } = req.params;
    const { is_bookmarked } = req.body;

    if (is_bookmarked === undefined) {
        return res.status(400).json({ error: 'Missing is_bookmarked status.' });
    }

    const query = 'UPDATE questions SET is_bookmarked = ? WHERE id = ?';
    db.run(query, [is_bookmarked ? 1 : 0, id], function (err) {
        if (err) {
            console.error('Error updating bookmark:', err.message);
            return res.status(500).json({ error: 'Failed to update bookmark status' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Question not found' });
        }

        res.json({ message: 'Bookmark status updated successfully', id, is_bookmarked });
    });
});

// POST /api/questions/bulk-delete - Soft delete multiple questions
router.post('/questions/bulk-delete', (req, res) => {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "No IDs provided for deletion" });
    }

    const placeholders = ids.map(() => '?').join(',');
    const query = `UPDATE questions SET is_deleted = 1 WHERE id IN (${placeholders})`;

    db.run(query, ids, function (err) {
        if (err) {
            console.error("Error bulk deleting questions:", err.message);
            return res.status(500).json({ error: "Failed to delete questions" });
        }
        res.json({ message: `Successfully deleted ${this.changes} questions`, deletedCount: this.changes });
    });
});

// POST /api/translate - Translate English text to Korean
router.post('/translate', async (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Text is required for translation' });
    }

    try {
        const response = await translate(text, { to: 'ko' });
        res.json({ translation: response.text });
    } catch (error) {
        console.error('Translation error:', error);
        // Fallback or send mock if library fails during development
        res.status(500).json({ error: 'Failed to translate', mock: `[AI 번역 실패 - ${text}]` });
    }
});

// POST /api/ai/analyze-image - Parse image using Gemini API
router.post('/ai/analyze-image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey === 'your_gemini_api_key_here') {
            return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in .env' });
        }

        console.log('Using API Key:', apiKey.substring(0, 5) + '...');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        const prompt = `이 PMP 문제 이미지를 분석해서 JSON으로 반환해줘. 구조는 {type, category, question_en, question_ko, options, answer, explanation, keywords}여야 해. 
정답은 배열 형태로 추출하고, 해설(explanation)은 무조건 한국어로 상세하게 작성해줘. 관련 키워드 3개를 포함해줘. 
category는 PMP의 3대 도메인인 'People', 'Process', 'Business Environment' 중 가장 적절한 하나로 분류해줘.
type은 'SINGLE' 또는 'MULTIPLE' 중 하나, options는 각 보기의 영어 원문과 한국어 번역을 포함하는 객체의 배열(예: [{"en": "영어 보기", "ko": "한국어 번역 보기"}]), answer는 정답 알파벳/숫자의 배열(예: ["A"] 또는 ["B", "C"]), keywords는 키워드 문자열의 배열이야.
다른 마크다운 코드블록 백틱이나 설명 없이 순수한 JSON 객체만 반환해.`;

        // Ensure mimetype is valid for Gemini (usually image/png, image/jpeg, image/webp)
        const validMimeTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'];
        const mimeType = validMimeTypes.includes(req.file.mimetype) ? req.file.mimetype : 'image/jpeg';

        const image = {
            inlineData: {
                data: req.file.buffer.toString("base64"),
                mimeType: mimeType,
            },
        };

        const result = await model.generateContent([prompt, image]);
        const responseText = result.response.text();

        // Remove potential markdown JSON block formatting if Gemini includes it
        const cleanJSONString = responseText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        const parsedData = JSON.parse(cleanJSONString);

        res.json(parsedData);
    } catch (error) {
        console.error('Gemini API Error details:', JSON.stringify(error, null, 2));

        let errMessage = '이미지 분석에 실패했습니다.';
        let statusCode = 500;
        if (error.status === 429 || (error.message && error.message.includes('429'))) {
            errMessage = 'AI 무료 티어 제공량(1분당 요청 한도)을 초과했습니다. 약 1분 후 다시 시도해주세요.';
            statusCode = 429;
        }

        res.status(statusCode).json({ error: errMessage, details: error.message });
    }
});

export default router;
