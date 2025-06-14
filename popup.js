document.addEventListener('DOMContentLoaded', async function() {
  const setupSection = document.getElementById('setup-section');
  const mainContent = document.getElementById('main-content');
  const tokenInput = document.getElementById('token-input');
  const saveTokenBtn = document.getElementById('save-token');
  const cancelBtn = document.getElementById('cancel-btn');
  const refreshBtn = document.getElementById('refresh-btn');
  const settingsBtn = document.getElementById('settings-btn');
  const loading = document.getElementById('loading');
  const error = document.getElementById('error');
  const repoList = document.getElementById('repo-list');
  const userProfile = document.getElementById('user-profile');
  
  let currentToken = null;
  let currentUser = null;
  let expandedRepos = new Set();
  
  // Check if token exists and load data
  await loadToken();
  
  async function loadToken() {
    const result = await chrome.storage.local.get(['githubToken']);
    currentToken = result.githubToken;
    
    if (!currentToken) {
      showSetup();
    } else {
      showMain();
      await loadUserAndRepositories(currentToken, false);
    }
  }
  
  function showSetup() {
    setupSection.style.display = 'block';
    mainContent.style.display = 'none';
    
    if (currentToken) {
      tokenInput.value = '';
      tokenInput.placeholder = '••••••••••••••••••••••••••••••••••••••••';
    } else {
      tokenInput.placeholder = 'Enter your GitHub Personal Access Token';
    }
  }
  
  function showMain() {
    setupSection.style.display = 'none';
    mainContent.style.display = 'block';
  }
  
  // Event Listeners
  saveTokenBtn.addEventListener('click', async function() {
    const token = tokenInput.value.trim();
    if (token) {
      await chrome.storage.local.set({ githubToken: token });
      currentToken = token;
      clearCache();
      clearUserCache();
      showMain();
      await loadUserAndRepositories(token, true);
    }
  });
  
  cancelBtn.addEventListener('click', function() {
    if (currentToken) {
      tokenInput.value = '';
      showMain();
    }
  });
  
  refreshBtn.addEventListener('click', async function() {
    if (currentToken) {
      await loadUserAndRepositories(currentToken, true);
    }
  });
  
  settingsBtn.addEventListener('click', function() {
    showSetup();
  });
  
  tokenInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      saveTokenBtn.click();
    }
  });
  
  // Make functions globally available
  window.githubPopup = {
    loadUserAndRepositories,
    toggleRepoExpansion,
    formatRelativeTime,
    currentToken: () => currentToken,
    expandedRepos
  };
});