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
  
  // Check if token exists
  await loadToken();
  
  async function loadToken() {
    const result = await chrome.storage.local.get(['githubToken']);
    currentToken = result.githubToken;
    
    if (!currentToken) {
      showSetup();
    } else {
      showMain();
      loadRepositories(currentToken);
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
      showMain();
      loadRepositories(token);
    }
  });
  
  // Refresh button
  refreshBtn.addEventListener('click', function() {
    if (currentToken) {
      loadRepositories(currentToken);
    }
  });
  
  // Settings button
  settingsBtn.addEventListener('click', function() {
    showSetup();
    tokenInput.value = ''; // Clear the input for security
  });
  
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
      loading.style.display = 'none';
      
      if (repos.length === 0) {
        repoList.innerHTML = '<div style="text-align: center; padding: 20px; color: #586069;">No repositories found</div>';
        return;
      }
      
      // Fetch branch info for each repository
      for (const repo of repos) {
        const repoItem = await createRepoItem(repo, token);
        repoList.appendChild(repoItem);
      }
      
    } catch (err) {
      loading.style.display = 'none';
      error.style.display = 'block';
      error.textContent = `Error loading repositories: ${err.message}`;
      
      // If token is invalid, show setup again
      if (err.message.includes('401')) {
        await chrome.storage.local.remove(['githubToken']);
        currentToken = null;
        showSetup();
        error.textContent = 'Invalid token. Please enter a valid GitHub token.';
      }
    } finally {
      // Remove loading state from refresh button
      refreshBtn.classList.remove('loading');
      refreshBtn.disabled = false;
    }
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
  
  async function createRepoItem(repo, token) {
    const item = document.createElement('div');
    item.className = 'repo-item';
    item.style.cursor = 'default';
    item.style.padding = '12px';
    item.style.marginBottom = '8px';
    
    // Get the top 3 updated branches
    const topBranches = await getTop3UpdatedBranches(repo, token);
    
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