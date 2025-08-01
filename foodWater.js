// ✅ Cleaned & Finalized foodWater.js

// ---- Initial Setup ----
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadFood();
  loadWater();
  loadHealthSummary();
  setupEventListeners();
  loadPhaseSuggestionsSimple();

});

// ---- Theme Toggle ----
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  const themeToggle = document.getElementById('theme-toggle');
  themeToggle.innerHTML = savedTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    themeToggle.innerHTML = newTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  });
}

// ---- Event Listeners ----
function setupEventListeners() {
  const foodInput = document.getElementById('food-name');
  let debounceTimer;
  foodInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      const query = e.target.value.trim();
      if (query.length < 2) return hideSuggestions();
      const suggestions = await fetchFoodSuggestions(query);
      showFoodSuggestions(suggestions);
    }, 300);
  });

  document.getElementById('save-food-btn').addEventListener('click', addFoodItem);
  document.querySelectorAll('.water-btn').forEach(btn => {
    btn.addEventListener('click', () => addWater(parseInt(btn.dataset.amount)));
  });
  document.getElementById('calorie-goal').addEventListener('change', loadFood);
  document.getElementById('water-goal').addEventListener('change', loadWater);

  const modal = document.getElementById('profile-modal');
  document.getElementById('edit-profile-btn').addEventListener('click', openProfileModal);
  document.querySelector('.close-modal').addEventListener('click', () => modal.style.display = 'none');
  window.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });
  document.getElementById('profile-form').addEventListener('submit', e => { e.preventDefault(); saveProfile(); });
}

// ---- Food Suggestions ----
async function fetchFoodSuggestions(query) {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=5`;
    const res = await fetch(url);
    const data = await res.json();
    return data.products.filter(p => p.product_name && p.nutriments).map(p => ({
      name: p.product_name,
      kcal: Math.round(p.nutriments['energy-kcal_100g'] || p.nutriments['energy-kcal_serving'] || 0)
    }));
  } catch (err) {
    console.error('Suggestion error:', err);
    return [];
  }
}

function showFoodSuggestions(suggestions) {
  const container = document.getElementById('food-suggestions');
  container.innerHTML = '';
  if (suggestions.length === 0) return hideSuggestions();
  suggestions.forEach(item => {
    const div = document.createElement('div');
    div.className = 'suggestion-item';
    div.textContent = `${item.name} (${item.kcal} kcal)`;
    div.addEventListener('click', () => {
      document.getElementById('food-name').value = item.name;
      document.getElementById('food-calories').value = item.kcal;
      hideSuggestions();
      document.getElementById('autofill-tip').textContent = `Auto-filled: ${item.kcal} kcal for "${item.name}"`;
    });
    container.appendChild(div);
  });
  container.style.display = 'block';
}
function hideSuggestions() {
  const container = document.getElementById('food-suggestions');
  container.style.display = 'none';
  container.innerHTML = '';
}

function addFoodItem() {
  const name = document.getElementById('food-name').value.trim();
  const kcal = parseInt(document.getElementById('food-calories').value);
  if (!name || isNaN(kcal)) return showAlert('Please enter both name and calories', 'error');
  const foods = JSON.parse(localStorage.getItem('foodItems') || '[]');
  foods.push({ name, kcal, timestamp: new Date().toISOString() });
  localStorage.setItem('foodItems', JSON.stringify(foods));
  document.getElementById('food-name').value = '';
  document.getElementById('food-calories').value = '';
  document.getElementById('autofill-tip').textContent = '';
  hideSuggestions();
  loadFood();
  showAlert(`${name} added`, 'success');
}

function loadFood() {
  const allFoods = JSON.parse(localStorage.getItem('foodItems') || '[]');
  const container = document.getElementById('food-items-container');
  const progress = document.getElementById('calorie-progress');
  const summary = document.getElementById('calories-summary');
  const goal = parseInt(document.getElementById('calorie-goal').value) || 1800;
  const today = new Date().toISOString().split('T')[0];
  const todayFoods = allFoods.filter(f => f.timestamp?.startsWith(today));
  container.innerHTML = todayFoods.length ? '' : '<div class="empty-state">No food today</div>';
  let total = 0;
  todayFoods.forEach((f, i) => {
    total += f.kcal;
    const div = document.createElement('div');
    div.className = 'food-item';
    div.innerHTML = `<div><span class="food-name">${f.name}</span></div><div><span class="food-calories">${f.kcal} kcal</span><button class="delete-btn" data-index="${i}"><i class="fas fa-trash"></i></button></div>`;
    container.appendChild(div);
  });
  container.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = () => {
      todayFoods.splice(parseInt(btn.dataset.index), 1);
      localStorage.setItem('foodItems', JSON.stringify(todayFoods));
      loadFood();
    };
  });
  progress.max = goal;
  progress.value = total;
  const pct = Math.round((total / goal) * 100);
  summary.innerHTML = `<span>${total} / ${goal} kcal</span> <span>${pct < 70 ? `${pct}%` : pct < 100 ? `<span style='color:orange'>${pct}% - Almost there!</span>` : `<span style='color:green'>${pct}% - Goal reached!</span>`}</span>`;
}

function addWater(amount) {
  const data = JSON.parse(localStorage.getItem('waterIntake') || '{"total":0,"entries":[]}');
  data.total += amount;
  data.entries.push({ amount, timestamp: new Date().toISOString() });
  localStorage.setItem('waterIntake', JSON.stringify(data));
  loadWater();
  showAlert(`Added ${amount}ml`, 'success');
}

function loadWater() {
  const data = JSON.parse(localStorage.getItem('waterIntake') || '{"total":0,"entries":[]}');
  const goal = parseInt(document.getElementById('water-goal').value) || 2000;
  const today = new Date().toISOString().split('T')[0];
  const entries = data.entries.filter(e => e.timestamp.startsWith(today));
  const total = entries.reduce((sum, e) => sum + e.amount, 0);
  document.getElementById('water-progress').value = total;
  document.getElementById('water-progress').max = goal;
  document.getElementById('water-summary').innerHTML = `${total} / ${goal} ml`;
  const container = document.getElementById('water-history-container');
  container.innerHTML = entries.length ? '' : '<div class="empty-state">No water entries today</div>';
  entries.forEach((e, i) => {
    const div = document.createElement('div');
    div.className = 'water-entry';
    div.innerHTML = `<span>${new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span><span>+${e.amount}ml</span><button class="delete-water" data-index="${i}"><i class="fas fa-times"></i></button>`;
    container.appendChild(div);
  });
  container.querySelectorAll('.delete-water').forEach(btn => {
    btn.onclick = () => {
      entries.splice(parseInt(btn.dataset.index), 1);
      data.entries = entries;
      data.total = entries.reduce((sum, e) => sum + e.amount, 0);
      localStorage.setItem('waterIntake', JSON.stringify(data));
      loadWater();
    };
  });
}

function openProfileModal() {
  const currentPhase = localStorage.getItem("currentPhase");
  const modal = document.getElementById('profile-modal');
  const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
  document.getElementById('height-input').value = profile.height || '';
  document.getElementById('weight-input').value = profile.weight || '';
  document.getElementById('summary-phase').innerText = currentPhase;
  document.getElementById('phase-select').value = currentPhase || 'Unknown';
  
  modal.style.display = 'flex';
}

function saveProfile() {
  const height = parseFloat(document.getElementById('height-input').value);
  const weight = parseFloat(document.getElementById('weight-input').value);
  const phase = document.getElementById('phase-select').value;
  if ((height && (height < 100 || height > 250)) || (weight && (weight < 30 || weight > 300))) {
    return showAlert('Invalid height/weight', 'error');
  }
  const profile = { height, weight, phase: phase !== 'Unknown' ? phase : undefined };
  localStorage.setItem('userProfile', JSON.stringify(profile));
  document.getElementById('profile-modal').style.display = 'none';
 
  loadHealthSummary();
  showAlert('Profile updated', 'success');
}

function loadHealthSummary() {
  const p = JSON.parse(localStorage.getItem('userProfile') || '{}');
  const h = parseFloat(p.height), w = parseFloat(p.weight), ph = p.phase || 'Unknown';
  let bmi = '--', cat = '';
  if (h && w) {
    bmi = (w / ((h / 100) ** 2)).toFixed(1);
    if (bmi < 18.5) cat = 'Underweight';
    else if (bmi < 25) cat = 'Normal';
    else if (bmi < 30) cat = 'Overweight';
    else cat = 'Obese';
  }
  const currentPhase = localStorage.getItem("currentPhase");
  document.getElementById('summary-height').textContent = h || '--';
  document.getElementById('summary-weight').textContent = w || '--';
  document.getElementById('summary-bmi').textContent = bmi;
  

  const bmiCat = document.getElementById('bmi-category');
  bmiCat.textContent = cat;
  bmiCat.style.backgroundColor = cat === 'Normal' ? 'var(--success-color)' : cat === 'Underweight' || cat === 'Overweight' ? 'var(--warning-color)' : cat === 'Obese' ? 'var(--danger-color)' : 'gray';
  let sCal = 2000, sWat = 2000;
  if (bmi !== '--') sCal = bmi < 18.5 ? 2200 : bmi > 25 ? 1800 : 2000;
  if (ph.toLowerCase() === 'luteal') sWat = 2500;
  document.getElementById('suggested-calories').textContent = sCal;
  document.getElementById('suggested-water').textContent = sWat;
  if (parseInt(document.getElementById('calorie-goal').value) === 1800) document.getElementById('calorie-goal').value = sCal;
  if (parseInt(document.getElementById('water-goal').value) === 2000) document.getElementById('water-goal').value = sWat;

  loadFood();
  loadWater();
}

function showAlert(msg, type) {
  const div = document.createElement('div');
  div.className = `alert alert-${type}`;
  div.textContent = msg;
  document.body.appendChild(div);
  setTimeout(() => {
    div.classList.add('fade-out');
    setTimeout(() => div.remove(), 300);
  }, 2500);
}

// Alert style
const style = document.createElement('style');
style.textContent = `
.alert { position: fixed; bottom: 20px; right: 20px; padding: 12px 20px; border-radius: 8px; color: white; z-index: 1000; background: var(--primary-color); }
.alert-success { background: var(--success-color); }
.alert-error { background: var(--danger-color); }
.alert-info { background: var(--info-color); }
.fade-out { opacity: 0; transition: opacity 0.3s ease; }
`;
document.head.appendChild(style);
