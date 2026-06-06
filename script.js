let knowledgeBase = [];
let knowledgeLoaded = false;

const sendBtn = document.getElementById("send-btn");
const input = document.getElementById("user-input");

// Start with send disabled until the knowledge base finishes loading
if (sendBtn) sendBtn.disabled = true;

async function loadKnowledge() {
    try {
        const response = await fetch("info.json");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        // Support multiple knowledge formats:
        // 1) { "questions": [ {"question": "...", "answer": "..."}, ... ] }
        // 2) { "keywords": ["office","duty phone"], "answer": "..." }
        // 3) { "entries": [ { "keywords": [...], "answer": "..." }, ... ] }
        // 4) an array of {question,answer} objects
        if (Array.isArray(data.questions)) {
            knowledgeBase = data.questions;
        } else if (Array.isArray(data)) {
            knowledgeBase = data;
        } else if (Array.isArray(data.entries)) {
            knowledgeBase = data.entries.flatMap((entry) => {
                if (!entry || !entry.answer) return [];

                if (Array.isArray(entry.keywords)) {
                    return entry.keywords.map((keyword) => ({
                        question: String(keyword),
                        answer: entry.answer,
                    }));
                }

                if (entry.question) {
                    return [{ question: String(entry.question), answer: entry.answer }];
                }

                return [];
            });
        } else if (Array.isArray(data.keywords) && data.answer) {
            knowledgeBase = data.keywords.map(k => ({ question: k, answer: data.answer }));
        } else if (data.question && data.answer) {
            knowledgeBase = [{ question: data.question, answer: data.answer }];
        } else {
            knowledgeBase = [];
        }
        console.log(`Loaded knowledge entries: ${knowledgeBase.length}`, knowledgeBase);
    } catch (err) {
        console.error("Failed to load knowledge base:", err);
        addMessage("Failed to load knowledge base.", "bot");
        knowledgeBase = [];
    } finally {
        knowledgeLoaded = true;
        if (sendBtn) sendBtn.disabled = false;
    }
}

function findAnswer(userInput) {
    if (!userInput) return "Sorry, I don't know that answer.";

    userInput = userInput.toLowerCase().trim();
    let bestAnswer = null;
    let bestScore = 0;

    for (const item of knowledgeBase) {
        if (!item || !item.question) continue;

        const q = item.question.toLowerCase().trim();
        let score = 0;

        // direct exact or phrase containment gets the strongest score
        if (userInput === q) {
            score = 1000 + q.length;
        } else if (userInput.includes(q)) {
            score = 800 + q.length;
        } else if (q.includes(userInput)) {
            score = 600 + userInput.length;
        } else {
            // simple word-overlap: count user words that appear in the stored question
            const userWords = userInput.split(/\s+/).filter(w => w.length > 2);
            let matchCount = 0;
            for (const w of userWords) if (q.includes(w)) matchCount++;
            if (matchCount > 0) {
                score = 100 + matchCount * 10 + q.length;
            }
        }

        if (score > bestScore) {
            bestScore = score;
            bestAnswer = item.answer;
        }
    }

    return bestAnswer ?? "Sorry, I don't know that answer.";
}

if (sendBtn) sendBtn.addEventListener("click", sendMessage);
if (input) {
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendMessage();
    });
}

function sendMessage() {
    if (!knowledgeLoaded) {
        addMessage("Please wait, knowledge base is loading...", "bot");
        return;
    }

    const question = input.value.trim();
    if (!question) return;

    addMessage(question, "user");

    const answer = findAnswer(question);

    addMessage(answer, "bot");

    input.value = "";
}

function addMessage(text, type) {
    const chatBox = document.getElementById("chat-box");
    const div = document.createElement("div");

    div.classList.add("message");
    div.classList.add(type);

    const normalizedText = String(text).replace(/\\n/g, "\n");
    const lines = normalizedText.split(/\r?\n/);

    lines.forEach((line, index) => {
        if (index > 0) {
            div.appendChild(document.createElement("br"));
        }

        div.appendChild(document.createTextNode(line));
    });

    chatBox.appendChild(div);

    chatBox.scrollTop = chatBox.scrollHeight;
}

loadKnowledge();