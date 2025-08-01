// chatbot.js (load this on all pages)
class FloeiChatbot {
  constructor() {
    this.userData = this.loadUserData();
    this.context = {};
    this.initElements();
    this.setupEventListeners();
    this.loadConversationHistory();
  }

  initElements() {
    this.icon = document.getElementById('chatbotIcon');
    this.container = document.getElementById('chatbotContainer');
    this.messages = document.getElementById('chatbotMessages');
    this.input = document.getElementById('chatbotInput');
    this.sendBtn = document.getElementById('chatbotSend');
    this.quickReplies = document.getElementById('chatbotQuickReplies');
  }

  setupEventListeners() {
    this.icon.addEventListener('click', () => this.toggleChatbot());
    this.sendBtn.addEventListener('click', () => this.sendMessage());
    this.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });
  }

  toggleChatbot() {
    this.container.style.display = this.container.style.display === 'flex' ? 'none' : 'flex';
    if (this.container.style.display === 'flex') this.input.focus();
  }

  sendMessage() {
    const text = this.input.value.trim();
    if (text) {
      this.addMessage(text, 'user');
      this.processUserMessage(text);
      this.input.value = '';
      this.saveConversation();
    }
  }

  async processUserMessage(text) {
    // 1. Check for direct commands
    if (this.handleCommands(text)) return;
    
    // 2. Understand context
    const intent = await this.detectIntent(text);
    
    // 3. Generate response
    const response = await this.generateResponse(intent, text);
    
    // 4. Display response
    this.addMessage(response.text, 'bot');
    this.showQuickReplies(response.quickReplies);
    this.saveConversation();
  }

  async detectIntent(text) {
    // Simple NLP - can be enhanced with API calls later
    const lowerText = text.toLowerCase();
    
    // Check for greetings
    if (['hi','hello','hey'].some(t => lowerText.includes(t))) 
      return 'greeting';
    
    // Check for period-related questions
    if (['late','when','why','period'].some(t => lowerText.includes(t)))
      return 'period_question';
    
    // Check for symptom queries
    if (['pain','cramp','symptom','feel'].some(t => lowerText.includes(t)))
      return 'symptom_inquiry';
      
    // Default to general chat
    return 'general';
  }

  async generateResponse(intent, userText) {
    // Get user's cycle data
    const cycleData = this.getCycleData();
    const dayInCycle = cycleData?.dayInCycle || 0;
    const isLate = cycleData?.isLate || false;
    
    // Response templates
    const responses = {
      greeting: [
        `Hello lovely! ${isLate ? "I see your period is running late. How are you feeling?" : "How can I help you today?"}`,
        `Hi there! ${dayInCycle ? `You're on day ${dayInCycle} of your cycle.` : ''} What's on your mind?`
      ],
      period_question: [
        `Based on your cycle history, your period is ${isLate ? `${cycleData.daysLate} days late` : 'expected soon'}.`,
        `Cycle variations are completely normal! ${isLate ? 'Your period being late could be due to stress, lifestyle changes, or other factors.' : ''}`
      ],
      symptom_inquiry: [
        `The symptoms you're experiencing could be related to ${this.getCurrentPhase()}. Would you like to log them?`,
        `I can help you track symptoms. ${dayInCycle ? `Since you're on day ${dayInCycle}, this might be ${this.getPhaseDescription()}` : ''}`
      ],
      general: [
        "I'm here to help with your cycle questions. What would you like to know?",
        "How can I support you today?"
      ]
    };
    
    return {
      text: responses[intent][Math.floor(Math.random() * responses[intent].length)],
      quickReplies: this.getQuickReplies(intent)
    };
  }

  getQuickReplies(intent) {
    const replies = {
      greeting: ["Ask about my cycle", "Log symptoms", "I'm feeling anxious"],
      period_question: ["Why late?", "When to worry?", "Relaxation tips"],
      symptom_inquiry: ["Log symptoms", "Remedy suggestions", "It's normal?"],
      general: ["Cycle info", "My stats", "Settings help"]
    };
    return replies[intent] || ["I understand", "Tell me more", "Thanks"];
  }

  // Additional smart features
  getCycleData() {
    // Integrate with your existing cycle calculation logic
    const profile = JSON.parse(localStorage.getItem('userProfile'));
    const logs = JSON.parse(localStorage.getItem('periodLogs')) || [];
    
    if (logs.length) {
      const lastPeriod = logs[logs.length - 1];
      const lastStart = new Date(lastPeriod.startDate);
      const today = new Date();
      
      const cycleLength = profile?.cycleLength || 28;
      const expectedNext = new Date(lastStart);
      expectedNext.setDate(lastStart.getDate() + cycleLength);
      
      const daysLate = Math.floor((today - expectedNext) / (86400000));
      const dayInCycle = Math.floor((today - lastStart) / (86400000)) + 1;
      
      return {
        daysLate,
        dayInCycle,
        isLate: daysLate > 0
      };
    }
    return null;
  }

  getCurrentPhase() {
    // Use your existing phase calculation logic
    const phase = localStorage.getItem("currentPhase") || "Unknown";
    return phase.toLowerCase() + " phase";
  }

  // ... rest of the methods (addMessage, showQuickReplies, etc.)
}

// Initialize chatbot when DOM loads
document.addEventListener('DOMContentLoaded', () => {
  window.floeiChatbot = new FloeiChatbot();
});