// State Management
let activeTab = 'dashboard';
let showConfetti = false;
let burnoutLevel = 30;
let showAIModal = false;
let aiMode = 'planner'; // 'planner' or 'translator'
let aiInput = '';
let isGenerating = false;
let aiResult = null;
let aiError = null;

// Tasks Data
let tasks = [
    { id: 1, title: 'Pharmacy Pickup', assignee: 'Sarah', due: 'Today, 5:00 PM', status: 'pending', priority: 'high', points: 50 },
    { id: 2, title: 'Call Insurance', assignee: null, due: 'Tomorrow', status: 'open', priority: 'medium', points: 100 },
    { id: 3, title: 'Grocery Run', assignee: 'Mike', due: 'Wed, Oct 24', status: 'completed', priority: 'low', points: 75 },
    { id: 4, title: 'Lawn Mowing', assignee: null, due: 'Sat, Oct 27', status: 'open', priority: 'low', points: 150 },
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderTasks();
    setupBurnoutSlider();
    lucide.createIcons();
});

// Render Tasks
function renderTasks() {
    const tasksList = document.getElementById('tasksList');
    tasksList.innerHTML = tasks.map(task => `
        <div class="task-item ${task.status === 'completed' ? 'completed' : ''}">
            <div class="task-content">
                <div class="task-left">
                    <div class="task-checkbox ${task.status === 'completed' ? 'completed' : ''}">
                        ${task.status === 'completed' ? '<i data-lucide="check-square"></i>' : ''}
                    </div>
                    <div class="task-info">
                        <h4 class="${task.status === 'completed' ? 'completed' : ''}">${task.title}</h4>
                        <div class="task-meta">
                            <span><i data-lucide="clock"></i> ${task.due}</span>
                            ${task.points ? `<span class="points">${task.points} pts</span>` : ''}
                            ${task.priority ? `<span class="priority-badge priority-${task.priority}">${task.priority}</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="task-right">
                    ${task.assignee 
                        ? `<div>
                            <span style="font-size: 0.75rem; color: #94a3b8;">Assigned to</span>
                            <span class="assignee-badge ${task.assignee === 'You' ? 'assignee-blue' : 'assignee-green'}">${task.assignee}</span>
                           </div>`
                        : `<button class="btn-claim" onclick="handleClaimTask(${task.id})">Claim</button>`
                    }
                </div>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

// Handle Claim Task
function handleClaimTask(id) {
    tasks = tasks.map(t => 
        t.id === id ? { ...t, assignee: 'You', status: 'pending' } : t
    );
    renderTasks();
    triggerConfetti();
}

// Trigger Confetti
function triggerConfetti() {
    const confetti = document.getElementById('confetti');
    confetti.style.display = 'flex';
    setTimeout(() => {
        confetti.style.display = 'none';
    }, 2000);
}

// Setup Burnout Slider
function setupBurnoutSlider() {
    const slider = document.getElementById('burnoutSlider');
    const valueDisplay = document.getElementById('burnoutValue');
    const warning = document.getElementById('burnoutWarning');
    
    slider.addEventListener('input', (e) => {
        burnoutLevel = parseInt(e.target.value);
        valueDisplay.textContent = `${burnoutLevel}%`;
        
        if (burnoutLevel < 35) {
            warning.style.display = 'flex';
        } else {
            warning.style.display = 'none';
        }
    });
}

// Open AI Modal
function openAIModal(mode) {
    aiMode = mode;
    aiInput = '';
    aiResult = null;
    aiError = null;
    showAIModal = true;
    
    const modal = document.getElementById('aiModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalSubtitle = document.getElementById('modalSubtitle');
    const modalIcon = document.getElementById('modalIcon');
    const modalBody = document.getElementById('modalBody');
    const modalFooter = document.getElementById('modalFooter');
    
    // Update modal header
    if (mode === 'planner') {
        modalTitle.textContent = 'AI Task Planner';
        modalSubtitle.textContent = 'Powered by Gemini';
        modalIcon.className = 'modal-icon planner';
        modalIcon.innerHTML = '<i data-lucide="sparkles"></i>';
    } else {
        modalTitle.textContent = 'Medical Translator';
        modalSubtitle.textContent = 'Simplifying complex terms';
        modalIcon.className = 'modal-icon translator';
        modalIcon.innerHTML = '<i data-lucide="brain-circuit"></i>';
    }
    
    // Render modal body
    modalBody.innerHTML = `
        <div class="space-y-4">
            <label style="display: block; font-size: 0.875rem; font-weight: 500; color: #334155; margin-bottom: 0.5rem;">
                ${mode === 'planner' 
                    ? "What big event or goal is happening?" 
                    : "Paste a medical term or confusing sentence:"}
            </label>
            <textarea 
                id="aiInputField"
                class="modal-input"
                placeholder="${mode === 'planner' 
                    ? "Ex: Mom is coming home from knee surgery on Friday..." 
                    : "Ex: What does 'idiopathic hypertension' actually mean?"}"
            ></textarea>
            ${aiError ? `<p class="error-message">${aiError}</p>` : ''}
        </div>
    `;
    
    // Render modal footer
    modalFooter.innerHTML = `
        <button 
            id="generateBtn"
            class="btn-generate"
            onclick="handleGenerate()"
        >
            <i data-lucide="sparkles"></i> Magic Generate
        </button>
    `;
    
    modal.style.display = 'flex';
    lucide.createIcons();
    
    // Focus on input and sync value
    setTimeout(() => {
        const input = document.getElementById('aiInputField');
        if (input) {
            input.value = aiInput;
            input.focus();
            // Add input listener to sync state
            input.addEventListener('input', (e) => {
                aiInput = e.target.value;
            });
        }
    }, 100);
}

// Close AI Modal
function closeAIModal() {
    showAIModal = false;
    document.getElementById('aiModal').style.display = 'none';
}

// Handle Generate
async function handleGenerate() {
    const inputField = document.getElementById('aiInputField');
    if (!inputField) return;
    
    aiInput = inputField.value.trim();
    if (!aiInput) return;
    
    isGenerating = true;
    aiError = null;
    aiResult = null;
    
    const modalBody = document.getElementById('modalBody');
    const modalFooter = document.getElementById('modalFooter');
    const generateBtn = document.getElementById('generateBtn');
    
    // Update button to show loading
    if (generateBtn) {
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<i data-lucide="loader-2" class="spinner"></i> Generating...';
        lucide.createIcons();
    }
    
    let systemPrompt = "";
    let userPrompt = aiInput;
    
    if (aiMode === 'planner') {
        systemPrompt = "You are a helpful family care coordinator. Break down the user's situation into 3-4 specific, actionable, single-person tasks that siblings can claim. Assign 'points' (50-200) based on difficulty. Suggest a short due date string (e.g., 'Tomorrow').";
    } else {
        systemPrompt = "You are a compassionate medical translator for family caregivers. Explain the medical term or bill snippet provided by the user in simple, plain English. Be reassuring but accurate. Keep it under 60 words.";
    }
    
    try {
        const result = await callGemini(userPrompt, systemPrompt);
        aiResult = result;
        renderAIResult();
    } catch (err) {
        aiError = "Failed to generate. Please try again.";
        // Fallback for demo purposes if API fails
        if (aiMode === 'planner') {
            aiResult = [
                { title: "Research condition online", points: 50, priority: "low", due: "This week" },
                { title: "Schedule follow-up appt", points: 100, priority: "high", due: "Tomorrow" },
                { title: "Pick up new prescriptions", points: 75, priority: "medium", due: "Today" }
            ];
        } else {
            aiResult = "This appears to be a standard term for high blood pressure with no known specific cause. It's very common and usually managed with lifestyle changes and medication. Don't worry!";
        }
        renderAIResult();
    } finally {
        isGenerating = false;
    }
}

// Call Gemini API
async function callGemini(prompt, systemPrompt) {
    // TODO: Add your Gemini API key here
    // Get one at: https://makersuite.google.com/app/apikey
    const apiKey = ""; // Add your API key here
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    
    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] }
    };
    
    if (aiMode === 'planner') {
        payload.generationConfig = {
            responseMimeType: "application/json",
            responseSchema: {
                type: "ARRAY",
                items: {
                    type: "OBJECT",
                    properties: {
                        title: { type: "STRING" },
                        points: { type: "INTEGER" },
                        priority: { type: "STRING", enum: ["high", "medium", "low"] },
                        due: { type: "STRING" }
                    }
                }
            }
        };
    }
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || 'API Error');
        
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        return aiMode === 'planner' ? JSON.parse(text) : text;
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
}

// Render AI Result
function renderAIResult() {
    const modalBody = document.getElementById('modalBody');
    const modalFooter = document.getElementById('modalFooter');
    
    if (aiMode === 'planner') {
        modalBody.innerHTML = `
            <div class="space-y-4">
                <p style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.75rem;">
                    Here is a suggested plan. Click "Add" to put these in the group list.
                </p>
                <div class="space-y-2">
                    ${aiResult.map((t, i) => `
                        <div class="generated-task">
                            <div class="generated-task-info">
                                <p>${t.title}</p>
                                <div class="generated-task-meta">
                                    <span>${t.due}</span>
                                    <span style="font-weight: 500; color: #4f46e5;">${t.points} pts</span>
                                </div>
                            </div>
                            <span class="priority-badge priority-${t.priority}">${t.priority}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        modalFooter.innerHTML = `
            <button class="btn-secondary" onclick="resetAIInput()">Start Over</button>
            <button class="btn-add-tasks" onclick="addGeneratedTasks()">Add Tasks</button>
        `;
    } else {
        modalBody.innerHTML = `
            <div class="translator-result">
                <h4>
                    <i data-lucide="sparkles"></i> Simplified Explanation
                </h4>
                <p>${aiResult}</p>
            </div>
        `;
        
        modalFooter.innerHTML = `
            <button class="btn-secondary" onclick="resetAIInput()">Start Over</button>
        `;
    }
    
    lucide.createIcons();
}

// Reset AI Input
function resetAIInput() {
    aiResult = null;
    aiError = null;
    openAIModal(aiMode);
}

// Add Generated Tasks
function addGeneratedTasks() {
    if (!aiResult || !Array.isArray(aiResult)) return;
    
    const newTasks = aiResult.map((t, idx) => ({
        id: Date.now() + idx,
        ...t,
        status: 'open',
        assignee: null
    }));
    
    tasks = [...tasks, ...newTasks];
    renderTasks();
    closeAIModal();
    triggerConfetti();
}

// Set Active Tab
function setActiveTab(tab, element) {
    activeTab = tab;
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => btn.classList.remove('active'));
    if (element) {
        element.classList.add('active');
    }
}

// Close modal on outside click
document.addEventListener('click', (e) => {
    const modal = document.getElementById('aiModal');
    if (e.target === modal) {
        closeAIModal();
    }
});

// Handle Enter key in textarea
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey && showAIModal && !isGenerating) {
        handleGenerate();
    }
});

