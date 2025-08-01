document.addEventListener('DOMContentLoaded', () => {
  const periodStartInput = document.getElementById('periodStartDate');
  const periodEndInput = document.getElementById('periodEndDate');

  // ✅ Set start date as today
  const today = new Date();
  const todayFormatted = today.toISOString().split('T')[0];
  periodStartInput.value = todayFormatted;

  // ✅ Set end date as 5 days later
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 5);
  const endDateFormatted = endDate.toISOString().split('T')[0];
  periodEndInput.value = endDateFormatted;

  // ✅ Form handling
  const form = document.querySelector('form');
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const startDate = periodStartInput.value;
    const endDate = periodEndInput.value;
    const flow = document.querySelector('input[name="flowIntensity"]:checked')?.value;
    const pain = document.querySelector('input[name="painLevel"]:checked')?.value;
    const symptoms = [...document.querySelectorAll('input[name="symptoms"]:checked')].map(el => el.value);
    const notes = document.getElementById('periodNotes').value;

    if (!startDate || !endDate || !flow || !pain) {
      alert('Please fill all required fields.');
      return;
    }

    // Save entry
    const entry = { startDate, endDate, flow, pain, symptoms, notes, timestamp: new Date().toISOString() };
    const logs = JSON.parse(localStorage.getItem('periodLogs') || '[]');
    logs.push(entry);
    localStorage.setItem('periodLogs', JSON.stringify(logs));

    // Save last period & avg cycle
    localStorage.setItem('lastPeriod', JSON.stringify({ startDate, endDate }));
    updateAverageCycleLength(logs);
    sessionStorage.setItem('justLogged', 'true');

    // Redirect after save
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 800);
  });

  // ✅ Helper for average cycle length
  function updateAverageCycleLength(logs) {
    const sorted = logs
      .filter(l => l.startDate)
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    if (sorted.length >= 2) {
      let totalDiff = 0;
      for (let i = 1; i < sorted.length; i++) {
        totalDiff += (new Date(sorted[i].startDate) - new Date(sorted[i - 1].startDate)) / (1000 * 60 * 60 * 24);
      }
      localStorage.setItem('avgCycleLength', Math.round(totalDiff / (sorted.length - 1)));
    }
  }
});
