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
        // 3) an array of {question,answer} objects
        if (Array.isArray(data.questions)) {
            knowledgeBase = data.questions;
        } else if (Array.isArray(data)) {
            knowledgeBase = data;
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

    userInput = userInput.toLowerCase();

    for (const item of knowledgeBase) {
        if (item && item.question) {
            const q = item.question.toLowerCase();

            // direct substring in either direction
            if (userInput.includes(q) || q.includes(userInput)) return item.answer;

            // simple word-overlap: count user words (len>2) that appear in stored question
            const userWords = userInput.split(/\s+/).filter(w => w.length > 2);
            let matchCount = 0;
            for (const w of userWords) if (q.includes(w)) matchCount++;
            if (matchCount >= 1) return item.answer;
        }
    }

    return "Sorry, I don't know that answer.";
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

    div.textContent = text;

    chatBox.appendChild(div);

    chatBox.scrollTop = chatBox.scrollHeight;
}

loadKnowledge();