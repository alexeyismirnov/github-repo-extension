async function getSimplifiedBranchInfo(repo, token) {
  try {
    console.log(`Getting branch info for ${repo.name}`);
    const defaultBranch = repo.default_branch || 'main';
    
    // First, fetch all branches for the repository
    const branchesUrl = `https://api.github.com/repos/${repo.full_name}/branches`;
    console.log(`Fetching all branches from: ${branchesUrl}`);
    
    const branchesResponse = await fetch(branchesUrl, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!branchesResponse.ok) {
      console.error(`Failed to fetch branches: ${branchesResponse.status}`);
      // Fall back to just the default branch if we can't get all branches
      const branch = await getSingleBranchWithCommit(repo, defaultBranch, token, true);
      return branch ? [branch] : [];
    }
    
    const branches = await branchesResponse.json();
    console.log(`Found ${branches.length} branches for ${repo.name}`);
    
    // Get commit data for each branch (limit to reasonable number to avoid API rate limits)
    const maxBranches = 10; // Adjust this number as needed
    const branchesToProcess = branches.slice(0, maxBranches);
    
    const branchesWithCommits = [];
    for (const branchInfo of branchesToProcess) {
      const isDefault = branchInfo.name === defaultBranch;
      const branch = await getSingleBranchWithCommit(repo, branchInfo.name, token, isDefault);
      if (branch) {
        branchesWithCommits.push(branch);
      }
    }
    
    if (branchesWithCommits.length === 0) {
      console.log(`No valid branches with commits found for ${repo.name}`);
      return [{
        name: defaultBranch,
        lastUpdate: repo.updated_at,
        isDefault: true,
        commit: null
      }];
    }
    
    return branchesWithCommits;
    
  } catch (error) {
    console.error(`Error getting branch info for ${repo.name}:`, error);
    return [{
      name: repo.default_branch || 'main',
      lastUpdate: repo.updated_at,
      isDefault: true,
      commit: null
    }];
  }
}

async function getSingleBranchWithCommit(repo, branchName, token, isDefault = false) {
  try {
    console.log(`Fetching commit for ${repo.full_name}/${branchName}`);
    
    // Try to get the latest commit from the specific branch
    const commitUrl = `https://api.github.com/repos/${repo.full_name}/commits/${branchName}`;
    console.log(`Trying commit URL: ${commitUrl}`);
    
    const response = await fetch(commitUrl, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!response.ok) {
      console.log(`Direct commit fetch failed (${response.status}), trying commits list...`);
      
      // Try getting commits list as fallback
      const commitsUrl = `https://api.github.com/repos/${repo.full_name}/commits?sha=${branchName}&per_page=1`;
      console.log(`Trying commits list URL: ${commitsUrl}`);
      
      const commitsResponse = await fetch(commitsUrl, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!commitsResponse.ok) {
        console.log(`Commits list also failed (${commitsResponse.status})`);
        return null;
      }
      
      const commits = await commitsResponse.json();
      if (!commits || commits.length === 0) {
        console.log(`No commits found in response`);
        return null;
      }
      
      const commitData = commits[0];
      console.log(`Got commit from list:`, {
        sha: commitData.sha.substring(0, 7),
        message: commitData.commit.message.split('\n')[0].substring(0, 50),
        author: commitData.commit.author.name,
        date: commitData.commit.author.date
      });
      
      return createBranchObject(branchName, commitData, isDefault);
    }
    
    const commitData = await response.json();
    console.log(`Got commit directly:`, {
      sha: commitData.sha.substring(0, 7),
      message: commitData.commit.message.split('\n')[0].substring(0, 50),
      author: commitData.commit.author.name,
      date: commitData.commit.author.date
    });
    
    return createBranchObject(branchName, commitData, isDefault);
    
  } catch (error) {
    console.error(`Error fetching commit for ${branchName}:`, error);
    return null;
  }
}

function createBranchObject(branchName, commitData, isDefault) {
  // Make sure we have actual commit data
  if (!commitData || !commitData.commit || !commitData.sha) {
    console.log(`Invalid commit data for ${branchName}`);
    return null;
  }
  
  return {
    name: branchName,
    lastUpdate: commitData.commit.author.date,
    isDefault: isDefault,
    commit: {
      sha: commitData.sha,
      message: commitData.commit.message, // This should be the actual commit message
      author: {
        name: commitData.commit.author.name,
        email: commitData.commit.author.email,
        avatar_url: commitData.author ? commitData.author.avatar_url : null,
        login: commitData.author ? commitData.author.login : null
      },
      html_url: commitData.html_url,
      date: commitData.commit.author.date
    }
  };
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