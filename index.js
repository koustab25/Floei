document.addEventListener('DOMContentLoaded', () => {
// 🔥 Show "Updating your cycle" animation if coming from log page
if (sessionStorage.getItem('justLogged')) {
  const animation = document.createElement('div');
  animation.className = 'calculating-animation';
  
  // Create floating organic shapes
  const shapesHTML = Array.from({length: 9}, (_, i) => {
    const shapeType = i % 3 === 0 ? 'blob' : (i % 3 === 1 ? 'wave' : 'circle');
    const size = Math.random() * 20 + 10;
    const duration = Math.random() * 5 + 5;
    const delay = Math.random() * 3;
    
    return `
      <div class="floating-shape ${shapeType}" style="
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        width: ${size}px;
        height: ${size}px;
        animation-duration: ${duration}s;
        animation-delay: ${delay}s;
        opacity: ${Math.random() * 0.4 + 0.1};
        filter: blur(${Math.random() * 3 + 1}px);
      "></div>
    `;
  }).join('');
  
  animation.innerHTML = `
    <div class="calculating-content">
      <div class="modern-loader">
        <div class="pulse-circle"></div>
        <div class="rotating-arc"></div>
        <div class="inner-dots">
          <div class="dot dot-1"></div>
          <div class="dot dot-2"></div>
          <div class="dot dot-3"></div>
        </div>
      </div>
      <h3 class="calculating-text">Analyzing your cycle</h3>
      <div class="progress-container">
        <div class="progress-bar">
          <div class="progress-fill"></div>
        </div>
        <div class="progress-percentage">0%</div>
      </div>
      <div class="floating-shapes">${shapesHTML}</div>
    </div>
  `;
  
  document.body.appendChild(animation);
  
  // Animate progress percentage
  let progress = 0;
  const progressFill = animation.querySelector('.progress-fill');
  const progressPercent = animation.querySelector('.progress-percentage');
  const progressInterval = setInterval(() => {
    progress += Math.random() * 10 + 5;
    if (progress > 100) progress = 100;
    progressFill.style.width = `${progress}%`;
    progressPercent.textContent = `${Math.floor(progress)}%`;
    
    if (progress === 100) {
      clearInterval(progressInterval);
    }
  }, 200);

  // Add gentle background animation
  animation.style.background = `
    radial-gradient(circle at ${Math.random() * 100}% ${Math.random() * 100}%, 
    rgba(255,183,197,0.1) 0%, transparent 20%),
    radial-gradient(circle at ${Math.random() * 100}% ${Math.random() * 100}%, 
    rgba(255,107,139,0.1) 0%, transparent 20%),
    rgba(255, 245, 248, 0.95)
  `;

  setTimeout(() => {
    animation.style.opacity = '0';
    setTimeout(() => {
      animation.remove();
      sessionStorage.removeItem('justLogged');
    }, 800);
  }, 3000);
  
  // Add gentle background animation
  animation.style.background = `
    radial-gradient(circle at ${Math.random() * 100}% ${Math.random() * 100}%, 
    rgba(255,183,197,0.2) 0%, transparent 20%),
    radial-gradient(circle at ${Math.random() * 100}% ${Math.random() * 100}%, 
    rgba(255,107,139,0.2) 0%, transparent 20%),
    rgba(255, 245, 248, 0.9)
  `;

  setTimeout(() => {
    animation.style.opacity = '0';
    setTimeout(() => {
      animation.remove();
      sessionStorage.removeItem('justLogged');
    }, 800);
  }, 3000);
}

  // Load profile and logs
  const profile = JSON.parse(localStorage.getItem('userProfile'));
  const logs = JSON.parse(localStorage.getItem('periodLogs')) || [];

  if (profile) {
    // 1️⃣ Greeting
    document.querySelector('.username').textContent = profile.name;

    // 2️⃣ Current Date
    const today = new Date();
    document.querySelector('.current-date').textContent = today.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric'
    });

    // 3️⃣ Last Period Info
    const lastPeriod = logs.length > 0 ? logs[logs.length - 1] : null;
    if (lastPeriod) {
      const start = new Date(lastPeriod.startDate);
      const end = new Date(lastPeriod.endDate);
      const options = { month: 'long', day: 'numeric' };

      document.querySelector(".startDateDisply").textContent = start.toLocaleDateString('en-US', options);
      document.querySelector(".endDateDisply").textContent = end.toLocaleDateString('en-US', options);

      // 4️⃣ Predicted Next Period
      const nextStart = new Date(start);
      nextStart.setDate(nextStart.getDate() + profile.cycleLength);
      document.querySelectorAll('.info-value')[0].textContent = nextStart.toLocaleDateString('en-US', options);

      // 5️⃣ Determine Current Phase
      const currentPhase = getCurrentPhase(profile, logs);
      updatePhaseSection(currentPhase);
      localStorage.setItem("currentPhase", currentPhase);

      // 6️⃣ Countdown Logic
      const todayMidnight = new Date();
      todayMidnight.setHours(0, 0, 0, 0);
      const startDate = new Date(lastPeriod.startDate);
      const endDate = new Date(lastPeriod.endDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);

      if (currentPhase === "Menstrual") {
        const dayNum = Math.floor((todayMidnight - startDate) / (1000 * 60 * 60 * 24)) + 1;
        document.querySelector('.countdown-default').style.display = 'none';
        document.querySelector('.countdown-menstrual').style.display = 'block';
        document.querySelector('.menstrual-day').textContent = `Day ${dayNum}`;

        // Show "End Period" Banner after 5 days
        const expectedEnd = new Date(startDate);
        expectedEnd.setDate(expectedEnd.getDate() + 4);

        if (todayMidnight > expectedEnd && todayMidnight <= endDate) {
          document.querySelector('.period-end-banner').style.display = 'block';

          document.getElementById("markEndedBtn").onclick = () => {
            lastPeriod.endDate = todayMidnight.toISOString().split("T")[0];
            logs[logs.length - 1] = lastPeriod;
            localStorage.setItem("periodLogs", JSON.stringify(logs));
            document.querySelector('.period-end-banner').style.display = 'none';
            location.reload();
          };

          document.getElementById("extendPeriodBtn").onclick = () => {
            const currentEnd = new Date(lastPeriod.endDate);
            currentEnd.setDate(currentEnd.getDate() + 1);
            lastPeriod.endDate = currentEnd.toISOString().split("T")[0];
            logs[logs.length - 1] = lastPeriod;
            localStorage.setItem("periodLogs", JSON.stringify(logs));
            document.querySelector('.period-end-banner').style.display = 'none';
            location.reload();
          };
        }

      } else {
        const nextStart = new Date(start);
        nextStart.setDate(nextStart.getDate() + profile.cycleLength);
        const diff = Math.round((nextStart - todayMidnight) / (1000 * 60 * 60 * 24));

        if (diff < 0) {
          window.location.href = 'late-period.html';
        } else {
          document.querySelector('.countdown-default').style.display = 'block';
          document.querySelector('.countdown-menstrual').style.display = 'none';

          if (diff === 0) {
            document.querySelector('.days-count').innerHTML = `Today`;
            document.querySelector('.tracker-label').textContent = "Your period starts";
            document.querySelector('.period-tracker-card ').style.backgroundColor = "#b3003b"
            document.querySelector('.log-button').style.color="#b3003b";
          } else {
            document.querySelector('.days-count').innerHTML = `${diff} <span>days</span>`;
            document.querySelector('.tracker-label').textContent = "Period in";
          }
          document.querySelector('.days-number').textContent = diff;
        }
      }

      // 7️⃣ Avg Cycle Length Calculation
      // 7️⃣ Avg Cycle Length Calculation
// 7️⃣ Avg Cycle Length Calculation
// 7️⃣ Avg Cycle Length Calculation
// Ensure profile.cycleLength has a default value
let avgCycle = profile?.cycleLength || 28; // Default to 28 days if null

if (logs.length >= 2) {
  let totalDiff = 0;
  let validCycles = 0;

  for (let i = 1; i < logs.length; i++) {
    const prev = new Date(logs[i - 1].startDate);
    const curr = new Date(logs[i].startDate);
    const diff = Math.floor((curr - prev) / (1000 * 60 * 60 * 24));

    if (diff >= 21 && diff <= 45) {
      totalDiff += diff;
      validCycles++;
    }
  }

  if (validCycles > 0) {
    avgCycle = Math.round(totalDiff / validCycles);
    profile.cycleLength = avgCycle;
    localStorage.setItem('userProfile', JSON.stringify(profile));
  }
}

// ✅ Always display correct text
const avgElement = document.getElementById('avg');
if (avgElement) {
  avgElement.textContent = (avgCycle && !isNaN(avgCycle)) 
    ? `${avgCycle} days` 
    : "Not enough data";
}
    }
  }
});

// 🔬 Determine Current Phase
function getCurrentPhase(profile, logs) {
  if (!logs.length) return "Unknown";

  const last = logs[logs.length - 1];
  const start = new Date(last.startDate);
  const end = new Date(last.endDate);
  const today = new Date();

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  today.setHours(0, 0, 0, 0);

  if (today >= start && today <= end) return "Menstrual";

  const diffDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));
  const cycle = profile.cycleLength;

  if (diffDays <= 12) return "Follicular";
  if (diffDays <= 17) return "Ovulation";
  if (diffDays <= cycle) return "Luteal";

  return "Unknown";
}

// 🎨 Update UI Phase Section
function updatePhaseSection(phaseName) {
  const phaseEmoji = {
    "Menstrual": "🌸",
    "Follicular": "💪",
    "Ovulation": "✨",
    "Luteal": "🌧️"
  };

  const descriptions = {
    "Menstrual": "Your period has started. Rest and take care of yourself.",
    "Follicular": "Estrogen is rising. A new egg is maturing.",
    "Ovulation": "Fertility is highest. Hormones peak.",
    "Luteal": "Progesterone is high. PMS may appear."
  };

  document.querySelector('.phase-emoji').textContent = `${phaseName} ${phaseEmoji[phaseName] || ""}`;
  document.querySelector('.phase-description').textContent = descriptions[phaseName] || "Cycle info unavailable.";

  const card = document.querySelector('.period-tracker-card');
  const logBtn = document.querySelector('.log-button');
  const infoBtn = document.querySelector(".details-button");

  const colors = {
    "Menstrual": "#b3003b",
    "Follicular": "#ccaf07",
    "Ovulation": "#aa1caf",
    "Luteal": "#0f7884"
  };

  card.style.backgroundColor = colors[phaseName] || "#1c1c1cff";
  logBtn.style.color = colors[phaseName] || "#1c1c1cff";

  const urls = {
    "Menstrual": "menstrual.html",
    "Follicular": "follicular.html",
    "Ovulation": "ovulation.html",
    "Luteal": "luteal.html"
  };

  infoBtn.onclick = () => {
    if (urls[phaseName]) {
      window.location.href = urls[phaseName];
    } else {
      alert("Phase Info Not Available");
    }
  };
}


// Determine current phase
function getCurrentPhase(profile, logs) {
  if (!logs.length) return "Unknown";

  const last = logs[logs.length - 1];
  const start = new Date(last.startDate);
  const end = new Date(last.endDate);
  const today = new Date();

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);  // ← this line is key
  today.setHours(0, 0, 0, 0);

  if (today >= start && today <= end) return "Menstrual";

  const diffDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));
  const cycle = profile.cycleLength;

  if (diffDays <= 12) return "Follicular";
  if (diffDays <= 17) return "Ovulation";
  if (diffDays <= cycle) return "Luteal";

  return "Unknown";
}


// Update UI phase section
function updatePhaseSection(phaseName) {
  const phaseEmoji = {
    "Menstrual": "🌸",
    "Follicular": "💪",
    "Ovulation": "✨",
    "Luteal": "🌧️"
  };

  const descriptions = {
    "Menstrual": "Your period has started. Rest and take care of yourself.",
    "Follicular": "Estrogen is rising. A new egg is maturing.",
    "Ovulation": "Fertility is highest. Hormones peak.",
    "Luteal": "Progesterone is high. PMS may appear."
  };

  document.querySelector('.phase-emoji').textContent = `${phaseName} ${phaseEmoji[phaseName] || ""}`;
  document.querySelector('.phase-description').textContent = descriptions[phaseName] || "Cycle info unavailable.";

  const card = document.querySelector('.period-tracker-card');
  const logBtn = document.querySelector('.log-button');
  const infoBtn = document.querySelector(".details-button");

  const colors = {
    "Menstrual": "#b3003b",
    "Follicular": "#ccaf07",
    "Ovulation": "#aa1caf",
    "Luteal": "#0f7884"
  };

  card.style.backgroundColor = colors[phaseName] || "#1c1c1cff";
  logBtn.style.color = colors[phaseName] || "#1c1c1cff";

  const urls = {
    "Menstrual": "menstrual.html",
    "Follicular": "folecular.html",
    "Ovulation": "ovulution.html",
    "Luteal": "lutual.html"
  };

  infoBtn.onclick = () => {
    if (urls[phaseName]) {
      window.location.href = urls[phaseName];
    } else {
      alert("Phase Info Not Available");
    }
  };

  
}
