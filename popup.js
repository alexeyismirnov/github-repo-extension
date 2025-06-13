document.addEventListener('DOMContentLoaded', async function() {
  const setupSection = document.getElementById('setup-section');
  const mainContent = document.getElementById('main-content');
  const tokenInput = document.getElementById('token-input');
  const saveTokenBtn = document.getElementById('save-token');
  const refreshBtn = document.getElementById('refresh-btn');
  const settingsBtn = document.getElementById('settings-btn');
  const loading = document.getElementById('loading');
  const error = document.getElementById('error');
  const repoList = document.getElementById('repo-list');
  
  let currentToken = null;
  
  // Cache configuration
  const CACHE_KEY = 'github_repos_cache';
  const CACHE_TIMESTAMP_KEY = 'github_repos_cache_timestamp';
  
  // Check if token exists and load data
  await loadToken();
  
  async function loadToken() {
    const result = await chrome.storage.local.get(['githubToken']);
    currentToken = result.githubToken;
    
    if (!currentToken) {
      showSetup();
    } else {
      showMain();
      // Try to load from cache first, then fetch if needed
      await loadRepositoriesWithCache(currentToken, false);
    }
  }
  
  function showSetup() {
    setupSection.style.display = 'block';
    mainContent.style.display = 'none';
  }
  
  function showMain() {
    setupSection.style.display = 'none';
    mainContent.style.display = 'block';
  }
  
  // Save token
  saveTokenBtn.addEventListener('click', async function() {
    const token = tokenInput.value.trim();
    if (token) {
      await chrome.storage.local.set({ githubToken: token });
      currentToken = token;
      
      // Clear cache when token changes (different user might have different repos)
      clearCache();
      
      showMain();
      await loadRepositoriesWithCache(token, true); // Force fresh fetch for new token
    }
  });
  
  // Refresh button - always fetch fresh data
  refreshBtn.addEventListener('click', async function() {
    if (currentToken) {
      await loadRepositoriesWithCache(currentToken, true);
    }
  });
  
  // Settings button
  settingsBtn.addEventListener('click', function() {
    showSetup();
    tokenInput.value = ''; // Clear the input for security
  });
  
  // Cache management functions
  function getCachedData() {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      
      if (!cached || !timestamp) {
        return null;
      }
      
      return {
        data: JSON.parse(cached),
        timestamp: parseInt(timestamp)
      };
    } catch (error) {
      console.error('Error reading cache:', error);
      clearCache();
      return null;
    }
  }
  
  function setCachedData(data) {
    try {
      const timestamp = Date.now();
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, timestamp.toString());
    } catch (error) {
      console.error('Error setting cache:', error);
      // If localStorage is full, clear it and try again
      clearCache();
      try {
        const timestamp = Date.now();
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        localStorage.setItem(CACHE_TIMESTAMP_KEY, timestamp.toString());
      } catch (retryError) {
        console.error('Error setting cache on retry:', retryError);
      }
    }
  }
  
  function clearCache() {
    try {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_TIMESTAMP_KEY);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
  
  async function loadRepositoriesWithCache(token, forceFresh = false) {
    // If not forcing fresh data, try to load from cache first
    if (!forceFresh) {
      const cachedResult = getCachedData();
      if (cachedResult) {
        console.log('Loading repositories from cache');
        displayRepositories(cachedResult.data, cachedResult.timestamp);
        return;
      }
    }
    
    // If no cache or forcing fresh, fetch from API
    console.log('Fetching repositories from GitHub API');
    await loadRepositories(token);
  }
  
  async function loadRepositories(token) {
    // Add loading state to refresh button
    refreshBtn.classList.add('loading');
    refreshBtn.disabled = true;
    
    loading.style.display = 'block';
    error.style.display = 'none';
    repoList.innerHTML = '';
    
    try {
      // Fetch only 10 most recently updated repositories
      const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=10', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }
      
      const repos = await response.json();
      
      if (repos.length === 0) {
        loading.style.display = 'none';
        repoList.innerHTML = '<div style="text-align: center; padding: 20px; color: #586069;">No repositories found</div>';
        return;
      }
      
      // Fetch branch info for each repository
      const reposWithBranches = [];
      for (const repo of repos) {
        const branches = await getTop3UpdatedBranches(repo, token);
        reposWithBranches.push({
          ...repo,
          cachedBranches: branches
        });
      }
      
      // Cache the processed data
      setCachedData(reposWithBranches);
      
      // Display the repositories
      displayRepositories(reposWithBranches, Date.now());
      
    } catch (err) {
      loading.style.display = 'none';
      error.style.display = 'block';
      error.textContent = `Error loading repositories: ${err.message}`;
      
      // If token is invalid, show setup again
      if (err.message.includes('401')) {
        await chrome.storage.local.remove(['githubToken']);
        currentToken = null;
        clearCache(); // Clear cache for invalid token
        showSetup();
        error.textContent = 'Invalid token. Please enter a valid GitHub token.';
      }
    } finally {
      // Remove loading state from refresh button
      refreshBtn.classList.remove('loading');
      refreshBtn.disabled = false;
    }
  }
  
  function displayRepositories(reposWithBranches, timestamp) {
    loading.style.display = 'none';
    error.style.display = 'none';
    repoList.innerHTML = '';
    
    for (const repo of reposWithBranches) {
      const repoItem = createRepoItemFromCache(repo);
      repoList.appendChild(repoItem);
    }
    
    // Add cache status indicator
    addCacheStatusIndicator(timestamp);
  }
  
  function addCacheStatusIndicator(timestamp) {
    const timeSinceUpdate = getTimeSinceUpdate(timestamp);
    
    const indicator = document.createElement('div');
    indicator.style.cssText = `
      text-align: center;
      padding: 8px;
      font-size: 11px;
      color: #656d76;
      background: #f6f8fa;
      border-top: 1px solid #e1e4e8;
      margin-top: 8px;
    `;
    
    const isRecent = Date.now() - timestamp < 60000; // Less than 1 minute ago
    const statusIcon = isRecent ? '🟢' : '📦';
    const statusText = isRecent ? 'Just updated' : `Last updated ${timeSinceUpdate}`;
    
    indicator.innerHTML = `
      ${statusIcon} ${statusText} • 
      <span style="color: #0969da; cursor: pointer;" onclick="document.getElementById('refresh-btn').click()">
        Refresh now
      </span>
    `;
    
    repoList.appendChild(indicator);
  }
  
  function getTimeSinceUpdate(timestamp) {
    const now = Date.now();
    const diffInSeconds = Math.floor((now - timestamp) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minute${Math.floor(diffInSeconds / 60) === 1 ? '' : 's'} ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hour${Math.floor(diffInSeconds / 3600) === 1 ? '' : 's'} ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} day${Math.floor(diffInSeconds / 86400) === 1 ? '' : 's'} ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} month${Math.floor(diffInSeconds / 2592000) === 1 ? '' : 's'} ago`;
    return `${Math.floor(diffInSeconds / 31536000)} year${Math.floor(diffInSeconds / 31536000) === 1 ? '' : 's'} ago`;
  }
  
  async function getTop3UpdatedBranches(repo, token) {
    try {
      // Get all branches for the repository
      const branchesResponse = await fetch(`https://api.github.com/repos/${repo.full_name}/branches`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!branchesResponse.ok) {
        return [{
          name: repo.default_branch || 'main',
          lastUpdate: repo.updated_at,
          isDefault: true
        }];
      }
      
      const branches = await branchesResponse.json();
      
      if (branches.length === 0) {
        return [{
          name: repo.default_branch || 'main',
          lastUpdate: repo.updated_at,
          isDefault: true
        }];
      }
      
      // Get commit details for each branch to find update timestamps
      const branchesWithDates = [];
      
      for (const branch of branches.slice(0, 15)) { // Check up to 15 branches for better coverage
        try {
          const commitResponse = await fetch(`https://api.github.com/repos/${repo.full_name}/commits/${branch.commit.sha}`, {
            headers: {
              'Authorization': `token ${token}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          });
          
          if (commitResponse.ok) {
            const commit = await commitResponse.json();
            branchesWithDates.push({
              name: branch.name,
              lastUpdate: commit.commit.author.date,
              isDefault: branch.name === repo.default_branch
            });
          }
        } catch (e) {
          // Skip this branch if there's an error
          continue;
        }
      }
      
      // Sort by date (most recent first) and return top 3
      branchesWithDates.sort((a, b) => new Date(b.lastUpdate) - new Date(a.lastUpdate));
      return branchesWithDates.slice(0, 3);
      
    } catch (error) {
      // Fallback to default branch if there's any error
      return [{
        name: repo.default_branch || 'main',
        lastUpdate: repo.updated_at,
        isDefault: true
      }];
    }
  }
  
  function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
    return `${Math.floor(diffInSeconds / 31536000)}y ago`;
  }
  
  function createRepoItemFromCache(repo) {
    const item = document.createElement('div');
    item.className = 'repo-item';
    item.style.cursor = 'default';
    item.style.padding = '12px';
    item.style.marginBottom = '8px';
    
    const topBranches = repo.cachedBranches || [];
    
    const branchesHtml = topBranches.map(branch => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border-left: 3px solid ${branch.isDefault ? '#0969da' : '#656d76'}; padding-left: 8px; margin: 2px 0;">
        <span style="font-weight: 500; color: ${branch.isDefault ? '#0969da' : '#24292f'};">
          ${branch.name}${branch.isDefault ? ' (default)' : ''}
        </span>
        <span style="font-size: 12px; color: #656d76;">
          ${formatRelativeTime(branch.lastUpdate)}
        </span>
      </div>
    `).join('');
    
    item.innerHTML = `
      <div style="margin-bottom: 8px;">
        <a href="${repo.html_url}" target="_blank" class="repo-name" style="text-decoration: none; color: #0969da; font-weight: 600; font-size: 14px;">
          ${repo.name}
        </a>
      </div>
      <div style="font-size: 13px;">
        ${branchesHtml}
      </div>
    `;
    
    return item;
  }
});