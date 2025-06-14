document.addEventListener('DOMContentLoaded', async function() {
  const setupSection = document.getElementById('setup-section');
  const mainContent = document.getElementById('main-content');
  const tokenInput = document.getElementById('token-input');
  const reposToLoadInput = document.getElementById('repos-to-load');
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
    
    // Load current settings for the form
    const settings = getSettings();
    reposToLoadInput.value = settings.reposToLoad;
  }
  
  function showMain() {
    setupSection.style.display = 'none';
    mainContent.style.display = 'block';
  }
  
  // Event Listeners
  saveTokenBtn.addEventListener('click', async function() {
    const token = tokenInput.value.trim();
    const reposToLoad = parseInt(reposToLoadInput.value) || 10;
    
    // Save settings
    updateSettings({ reposToLoad: reposToLoad });
    
    if (token) {
      await chrome.storage.local.set({ githubToken: token });
      currentToken = token;
      clearCache();
      clearUserCache();
      showMain();
      await loadUserAndRepositories(token, true);
    } else if (currentToken) {
      // If no new token but we have a current token, just update settings
      showMain();
      await loadUserAndRepositories(currentToken, true);
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
  
  reposToLoadInput.addEventListener('keypress', function(e) {
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