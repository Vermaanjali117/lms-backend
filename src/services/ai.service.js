const Groq = require('groq-sdk');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// Helper function
const generateContent = async (prompt) => {
    const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 1024
    });
    return completion.choices[0]?.message?.content || '';
};

// 1. Course Recommendations
const getCourseRecommendations = async (enrolledCourses, availableCourses) => {
    const enrolledTitles = enrolledCourses.map(c => c.course?.title).join(', ');
    const availableTitles = availableCourses.map(c => `${c._id}:${c.title}`).join('\n');

    const prompt = `
    A student is enrolled in: ${enrolledTitles}
    
    Available courses:
    ${availableTitles}
    
    Recommend top 3 most relevant course IDs.
    Return ONLY a JSON array like: ["id1", "id2", "id3"]
    `;

    const text = await generateContent(prompt);
    const match = text.match(/\[.*?\]/s);
    if (match) return JSON.parse(match[0]);
    return [];
};

// 2. AI Quiz Generator
const generateQuiz = async (lessonTitle, lessonContent) => {
    const prompt = `
    Generate 5 multiple choice questions for:
    Title: ${lessonTitle}
    Content: ${lessonContent}
    
    Return ONLY JSON array:
    [
        {
            "question": "Question?",
            "options": ["A", "B", "C", "D"],
            "correctAnswer": 0
        }
    ]
    `;

    const text = await generateContent(prompt);
    const match = text.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
    return [];
};

// 3. AI Chatbot
const getChatResponse = async (message, courseContext) => {
    const prompt = `
    You are a helpful LMS learning assistant.
    ${courseContext ? `Student is studying: ${courseContext}` : ''}
    
    Student: ${message}
    
    Reply in 2-3 sentences. Be friendly and helpful.
    `;

    return await generateContent(prompt);
};

// 4. Course Description Generator
const generateCourseDescription = async (title, category) => {
    const prompt = `
    Write a professional 2-3 sentence course description for:
    Title: ${title}
    Category: ${category}
    
    Make it engaging and highlight what students will learn.
    `;

    return await generateContent(prompt);
};

module.exports = {
    getCourseRecommendations,
    generateQuiz,
    getChatResponse,
    generateCourseDescription
};