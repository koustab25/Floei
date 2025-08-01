document.addEventListener('DOMContentLoaded', function() {
  // Initialize all functionality
  initStats();
  initCharts();
  initTimeFilters();
  loadCycleHistory();
  loadCommonSymptoms();
});

// STATS FUNCTIONS
function initStats() {
  updateCycleStats();
  updatePeriodStats();
  updateSymptomStats();
  updateFertilityStats();
}

function updateCycleStats() {
  const avgCycle = getAverageCycleLength();
  const avgCycleEl = document.getElementById('avgCycleLength');
  const cycleMessageEl = document.getElementById('cycleMessage');
  
  if (avgCycleEl) {
    avgCycleEl.innerHTML = avgCycle ? `${avgCycle} <span>days</span>` : '__ <span>days</span>';
  }
  
  if (cycleMessageEl) {
    cycleMessageEl.textContent = getCycleInsightMessage(avgCycle);
  }
}

function updatePeriodStats() {
  const avgPeriod = getAveragePeriodDuration();
  const lastPeriod = getLastPeriodDuration();
  const avgPeriodEl = document.getElementById('avgPeriodLength');
  const lastPeriodEl = document.getElementById('lastPeriodDuration');
  
  if (avgPeriodEl) {
    avgPeriodEl.textContent = avgPeriod ? `${avgPeriod} days` : '-- days';
  }
  
  if (lastPeriodEl) {
    lastPeriodEl.textContent = lastPeriod ? `Last period: ${lastPeriod} day${lastPeriod !== 1 ? 's' : ''}` : 'No period logged';
  }
}

function updateSymptomStats() {
  const symptoms = getMostCommonSymptoms();
  const symptomSection = document.getElementById('symptomsSection');
  const countDisplay = document.getElementById('symptomCountDisplay');
  
  if (symptoms.length > 0) {
    const topSymptom = symptoms[0];
    const periodLogs = JSON.parse(localStorage.getItem('periodLogs') || '[]');
    const dailyLogs = JSON.parse(localStorage.getItem('dailyLogs') || '[]');
    const totalEntries = periodLogs.length + dailyLogs.length;
    const percentage = totalEntries > 0 ? Math.round((topSymptom.count / totalEntries) * 100) : 0;
    
    symptomSection.textContent = formatSymptomName(topSymptom.name);
    countDisplay.textContent = `Logged ${topSymptom.count} time${topSymptom.count !== 1 ? 's' : ''} (${percentage}%)`;
  } else {
    symptomSection.textContent = 'No symptoms';
    countDisplay.textContent = 'Not logged';
  }
}

function updateFertilityStats() {
  const fertility = calculateFertilityWindow();
  const fertileDisplay = document.getElementById('fertileWindowDisplay');
  const fertileSubtext = document.getElementById('fertileWindowSubText');
  
  if (fertility) {
    fertileDisplay.textContent = `${fertility.start} - ${fertility.end}`;
    fertileSubtext.textContent = `Peak: ${fertility.peakStart} - ${fertility.peakEnd}`;
  } else {
    fertileDisplay.textContent = 'Need more data';
    fertileSubtext.textContent = 'Log at least 2 periods';
  }
}

// CHART FUNCTIONS
let cycleLengthChart, symptomsChart;

function initCharts() {
  const logs = JSON.parse(localStorage.getItem('periodLogs') || '[]');
  
  // Cycle Length Chart
  const cycleCtx = document.getElementById('cycleLengthChart')?.getContext('2d');
  if (cycleCtx) {
    const { labels, data } = prepareCycleChartData(logs, 3);
    cycleLengthChart = new Chart(cycleCtx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Cycle Length (days)',
          data: data,
          borderColor: 'rgba(243, 86, 123, 1)',
          backgroundColor: 'rgba(243, 86, 123, 0.1)',
          borderWidth: 2,
          tension: 0.3,
          fill: true
        }]
      },
      options: getChartOptions('Cycle Length (days)')
    });
  }
  
  // Symptoms Chart
  const symptomsCtx = document.getElementById('symptomsChart')?.getContext('2d');
  if (symptomsCtx) {
    const { labels, data, colors } = prepareSymptomsChartData(logs, 3);
    symptomsChart = new Chart(symptomsCtx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Symptom Frequency',
          data: data,
          backgroundColor: colors,
          borderColor: colors.map(c => c.replace('0.7', '1')),
          borderWidth: 1
        }]
      },
      options: getChartOptions('Occurrences', true)
    });
  }
}

function prepareCycleChartData(logs, months) {
  const filteredLogs = filterLogsByMonths(logs, months);
  const sortedLogs = [...filteredLogs].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  
  const labels = [];
  const data = [];
  
  for (let i = 1; i < sortedLogs.length; i++) {
    const prevDate = new Date(sortedLogs[i-1].startDate);
    const currDate = new Date(sortedLogs[i].startDate);
    const cycleLength = Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24));
    
    const monthName = prevDate.toLocaleString('default', { month: 'short' });
    labels.push(`${monthName} ${prevDate.getFullYear()}`);
    data.push(cycleLength);
  }
  
  return { labels, data };
}

function prepareSymptomsChartData(logs, months) {
  const filteredPeriodLogs = filterLogsByMonths(logs, months);
  const dailyLogs = JSON.parse(localStorage.getItem('dailyLogs') || '[]');
  const filteredDailyLogs = filterLogsByMonths(dailyLogs, months);
  
  const symptomCounts = {};
  
  // Process period logs
  filteredPeriodLogs.forEach(log => {
    if (log.symptoms && Array.isArray(log.symptoms)) {
      log.symptoms.forEach(symptom => {
        const normalized = normalizeSymptomName(symptom);
        symptomCounts[normalized] = (symptomCounts[normalized] || 0) + 1;
      });
    }
  });
  
  // Process daily logs
  filteredDailyLogs.forEach(log => {
    if (log.symptoms && Array.isArray(log.symptoms)) {
      log.symptoms.forEach(symptom => {
        const normalized = normalizeSymptomName(symptom);
        symptomCounts[normalized] = (symptomCounts[normalized] || 0) + 1;
      });
    }
  });
  
  // Sort and get top 6
  const sortedSymptoms = Object.entries(symptomCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  
  const labels = sortedSymptoms.map(([name]) => formatSymptomName(name));
  const data = sortedSymptoms.map(([_, count]) => count);
  
  const colors = [
    'rgba(253, 102, 118, 0.7)',
    'rgba(2, 176, 207, 0.7)',
    'rgba(226, 137, 244, 0.7)',
    'rgba(255, 142, 55, 0.7)',
    'rgba(243, 86, 123, 0.7)',
    'rgba(202, 168, 245, 0.7)'
  ].slice(0, labels.length);
  
  return { labels, data, colors };
}

// Helper to normalize symptom names
function normalizeSymptomName(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_');
}

function formatSymptomName(name) {
  return name
    .replace(/_/g, ' ')
    .replace(/(?:^|\s)\S/g, c => c.toUpperCase());
}

function getChartOptions(title, startAtZero = false) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${title}: ${context.raw}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: startAtZero
      }
    }
  };
}

// TIME FILTERS
function initTimeFilters() {
  document.querySelectorAll('.time-filter button').forEach(button => {
    button.addEventListener('click', function() {
      const months = parseInt(this.dataset.months);
      const chartContainer = this.closest('.chart-container');
      
      this.parentNode.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      if (chartContainer.querySelector('#cycleLengthChart')) {
        updateCycleChart(months);
      } else if (chartContainer.querySelector('#symptomsChart')) {
        updateSymptomsChart(months);
      }
    });
  });
}

function updateCycleChart(months) {
  const logs = JSON.parse(localStorage.getItem('periodLogs') || '[]');
  const { labels, data } = prepareCycleChartData(logs, months);
  
  cycleLengthChart.data.labels = labels;
  cycleLengthChart.data.datasets[0].data = data;
  cycleLengthChart.update();
}

function updateSymptomsChart(months) {
  const logs = JSON.parse(localStorage.getItem('periodLogs') || '[]');
  const { labels, data, colors } = prepareSymptomsChartData(logs, months);
  
  symptomsChart.data.labels = labels;
  symptomsChart.data.datasets[0].data = data;
  symptomsChart.data.datasets[0].backgroundColor = colors;
  symptomsChart.data.datasets[0].borderColor = colors.map(c => c.replace('0.7', '1'));
  symptomsChart.update();
}

// CYCLE HISTORY TABLE
function loadCycleHistory() {
  const logs = JSON.parse(localStorage.getItem('periodLogs') || '[]');
  const sortedLogs = [...logs].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  const tableBody = document.getElementById('cycleHistoryBody');
  
  if (!tableBody) return;
  
  tableBody.innerHTML = logs.length === 0 
    ? '<tr><td colspan="5" style="text-align: center;">No period logs yet</td></tr>'
    : '';
  
  for (let i = 0; i < Math.min(sortedLogs.length, 5); i++) {
    const log = sortedLogs[i];
    const startDate = new Date(log.startDate);
    const endDate = new Date(log.endDate);
    
    let cycleLength = '--';
    if (i < sortedLogs.length - 1) {
      const prevStart = new Date(sortedLogs[i+1].startDate);
      cycleLength = Math.round((startDate - prevStart) / (1000 * 60 * 60 * 24));
    }
    
    const periodDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    const phase = getPhaseForDate(startDate, logs);
    const symptoms = log.symptoms?.join(', ') || 'None';
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
      <td>${cycleLength} days</td>
      <td>${periodDays} days</td>
      <td><span class="phase-tag tag-${phase.toLowerCase()}">${phase}</span></td>
      <td>${symptoms}</td>
    `;
    tableBody.appendChild(row);
  }
}

// COMMON SYMPTOMS GRID
function loadCommonSymptoms() {
  const symptoms = getMostCommonSymptoms();
  const symptomsGrid = document.getElementById('symptomsGrid');
  
  if (!symptomsGrid) return;
  
  symptomsGrid.innerHTML = symptoms.length === 0
    ? '<div style="grid-column: 1 / -1; text-align: center;">No symptoms logged yet</div>'
    : '';
  
  const periodLogs = JSON.parse(localStorage.getItem('periodLogs') || '[]');
  const dailyLogs = JSON.parse(localStorage.getItem('dailyLogs') || '[]');
  const totalEntries = periodLogs.length + dailyLogs.length;
  
  symptoms.slice(0, 5).forEach(symptom => {
    const percentage = totalEntries > 0 ? Math.round((symptom.count / totalEntries) * 100) : 0;
    const card = document.createElement('div');
    card.className = 'symptom-card';
    card.innerHTML = `
      <div class="symptom-icon">${getSymptomIcon(symptom.name)}</div>
      <div>${formatSymptomName(symptom.name)}</div>
      <div class="symptom-frequency">${percentage}% of entries</div>
    `;
    symptomsGrid.appendChild(card);
  });
}

// HELPER FUNCTIONS
function getAverageCycleLength() {
  const logs = JSON.parse(localStorage.getItem('periodLogs') || '[]');
  if (logs.length < 2) return null;
  
  const sortedLogs = [...logs].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  let totalDays = 0;
  
  for (let i = 1; i < sortedLogs.length; i++) {
    const prevDate = new Date(sortedLogs[i-1].startDate);
    const currDate = new Date(sortedLogs[i].startDate);
    totalDays += (currDate - prevDate) / (1000 * 60 * 60 * 24);
  }
  
  return Math.round(totalDays / (sortedLogs.length - 1));
}

function getCycleInsightMessage(avgCycle) {
  if (!avgCycle) return 'Log at least 2 periods to calculate cycle length';
  
  if (avgCycle >= 26 && avgCycle <= 30) return 'Normal cycle length (26-30 days)';
  if (avgCycle >= 21 && avgCycle < 26) return 'Slightly short cycle (21-25 days)';
  if (avgCycle > 30 && avgCycle <= 35) return 'Slightly long cycle (31-35 days)';
  if (avgCycle < 21 || avgCycle > 35) return 'Irregular cycle length';
  return 'Keep tracking for more insights';
}

function getAveragePeriodDuration() {
  const logs = JSON.parse(localStorage.getItem('periodLogs') || '[]');
  if (logs.length === 0) return null;
  
  let totalDays = 0;
  logs.forEach(log => {
    const start = new Date(log.startDate);
    const end = new Date(log.endDate);
    totalDays += (end - start) / (1000 * 60 * 60 * 24) + 1;
  });
  
  return Math.round(totalDays / logs.length);
}

function getLastPeriodDuration() {
  const logs = JSON.parse(localStorage.getItem('periodLogs') || '[]');
  if (logs.length === 0) return null;
  
  const lastLog = logs[logs.length - 1];
  const start = new Date(lastLog.startDate);
  const end = new Date(lastLog.endDate);
  return Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
}

function getMostCommonSymptoms() {
  const periodLogs = JSON.parse(localStorage.getItem('periodLogs') || '[]');
  const dailyLogs = JSON.parse(localStorage.getItem('dailyLogs') || '[]');
  const symptomCounts = {};
  
  // Count from period logs
  periodLogs.forEach(log => {
    if (log.symptoms && Array.isArray(log.symptoms)) {
      log.symptoms.forEach(symptom => {
        const normalized = normalizeSymptomName(symptom);
        symptomCounts[normalized] = (symptomCounts[normalized] || 0) + 1;
      });
    }
  });
  
  // Count from daily logs
  dailyLogs.forEach(log => {
    if (log.symptoms && Array.isArray(log.symptoms)) {
      log.symptoms.forEach(symptom => {
        const normalized = normalizeSymptomName(symptom);
        symptomCounts[normalized] = (symptomCounts[normalized] || 0) + 1;
      });
    }
  });
  
  return Object.entries(symptomCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function calculateFertilityWindow() {
  const logs = JSON.parse(localStorage.getItem('periodLogs') || '[]');
  if (logs.length < 2) return null;
  
  const sortedLogs = [...logs].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  let totalDays = 0;
  
  for (let i = 1; i < sortedLogs.length; i++) {
    const prevDate = new Date(sortedLogs[i-1].startDate);
    const currDate = new Date(sortedLogs[i].startDate);
    totalDays += (currDate - prevDate) / (1000 * 60 * 60 * 24);
  }
  
  const avgCycle = Math.round(totalDays / (sortedLogs.length - 1));
  const lastPeriodStart = new Date(sortedLogs[sortedLogs.length - 1].startDate);
  const nextPeriodStart = new Date(lastPeriodStart);
  nextPeriodStart.setDate(lastPeriodStart.getDate() + avgCycle);
  
  const ovulationDate = new Date(nextPeriodStart);
  ovulationDate.setDate(nextPeriodStart.getDate() - 14);
  
  const fertileStart = new Date(ovulationDate);
  fertileStart.setDate(ovulationDate.getDate() - 5);
  
  const fertileEnd = new Date(ovulationDate);
  fertileEnd.setDate(ovulationDate.getDate() + 1);
  
  const peakStart = new Date(ovulationDate);
  peakStart.setDate(ovulationDate.getDate() - 1);
  
  const peakEnd = new Date(ovulationDate);
  peakEnd.setDate(ovulationDate.getDate() + 1);
  
  const options = { month: 'short', day: 'numeric' };
  return {
    start: fertileStart.toLocaleDateString('en-US', options),
    end: fertileEnd.toLocaleDateString('en-US', options),
    peakStart: peakStart.toLocaleDateString('en-US', options),
    peakEnd: peakEnd.toLocaleDateString('en-US', options)
  };
}

function getPhaseForDate(date, logs) {
  const currentDate = new Date(date);
  const sortedLogs = [...logs].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  
  for (let i = 0; i < sortedLogs.length; i++) {
    const start = new Date(sortedLogs[i].startDate);
    const end = new Date(sortedLogs[i].endDate);
    if (currentDate >= start && currentDate <= end) return 'Menstrual';
  }
  
  for (let i = 1; i < sortedLogs.length; i++) {
    const prevStart = new Date(sortedLogs[i-1].startDate);
    const currStart = new Date(sortedLogs[i].startDate);
    
    if (currentDate > prevStart && currentDate < currStart) {
      const cycleDay = Math.floor((currentDate - prevStart) / (1000 * 60 * 60 * 24));
      const cycleLength = Math.floor((currStart - prevStart) / (1000 * 60 * 60 * 24));
      
      if (cycleDay <= 14) return 'Follicular';
      if (cycleDay <= 17) return 'Ovulation';
      if (cycleDay <= cycleLength) return 'Luteal';
    }
  }
  
  return 'Unknown';
}

function filterLogsByMonths(logs, months) {
  if (months === 0) return [...logs];
  
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - months);
  
  return logs.filter(log => {
    const logDate = new Date(log.startDate || log.date || log.timestamp);
    return logDate >= cutoffDate;
  });
}

function getSymptomIcon(symptom) {
  const normalized = normalizeSymptomName(symptom);
  const icons = {
  //   cramps: '<i class="fas fa-bolt"></i>', // still suitable (symbolizes pain/spasms)
  // bloating: '<i class="fas fa-water"></i>', // symbolizes water retention/bloating
  // fatigue: '<i class="fas fa-battery-quarter"></i>', // low energy
  // headache: '<i class="fas fa-head-side-cough"></i>', // shows discomfort around head
  // acne: '<i class="fas fa-bacterium"></i>', // visual reference to skin/inflammation
  // mood_swings: '<i class="fas fa-meh-rolling-eyes"></i>', // emotional variation
  // nausea: '<i class="fas fa-poo"></i>', // awkward, but often used for stomach discomfort
  // tender_breasts: '<i class="fas fa-ribbon"></i>', // soft representation (used in breast cancer awareness)
  // back_pain: '<i class="fas fa-chair"></i>' // indicates spine/back support
  };
  
  return icons[normalized] || '<i class="fas fa-heartbeat"></i>';
}