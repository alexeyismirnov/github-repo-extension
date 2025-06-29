// Cache configuration
const CACHE_KEY = 'github_repos_cache';
const CACHE_TIMESTAMP_KEY = 'github_repos_cache_timestamp';
const USER_CACHE_KEY = 'github_user_cache';
const SETTINGS_KEY = 'github_extension_settings';

// Default settings
const DEFAULT_SETTINGS = {
  reposToLoad: 10
};

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

function getCachedUser() {
  try {
    const cached = localStorage.getItem(USER_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Error reading user cache:', error);
    clearUserCache();
    return null;
  }
}

function setCachedUser(userData) {
  try {
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(userData));
  } catch (error) {
    console.error('Error setting user cache:', error);
  }
}

function clearUserCache() {
  try {
    localStorage.removeItem(USER_CACHE_KEY);
  } catch (error) {
    console.error('Error clearing user cache:', error);
  }
}

// New functions for settings management
function getSettings() {
  try {
    const settings = localStorage.getItem(SETTINGS_KEY);
    return settings ? JSON.parse(settings) : DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error reading settings:', error);
    return DEFAULT_SETTINGS;
  }
}

function updateSettings(newSettings) {
  try {
    // Get current settings and merge with new settings
    const currentSettings = getSettings();
    const updatedSettings = { ...currentSettings, ...newSettings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings));
    return updatedSettings;
  } catch (error) {
    console.error('Error updating settings:', error);
    return DEFAULT_SETTINGS;
  }
}