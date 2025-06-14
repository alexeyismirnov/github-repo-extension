// Make displayRepositories available globally
window.displayRepositories = function(reposWithBranches, timestamp) {
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
};

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
  
  // Sort branches strictly by last update time (most recent first)
  const branches = (repo.cachedBranches || []).sort((a, b) => {
    return new Date(b.lastUpdate) - new Date(a.lastUpdate);
  });
  
  // Generate branch preview elements for collapsed view
  let branchPreviewsHtml = '';
  
  if (branches.length === 0) {
    branchPreviewsHtml = `
      <div style="padding: 4px 0; color: #656d76; font-style: italic;">
        No branch information available
      </div>
    `;
  } else {
    // Generate HTML for each branch (limited to 3 in collapsed view)
    branchPreviewsHtml = branches.slice(0, 3).map(branch => {
      const isDefault = branch.isDefault;
      const borderColor = isDefault ? '#0969da' : '#e1e4e8';
      const nameColor = isDefault ? '#0969da' : '#24292f';
      const nameWeight = isDefault ? '600' : '500';
      const defaultLabel = isDefault ? ' (default)' : '';
      
      return `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border-left: 3px solid ${borderColor}; padding-left: 8px; margin-bottom: 4px;">
          <span style="font-weight: ${nameWeight}; color: ${nameColor};">
            ${branch.name}${defaultLabel}
          </span>
          <span style="font-size: 12px; color: #656d76;">
            ${formatRelativeTime(branch.lastUpdate)}
          </span>
        </div>
      `;
    }).join('');
    
    // Add indicator if there are more branches
    if (branches.length > 3) {
      branchPreviewsHtml += `
        <div style="font-size: 12px; color: #656d76; text-align: right; padding: 2px 0;">
          +${branches.length - 3} more branches
        </div>
      `;
    }
  }
  
  // Create repo link element
  const repoLink = document.createElement('a');
  repoLink.href = repo.html_url;
  repoLink.target = "_blank";
  repoLink.style.cssText = "text-decoration: none; color: #0969da; font-weight: 600; font-size: 14px;";
  repoLink.textContent = repo.name;
  
  // Create repo title div
  const repoTitleDiv = document.createElement('div');
  repoTitleDiv.style.marginBottom = repo.homepage ? '4px' : '8px';
  repoTitleDiv.appendChild(repoLink);
  
  // Create homepage link if it exists
  let homepageDiv = null;
  if (repo.homepage) {
    homepageDiv = document.createElement('div');
    homepageDiv.style.cssText = "margin-bottom: 8px; font-size: 12px; color: #57606a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;";
    
    const homepageLink = document.createElement('a');
    homepageLink.href = repo.homepage;
    homepageLink.target = "_blank";
    homepageLink.style.cssText = "text-decoration: none; color: #57606a;";
    homepageLink.textContent = repo.homepage;
    
    homepageDiv.appendChild(homepageLink);
  }
  
  // Create branch previews div
  const branchPreviewsDiv = document.createElement('div');
  branchPreviewsDiv.className = "branch-previews";
  branchPreviewsDiv.innerHTML = branchPreviewsHtml;
  
  // Create left column div
  const leftColDiv = document.createElement('div');
  leftColDiv.style.flex = "1";
  leftColDiv.appendChild(repoTitleDiv);
  if (homepageDiv) {
    leftColDiv.appendChild(homepageDiv);
  }
  leftColDiv.appendChild(branchPreviewsDiv);
  
  // Create expand icon
  const expandIconDiv = document.createElement('div');
  expandIconDiv.className = "expand-icon";
  expandIconDiv.style.cssText = "margin-left: 8px; transition: transform 0.2s ease; color: #656d76;";
  expandIconDiv.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z"></path>
    </svg>
  `;
  
  // Create collapsed view container
  const collapsedViewDiv = document.createElement('div');
  collapsedViewDiv.style.cssText = "display: flex; align-items: flex-start; justify-content: space-between;";
  collapsedViewDiv.appendChild(leftColDiv);
  collapsedViewDiv.appendChild(expandIconDiv);
  
  // Create expanded content div
  const expandedContentDiv = document.createElement('div');
  expandedContentDiv.className = "expanded-content";
  expandedContentDiv.style.cssText = "display: none; margin-top: 12px; padding-top: 12px; border-top: 1px solid #e1e4e8;";
  expandedContentDiv.innerHTML = createExpandedView(branches, repo);
  
  // Add elements to the main item
  item.appendChild(collapsedViewDiv);
  item.appendChild(expandedContentDiv);
  
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
  
  // Prevent repo link and homepage link from triggering expansion
  repoLink.addEventListener('click', function(e) {
    e.stopPropagation();
  });
  
  if (homepageDiv) {
    const homepageLink = homepageDiv.querySelector('a');
    homepageLink.addEventListener('click', function(e) {
      e.stopPropagation();
    });
  }
  
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
  
  // Add branch name header to each commit section
  return branches.map(branch => {
    // Check if we have actual commit data
    if (!branch.commit) {
      return `
        <div style="padding-left: 12px; margin-bottom: 12px;">
          <div style="font-weight: 600; margin-bottom: 4px; display: flex; align-items: center;">
            <svg style="margin-right: 4px;" width="16" height="16" viewBox="0 0 16 16" fill="#57606a">
              <path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25-.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z"></path>
            </svg>
            ${branch.name} ${branch.isDefault ? '<span style="font-size: 12px; color: #0969da; background: #ddf4ff; padding: 1px 5px; border-radius: 10px; margin-left: 5px;">default</span>' : ''}
          </div>
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
      <div style="padding-left: 12px; margin-bottom: 16px;">
        <div style="font-weight: 600; margin-bottom: 4px; display: flex; align-items: center;">
          <svg style="margin-right: 4px;" width="16" height="16" viewBox="0 0 16 16" fill="#57606a">
            <path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25-.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z"></path>
          </svg>
          ${branch.name} ${branch.isDefault ? '<span style="font-size: 12px; color: #0969da; background: #ddf4ff; padding: 1px 5px; border-radius: 10px; margin-left: 5px;">default</span>' : ''}
        </div>
        <div class="commit-container" data-commit-url="${branch.commit.html_url}" style="background: #f6f8fa; border: 1px solid #e1e4e8; border-radius: 4px; padding: 8px; cursor: pointer;">
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
          container.addEventListener('click', function(e) {
            window.open(commitUrl, '_blank');
            e.stopPropagation();
          });
          
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
  const statusSpan = document.createElement('span');
  statusSpan.textContent = `${statusIcon} ${statusText} • `;
  
  const refreshLink = document.createElement('span');
  refreshLink.id = 'refresh-now-link';
  refreshLink.style.cssText = 'color: #0969da; cursor: pointer;';
  refreshLink.textContent = 'Refresh now';
  
  // Add elements to indicator
  indicator.appendChild(statusSpan);
  indicator.appendChild(refreshLink);
  
  // Append the indicator to the repo list
  repoList.appendChild(indicator);
  
  // Add event listener to the "Refresh now" link after it's added to the DOM
  refreshLink.addEventListener('click', function(e) {
    e.stopPropagation();
    
    // DIRECT APPROACH: Get the token and call loadUserAndRepositories directly
    if (window.githubPopup && typeof window.githubPopup.currentToken === 'function') {
      const token = window.githubPopup.currentToken();
      if (token && typeof window.githubPopup.loadUserAndRepositories === 'function') {
        window.githubPopup.loadUserAndRepositories(token, true);
        return;
      }
    }
    
    // Fallback to the global forceRefresh function
    if (typeof window.forceRefresh === 'function') {
      window.forceRefresh();
      return;
    }
    
    // Last resort: try clicking the refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
      refreshBtn.click();
    }
  });
}

function getTimeSinceUpdate(timestamp) {
  const now = Date.now();
  const diffInSeconds = Math.floor((now - timestamp) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minute${Math.floor(diffInSeconds / 60) === 1 ? '' : 's'} ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hour${Math.floor(diffInSeconds / 3600) === 1 ? '' : 's'} ago`;
  return `${Math.floor(diffInSeconds / 86400)} day${Math.floor(diffInSeconds / 86400) === 1 ? '' : 's'} ago`;
}

// Check for cached data that might have been set before this script loaded
document.addEventListener('DOMContentLoaded', function() {
  if (window.cachedRepoData) {
    window.displayRepositories(window.cachedRepoData.data, window.cachedRepoData.timestamp);
    window.cachedRepoData = null; // Clear it after use
  }
});