async function loadUserAndRepositories(token, forceFresh = false) {
  // Update loading status
  updateLoadingStatus("Loading user profile", "Connecting to GitHub API", 0, 2);
  await loadUserInfo(token, forceFresh);
  
  // Update loading status to indicate we're moving to repositories
  updateLoadingStatus("Loading repositories", "Fetching repository list", 1, 2);
  await loadRepositoriesWithCache(token, forceFresh);
}

async function loadUserInfo(token, forceFresh = false) {
  if (!forceFresh) {
    const cachedUser = getCachedUser();
    if (cachedUser) {
      updateLoadingStatus("Loading user profile", "Using cached user data", 1, 1);
      updateUserProfile(cachedUser);
      return;
    }
  }
  
  try {
    updateLoadingStatus("Loading user profile", "Fetching user data from GitHub", 0, 1);
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (response.ok) {
      const userData = await response.json();
      setCachedUser(userData);
      updateUserProfile(userData);
      updateLoadingStatus("Loading user profile", "User data loaded successfully", 1, 1);
    } else {
      updateUserProfile(null);
      updateLoadingStatus("Loading user profile", "Failed to load user data", 0, 1);
    }
  } catch (error) {
    console.error('Error fetching user info:', error);
    updateUserProfile(null);
    updateLoadingStatus("Loading user profile", "Error connecting to GitHub", 0, 1);
  }
}

function updateUserProfile(userData) {
  const userProfile = document.getElementById('user-profile');
  if (!userData) {
    userProfile.innerHTML = `
      <h3 style="margin: 0; color: white; font-size: 16px;">My Repositories</h3>
    `;
    return;
  }
  
  const displayName = userData.name || userData.login;
  const profileUrl = userData.html_url;
  const avatarUrl = userData.avatar_url;
  
  userProfile.innerHTML = `
    <a href="${profileUrl}" target="_blank" style="text-decoration: none; color: inherit; display: flex; align-items: center; gap: 8px; cursor: pointer;">
      <img src="${avatarUrl}" alt="${displayName}" style="width: 24px; height: 24px; border-radius: 50%; border: 1px solid rgba(255, 255, 255, 0.3);">
      <div>
        <div style="font-weight: 600; font-size: 14px; color: white;">${displayName}</div>
        <div style="font-size: 11px; color: rgba(255, 255, 255, 0.8);">@${userData.login}</div>
      </div>
    </a>
  `;
}

async function loadRepositoriesWithCache(token, forceFresh = false) {
  if (!forceFresh) {
    const cachedResult = getCachedData();
    if (cachedResult) {
      updateLoadingStatus("Loading repositories", "Using cached repository data", 1, 1);
      displayRepositories(cachedResult.data, cachedResult.timestamp);
      return;
    }
  }
  
  updateLoadingStatus("Loading repositories", "Fetching fresh data from GitHub", 0, 1);
  await loadRepositories(token);
}

async function loadRepositories(token) {
  const refreshBtn = document.getElementById('refresh-btn');
  const loading = document.getElementById('loading');
  const error = document.getElementById('error');
  const repoList = document.getElementById('repo-list');
  
  refreshBtn.classList.add('loading');
  refreshBtn.disabled = true;
  loading.style.display = 'flex';
  error.style.display = 'none';
  repoList.innerHTML = '';
  
  try {
    updateLoadingStatus("Loading repositories", "Connecting to GitHub API", 0, 100);
    
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
    updateLoadingStatus("Processing repositories", "Repository list retrieved", 10, 100);
    
    if (repos.length === 0) {
      loading.style.display = 'none';
      repoList.innerHTML = '<div style="text-align: center; padding: 20px; color: #586069;">No repositories found</div>';
      return;
    }
    
    // Process repos with simplified branch fetching
    const reposWithBranches = [];
    const totalRepos = repos.length;
    
    for (let i = 0; i < repos.length; i++) {
      const repo = repos[i];
      const progress = 10 + Math.floor((i / totalRepos) * 90); // Scale progress from 10% to 100%
      const repoName = repo.name;
      
      updateLoadingStatus(
        `Processing repository ${i + 1} of ${totalRepos}`, 
        `Fetching branches for ${repoName}`, 
        i, 
        totalRepos
      );
      
      console.log(`Processing ${repoName}...`);
      const branches = await getSimplifiedBranchInfo(repo, token, i, totalRepos);
      
      reposWithBranches.push({
        ...repo,
        cachedBranches: branches
      });
      
      // Update the progress indicator
      document.getElementById('progress-indicator').style.width = `${progress}%`;
      document.getElementById('loaded-count').textContent = i + 1;
    }
    
    updateLoadingStatus("Finalizing", "Rendering repository data", totalRepos, totalRepos);
    
    setCachedData(reposWithBranches);
    displayRepositories(reposWithBranches, Date.now());
    
  } catch (err) {
    loading.style.display = 'none';
    error.style.display = 'block';
    error.textContent = `Error loading repositories: ${err.message}`;
    
    if (err.message.includes('401')) {
      await chrome.storage.local.remove(['githubToken']);
      clearCache();
      clearUserCache();
      showSetup();
      error.textContent = 'Invalid token. Please enter a valid GitHub token.';
    }
  } finally {
    refreshBtn.classList.remove('loading');
    refreshBtn.disabled = false;
    loading.style.display = 'none';
  }
}

// Helper function to update the loading status UI
function updateLoadingStatus(title, detail, current, total) {
  const loadingTitle = document.getElementById('loading-title');
  const loadingDetail = document.getElementById('loading-detail');
  const progressIndicator = document.getElementById('progress-indicator');
  const loadedCount = document.getElementById('loaded-count');
  const totalCount = document.getElementById('total-count');
  
  if (loadingTitle) loadingTitle.textContent = title;
  if (loadingDetail) loadingDetail.textContent = detail;
  
  if (progressIndicator && total > 0) {
    const percentage = Math.min(Math.floor((current / total) * 100), 100);
    progressIndicator.style.width = `${percentage}%`;
  }
  
  if (loadedCount) loadedCount.textContent = current;
  if (totalCount) totalCount.textContent = total;
}