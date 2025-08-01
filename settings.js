document.addEventListener('DOMContentLoaded', function() {
  // Load user data
  loadUserData();
  
  // Set up event listeners
  setupEventListeners();
  
  // Navbar active link
  setActiveNavLink();
});

function loadUserData() {
  const userProfile = JSON.parse(localStorage.getItem('userProfile')) || {};
  
  // Populate profile info
  document.querySelector('.profile-info .info-value').textContent = userProfile.name || 'User';
  
  // Populate cycle settings
  document.getElementById('cycleLength').value = userProfile.cycleLength || 28;
  document.getElementById('periodDuration').value = userProfile.periodDuration || 5;
  
  // Load notification preferences
  const notifications = JSON.parse(localStorage.getItem('notificationSettings')) || {
    periodReminders: true,
    fertilityAlerts: true,
    symptomReminders: false
  };
  
  document.querySelectorAll('.toggle-item input')[0].checked = notifications.periodReminders;
  document.querySelectorAll('.toggle-item input')[1].checked = notifications.fertilityAlerts;
  document.querySelectorAll('.toggle-item input')[2].checked = notifications.symptomReminders;
}

function setupEventListeners() {
  // Edit profile button
  document.querySelector('.btn-edit').addEventListener('click', function(e) {
    e.preventDefault();
    showEditProfileModal();
  });
  
  // Save cycle settings
  document.querySelector('.cycle-settings .btn-save').addEventListener('click', saveCycleSettings);
  
  // Notification toggles
  document.querySelectorAll('.toggle-item input').forEach(toggle => {
    toggle.addEventListener('change', saveNotificationSettings);
  });
  
  // Delete account
  document.querySelector('.btn-delete').addEventListener('click', confirmAccountDeletion);
}

function showEditProfileModal() {
  // Create modal HTML
  const modalHTML = `
    <div class="modal fade" id="editProfileModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Edit Profile</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="editProfileForm">
              <div class="mb-3">
                <label for="editName" class="form-label">Name</label>
                <input type="text" class="form-control" id="editName">
              </div>
          
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" id="saveProfileBtn">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Add to DOM
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Load current data
  const userProfile = JSON.parse(localStorage.getItem('userProfile')) || {};
  document.getElementById('editName').value = userProfile.name || '';
  // Initialize modal
  const modal = new bootstrap.Modal(document.getElementById('editProfileModal'));
  modal.show();
  
  // Save handler
  document.getElementById('saveProfileBtn').addEventListener('click', function() {
    const newName = document.getElementById('editName').value.trim();
    
    if (newName) {
      const userProfile = JSON.parse(localStorage.getItem('userProfile')) || {};
      userProfile.name = newName;
      localStorage.setItem('userProfile', JSON.stringify(userProfile));
      
      // Update UI
      document.querySelector('.profile-info .info-value').textContent = newName;
      modal.hide();
      
      // Show success message
      showToast('Profile updated successfully!');
    }
  });
}

function saveCycleSettings() {
  const cycleLength = parseInt(document.getElementById('cycleLength').value);
  const periodDuration = parseInt(document.getElementById('periodDuration').value);
  
  if (cycleLength < 21 || cycleLength > 45) {
    showToast('Cycle length must be between 21-45 days', 'error');
    return;
  }
  
  if (periodDuration < 1 || periodDuration > 10) {
    showToast('Period duration must be between 1-10 days', 'error');
    return;
  }
  
  const userProfile = JSON.parse(localStorage.getItem('userProfile')) || {};
  userProfile.cycleLength = cycleLength;
  userProfile.periodDuration = periodDuration;
  localStorage.setItem('userProfile', JSON.stringify(userProfile));
  
  showToast('Cycle settings saved!');
}

function saveNotificationSettings() {
  const notificationSettings = {
    periodReminders: document.querySelectorAll('.toggle-item input')[0].checked,
    fertilityAlerts: document.querySelectorAll('.toggle-item input')[1].checked,
    symptomReminders: document.querySelectorAll('.toggle-item input')[2].checked
  };
  
  localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
  showToast('Notification preferences updated');
}

function confirmAccountDeletion() {
  // Create a more user-friendly confirmation modal instead of using the default confirm()
  const modalHTML = `
    <div class="modal fade" id="deleteAccountModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title text-danger">Delete Account</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to delete your account?</p>
            <p class="text-danger"><strong>This will permanently erase all your data including:</strong></p>
            <ul>
              <li>Profile information</li>
              <li>Cycle history</li>
              <li>All saved preferences</li>
            </ul>
            <p>This action cannot be undone.</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-danger" id="confirmDeleteBtn">Delete My Account</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Add to DOM
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Initialize modal
  const modal = new bootstrap.Modal(document.getElementById('deleteAccountModal'));
  modal.show();
  
  // Handle confirm delete
  document.getElementById('confirmDeleteBtn').addEventListener('click', function() {
    // Clear all local storage data for the site
    localStorage.clear();
    
    // Show confirmation message before redirect
    showToast('Account deleted successfully. You can create a new one now.', 'success');
    
    // Close the modal
    modal.hide();
    
    // Redirect after a short delay to allow the toast to show
    setTimeout(() => {
      window.location.href = 'welcomepage.html';
    }, 1500);
    
    // Remove the modal from DOM after it's hidden
    document.getElementById('deleteAccountModal').addEventListener('hidden.bs.modal', function() {
      this.remove();
    });
  });
  
  // Remove the modal from DOM if user cancels
  document.getElementById('deleteAccountModal').addEventListener('hidden.bs.modal', function() {
    this.remove();
  });
}

function showToast(message, type = 'success') {
  // Create toast element
  const toastHTML = `
    <div class="toast align-items-center text-white bg-${type === 'success' ? 'success' : 'danger'} border-0" role="alert">
      <div class="d-flex">
        <div class="toast-body">
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    </div>
  `;
  
  const toastContainer = document.createElement('div');
  toastContainer.className = 'position-fixed bottom-0 end-0 p-3';
  toastContainer.style.zIndex = '11';
  toastContainer.innerHTML = toastHTML;
  document.body.appendChild(toastContainer);
  
  // Show toast
  const toast = new bootstrap.Toast(toastContainer.querySelector('.toast'));
  toast.show();
  
  // Remove after hide
  toastContainer.querySelector('.toast').addEventListener('hidden.bs.toast', function() {
    toastContainer.remove();
  });
}

function setActiveNavLink() {
  const links = document.querySelectorAll('.nav-links a');
  const currentPage = window.location.pathname.split("/").pop();
  
  links.forEach(link => {
    if (link.getAttribute("href") === currentPage) {
      link.classList.add("active");
    }
  });
}