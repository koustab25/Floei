// 🌸 Floei Calendar – With Cycle Phases + Daily Cards + Log Dots

const calendarGrid = document.getElementById("calendarGrid");
const monthYearText = document.getElementById("monthYear");
const prevBtn = document.getElementById("prevMonth");
const nextBtn = document.getElementById("nextMonth");

let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function renderCalendar(month, year) {
  calendarGrid.innerHTML = "";

  const today = new Date();
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  monthYearText.textContent = `${months[month]} ${year}`;

  const logs = JSON.parse(localStorage.getItem("periodLogs")) || [];
  const profile = JSON.parse(localStorage.getItem("userProfile")) || { cycleLength: 28 };
  const dailyLogs = JSON.parse(localStorage.getItem("dailyLogs")) || [];

  const logDates = dailyLogs.map(entry => entry.date); // ISO format yyyy-mm-dd

  const phaseMap = {};

  logs.forEach(log => {
    const start = new Date(log.startDate);
    const end = new Date(log.endDate);
    const nextStart = new Date(start);
    nextStart.setDate(start.getDate() + profile.cycleLength);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      phaseMap[d.toDateString()] = "menstrual";
    }

    const follicularStart = new Date(end);
    follicularStart.setDate(follicularStart.getDate() + 1);
    const ovulationDay = new Date(nextStart);
    ovulationDay.setDate(nextStart.getDate() - 14);
    for (let d = new Date(follicularStart); d < ovulationDay; d.setDate(d.getDate() + 1)) {
      phaseMap[d.toDateString()] = "follicular";
    }

    phaseMap[ovulationDay.toDateString()] = "ovulation";

    const lutealStart = new Date(ovulationDay);
    lutealStart.setDate(lutealStart.getDate() + 1);
    for (let d = new Date(lutealStart); d < nextStart; d.setDate(d.getDate() + 1)) {
      phaseMap[d.toDateString()] = "luteal";
    }
  });

  for (let i = 0; i < firstDay; i++) {
    const blank = document.createElement("div");
    blank.classList.add("calendar-day");
    blank.style.visibility = "hidden";
    calendarGrid.appendChild(blank);
  }

  for (let day = 1; day <= totalDays; day++) {
    const dayEl = document.createElement("div");
    dayEl.classList.add("calendar-day");
    dayEl.textContent = day;

    const dateObj = new Date(year, month, day);
    const dateStr = dateObj.toISOString().split("T")[0];

    if (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    ) {
      dayEl.classList.add("today");
    }

    const phase = phaseMap[dateObj.toDateString()];
    if (phase) {
      dayEl.classList.add(phase);
    }

    // Show dot if user logged that day
    if (logDates.includes(dateStr)) {
      const dot = document.createElement("div");
      dot.classList.add("log-dot"); // style this in CSS
      dot.title = "You logged this day";
      dayEl.appendChild(dot);
    }

    calendarGrid.appendChild(dayEl);
  }
}

// Navigation
prevBtn.addEventListener("click", () => {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderCalendar(currentMonth, currentYear);
});

nextBtn.addEventListener("click", () => {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalendar(currentMonth, currentYear);
});

document.addEventListener("DOMContentLoaded", () => {
  renderCalendar(currentMonth, currentYear);
  renderLogCards();
});

// Cards Section
function renderLogCards() {
  const wrapper = document.getElementById("logCards");
  wrapper.innerHTML = "";

  let logs = JSON.parse(localStorage.getItem("dailyLogs") || "[]");
  logs = logs.slice(0, 30);

  const sortOrder = document.getElementById("sortOrder")?.value || "newest";
  logs.sort((a, b) =>
    sortOrder === "oldest"
      ? new Date(a.date) - new Date(b.date)
      : new Date(b.date) - new Date(a.date)
  );

  if (logs.length === 0) {
    wrapper.innerHTML = `<p style="color: #777;">No logs yet. <a href="log-symptoms.html" style="color: #f3567b;">Log your first entry</a>.</p>`;
    return;
  }

  logs.forEach(log => {
    const card = document.createElement("div");
    card.className = "log-card";
    card.innerHTML = `
      <div class="log-date"> ${new Date(log.date).toDateString()}</div>
      <div class="log-mood"></i> Mood: <strong>${log.mood}</strong></div>
      <div class="log-energy"> Energy: <strong>${log.energy}</strong></div>
      <div class="log-symptoms">Symptoms: ${log.symptoms?.join(", ") || "None"}</div>
      <button class="delete-log-btn" data-date="${log.date}"><i class="fa-solid fa-trash"></i> Delete</button>
    `;
    wrapper.appendChild(card);
  });

  document.querySelectorAll(".delete-log-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      const dateToDelete = e.target.dataset.date;
      let logs = JSON.parse(localStorage.getItem("dailyLogs") || "[]");
      logs = logs.filter(log => log.date !== dateToDelete);
      localStorage.setItem("dailyLogs", JSON.stringify(logs));
      renderLogCards();
      renderCalendar(currentMonth, currentYear); // update dot also
    });
  });
}
