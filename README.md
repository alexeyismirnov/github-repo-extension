# GitHub Repository Manager

## Description

The GitHub Repository Manager is a browser extension that provides quick access to your GitHub repositories, displaying essential information like branch details and recent commit activity. It helps you stay updated with your projects directly from your browser.

## Key Features

*   **Repository Listing:** Displays a list of your GitHub repositories, sorted by the last update time.
*   **Branch Information:** Shows the default branch and details of its latest commit, including author, message, and time.
*   **Expandable Details:** Click on a repository to view more details about its main branch's last commit.
*   **GitHub Token Setup:** Securely stores your GitHub Personal Access Token for API access.
*   **Data Caching:** Caches repository and user data to improve performance and reduce API calls.
*   **User Profile Display:** Shows your GitHub avatar, name, and username.
*   **Manual Refresh:** Allows you to manually refresh the repository data at any time.
*   **Clear UI:** Provides a clean and easy-to-navigate interface within the browser popup.

## Setup and Installation

1.  **Install from Chrome Web Store:**
    *   This extension is available on the Chrome Web Store. Install it from [this link](https://chromewebstore.google.com/detail/github-repository-manager/ephjfdfkiifeelejjcfagmjkmbjellpg).

2.  **Configure GitHub Personal Access Token:**
    *   Upon first launch, the extension will prompt you to enter a GitHub Personal Access Token.
    *   **How to get a GitHub token:**
        1.  Go to your GitHub Settings page.
        2.  Navigate to Developer settings → Personal access tokens → Tokens (classic).
        3.  Click on "Generate new token" (or "Generate new token (classic)").
        4.  Give your token a descriptive name (e.g., "GitHub Repository Manager Extension").
        5.  Select the `repo` scope. This scope grants access to your repositories, which is necessary for the extension to function.
        6.  Click "Generate token".
        7.  Copy the generated token. **Important:** GitHub will only show you this token once. Make sure to copy it before closing the page.
        8.  Paste this token into the extension's setup screen and click "Save Token".
