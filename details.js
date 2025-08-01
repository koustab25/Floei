// Configuration
const STEPS = 3;
let currentStep = 1;

document.addEventListener('DOMContentLoaded', () => {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() - 1);
    
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 5);
    
    document.getElementById('lastPeriodStart').valueAsDate = startDate;
    document.getElementById('lastPeriodEnd').valueAsDate = endDate;
    
    document.getElementById('completeSetup').addEventListener('click', completeOnboarding);
});

function nextStep(step) {
    if (!validateStep(step)) return;
    
    document.getElementById(`step${step}`).classList.remove('active');
    currentStep = step + 1;
    updateProgress();
    document.getElementById(`step${currentStep}`).classList.add('active');
}

function prevStep(step) {
    document.getElementById(`step${step}`).classList.remove('active');
    currentStep = step - 1;
    updateProgress();
    document.getElementById(`step${currentStep}`).classList.add('active');
}

function updateProgress() {
    document.getElementById('progressFill').style.width = `${(currentStep / STEPS) * 100}%`;
    
    document.querySelectorAll('.step').forEach((step, index) => {
        step.classList.toggle('active', index < currentStep);
    });
}

function validateStep(step) {
    if (step === 1) {
        const name = document.getElementById('firstName').value.trim();
        const weight = document.getElementById('weight').value.trim();
        const height = document.getElementById('height').value.trim();
        if (!name || !weight || !height) {
            showError("Please Fill Required Details");
            return false;
        }
        return true;
    }
    else if (step === 2) {
        const start = document.getElementById('lastPeriodStart').value;
        const end = document.getElementById('lastPeriodEnd').value;
        
        if (!start || !end) {
            showError("Please select both dates");
            return false;
        }
        
        if (new Date(start) > new Date(end)) {
            showError("End date must be after start date");
            return false;
        }
        
        return true;
    }
    return true;
}

function showError(message) {
    alert(message);
}
//completeOnboarding function 
async function completeOnboarding() {
    const cycleLength = parseInt(document.getElementById('cycleLength').value);
    
    if (cycleLength < 21 || cycleLength > 45) {
        showError("Cycle length should be between 21-45 days");
        return;
    }
    
    const userProfile = {
        name: document.getElementById('firstName').value.trim(),
        weight : document.getElementById('weight').value.trim(),
        height :document.getElementById('height').value.trim(),
        lastPeriod: {
            start: document.getElementById('lastPeriodStart').value,
            end: document.getElementById('lastPeriodEnd').value

        },
        cycleLength: cycleLength,
        createdAt: new Date().toISOString()
       
    };
    
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    
    const firstLog = {
        startDate: userProfile.lastPeriod.start,
        endDate: userProfile.lastPeriod.end,
        flow: "medium",
        symptoms: [],
        notes: "Initial period log",
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('periodLogs', JSON.stringify([firstLog]));
    
    window.location.href = "personalizing.html";
}
