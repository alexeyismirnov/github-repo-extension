function displayRepositories(reposWithBranches, timestamp) {
  const loading = document.getElementById('loading');
  const error = document.getElementById('error');
  const repoList = document.getElementById('repo-list');
  
  loading.style.display = 'none';
  error.style.display = 'none';
  repoList.innerHTML = '';
  
  for (const repo of reposWithBranches) {
    const repoItem = createRepoItem(repo);
    repoList.appendChild(repoItem);
  }
  
  addCacheStatusIndicator(timestamp);
}

function createRepoItem(repo) {
  const item = document.createElement('div');
  item.className = 'repo-item';
  item.setAttribute('data-repo-id', repo.id);
  item.style.cssText = `
    cursor: pointer;
    padding: 12px;
    margin-bottom: 8px;
    border: 1px solid #e1e4e8;
    border-radius: 6px;
    background: #ffffff;
    transition: all 0.2s ease;
  `;
  
  const branches = repo.cachedBranches || [];
  const mainBranch = branches[0];
  
  // Simple collapsed view - just repo name and basic branch info
  const collapsedView = `
    <div style="display: flex; align-items: center; justify-content: space-between;">
      <div style="flex: 1;">
        <div style="margin-bottom: 8px;">
          <a href="${repo.html_url}" target="_blank" style="text-decoration: none; color: #0969da; font-weight: 600; font-size: 14px;" onclick="event.stopPropagation();">
            ${repo.name}
          </a>
        </div>
        ${mainBranch ? `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border-left: 3px solid #0969da; padding-left: 8px;">
            <span style="font-weight: 500; color: #0969da;">
              ${mainBranch.name} (default)
            </span>
            <span style="font-size: 12px; color: #656d76;">
              ${formatRelativeTime(mainBranch.lastUpdate)}
            </span>
          </div>
        ` : ''}
      </div>
      <div class="expand-icon" style="margin-left: 8px; transition: transform 0.2s ease; color: #656d76;">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z"></path>
        </svg>
      </div>
    </div>
  `;
  
  // Expanded view with commit details - NO duplicate branch name
  const expandedView = createExpandedView(branches, repo);
  
  item.innerHTML = `
    ${collapsedView}
    <div class="expanded-content" style="display: none; margin-top: 12px; padding-top: 12px; border-top: 1px solid #e1e4e8;">
      ${expandedView}
    </div>
  `;
  
  // Add click handler for expansion
  item.addEventListener('click', function() {
    toggleRepoExpansion(repo.id);
  });
  
  // Add hover effects
  item.addEventListener('mouseenter', function() {
    if (!window.githubPopup?.expandedRepos?.has(repo.id)) {
      this.style.background = '#f6f8fa';
    }
  });
  
  item.addEventListener('mouseleave', function() {
    if (!window.githubPopup?.expandedRepos?.has(repo.id)) {
      this.style.background = '#ffffff';
    }
  });
  
  // After rendering, add click handlers to commit elements
  setTimeout(() => {
    const commitContainers = item.querySelectorAll('.commit-container');
    commitContainers.forEach(container => {
      const commitUrl = container.getAttribute('data-commit-url');
      if (commitUrl) {
        // Make sure the entire container and its children open the commit URL
        container.addEventListener('click', function(e) {
          window.open(commitUrl, '_blank');
          e.stopPropagation();
        });
        
        // Specifically target the commit message and hash elements
        const commitMessage = container.querySelector('.commit-message');
        const commitHash = container.querySelector('.commit-hash');
        
        if (commitMessage) {
          commitMessage.addEventListener('click', function(e) {
            window.open(commitUrl, '_blank');
            e.stopPropagation();
          });
        }
        
        if (commitHash) {
          commitHash.addEventListener('click', function(e) {
            window.open(commitUrl, '_blank');
            e.stopPropagation();
          });
        }
      }
    });
  }, 0);
  
  return item;
}

function createExpandedView(branches, repo) {
  if (!branches || branches.length === 0) {
    return '<div style="color: #656d76; font-style: italic;">No branch information available</div>';
  }
  
  return branches.map(branch => {
    // Check if we have actual commit data
    if (!branch.commit) {
      return `
        <div style="padding-left: 12px;">
          <div style="background: #fff8dc; border: 1px solid #f1c40f; border-radius: 4px; padding: 8px;">
            <div style="font-size: 13px; color: #856404;">
              ⚠️ No commit information available
            </div>
            <div style="font-size: 11px; color: #856404; margin-top: 4px;">
              Repository last updated: ${formatRelativeTime(repo.updated_at)}
            </div>
          </div>
        </div>
      `;
    }
    
    const commitMessage = branch.commit.message.split('\n')[0];
    const truncatedMessage = commitMessage.length > 60 ? commitMessage.substring(0, 57) + '...' : commitMessage;
    
    return `
      <div style="padding-left: 12px;">
        <div class="commit-container" data-commit-url="${branch.commit.html_url}" style="background: #f6f8fa; border: 1px solid #e1e4e8; border-radius: 4px; padding: 8px; cursor: pointer;" 
             onclick="window.open('${branch.commit.html_url}', '_blank'); event.stopPropagation();">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            ${branch.commit.author.avatar_url ? 
              `<img src="${branch.commit.author.avatar_url}" alt="${branch.commit.author.name}" style="width: 16px; height: 16px; border-radius: 50%;">` : 
              `<div style="width: 16px; height: 16px; border-radius: 50%; background: #656d76; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold;">${branch.commit.author.name.charAt(0).toUpperCase()}</div>`
            }
            <span style="font-weight: 500; font-size: 12px; color: #24292f;">
              ${branch.commit.author.name}
            </span>
            <span style="font-size: 11px; color: #656d76;">
              ${formatRelativeTime(branch.commit.date)}
            </span>
          </div>
          <div class="commit-message" style="font-size: 13px; color: #24292f; margin-bottom: 6px; font-weight: 500; cursor: pointer;">
            ${truncatedMessage}
          </div>
          <div style="display: flex; justify-content: between; align-items: center;">
            <div class="commit-hash" style="font-size: 11px; color: #656d76; font-family: monospace; background: #e1e4e8; padding: 2px 6px; border-radius: 3px; cursor: pointer;">
              ${branch.commit.sha.substring(0, 7)}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function toggleRepoExpansion(repoId) {
  const repoItem = document.querySelector(`[data-repo-id="${repoId}"]`);
  if (!repoItem) return;
  
  const expandedContent = repoItem.querySelector('.expanded-content');
  const expandIcon = repoItem.querySelector('.expand-icon');
  
  // Initialize expandedRepos if it doesn't exist
  if (!window.githubPopup) {
    window.githubPopup = {};
  }
  if (!window.githubPopup.expandedRepos) {
    window.githubPopup.expandedRepos = new Set();
  }
  
  const expandedRepos = window.githubPopup.expandedRepos;
  
  if (expandedRepos.has(repoId)) {
    expandedRepos.delete(repoId);
    expandedContent.style.display = 'none';
    expandIcon.style.transform = 'rotate(0deg)';
    repoItem.style.background = '#ffffff';
  } else {
    expandedRepos.add(repoId);
    expandedContent.style.display = 'block';
    expandIcon.style.transform = 'rotate(90deg)';
    repoItem.style.background = '#f6f8fa';
    
    // After expanding, ensure click handlers are attached to commit elements
    setTimeout(() => {
      const commitContainers = repoItem.querySelectorAll('.commit-container');
      commitContainers.forEach(container => {
        const commitUrl = container.getAttribute('data-commit-url');
        if (commitUrl) {
          container.onclick = function(e) {
            window.open(commitUrl, '_blank');
            e.stopPropagation();
          };
          
          const commitMessage = container.querySelector('.commit-message');
          const commitHash = container.querySelector('.commit-hash');
          
          if (commitMessage) {
            commitMessage.onclick = function(e) {
              window.open(commitUrl, '_blank');
              e.stopPropagation();
            };
          }
          
          if (commitHash) {
            commitHash.onclick = function(e) {
              window.open(commitUrl, '_blank');
              e.stopPropagation();
            };
          }
        }
      });
    }, 10);
  }
}

function addCacheStatusIndicator(timestamp) {
  const repoList = document.getElementById('repo-list');
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
  
  const isRecent = Date.now() - timestamp < 60000;
  const statusIcon = isRecent ? '🟢' : '📦';
  const statusText = isRecent ? 'Just updated' : `Last updated ${timeSinceUpdate}`;
  
  // Create the indicator content with a span for "Refresh now"
  indicator.innerHTML = `
    ${statusIcon} ${statusText} • 
    <span id="refresh-now-link" style="color: #0969da; cursor: pointer;">
      Refresh now
    </span>
  `;
  
  // Append the indicator to the repo list
  repoList.appendChild(indicator);
  
  // Add event listener to the "Refresh now" link after it's added to the DOM
  const refreshNowLink = document.getElementById('refresh-now-link');
  if (refreshNowLink) {
    refreshNowLink.addEventListener('click', function(e) {
      // Find and click the refresh button
      const refreshBtn = document.getElementById('refresh-btn');
      if (refreshBtn) {
        refreshBtn.click();
      }
      e.stopPropagation();
    });
  }
}

function getTimeSinceUpdate(timestamp) {
  const now = Date.now();
  const diffInSeconds = Math.floor((now - timestamp) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minute${Math.floor(diffInSeconds / 60) === 1 ? '' : 's'} ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hour${Math.floor(diffInSeconds / 3600) === 1 ? '' : 's'} ago`;
  return `${Math.floor(diffInSeconds / 86400)} day${Math.floor(diffInSeconds / 86400) === 1 ? '' : 's'} ago`;
}