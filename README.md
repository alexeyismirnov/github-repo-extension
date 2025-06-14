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

1.  **Download or Clone:**
    *   Download the repository files as a ZIP and extract them, or clone the repository to your local machine.

2.  **Load the Extension in Your Browser:**
    *   **Chrome/Edge:**
        1.  Open your browser and navigate to `chrome://extensions` (for Chrome) or `edge://extensions` (for Edge).
        2.  Enable "Developer mode" (usually a toggle switch in the top right corner).
        3.  Click on "Load unpacked".
        4.  Select the directory where you extracted/cloned the extension files.
    *   **Firefox:**
        1.  Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
        2.  Click on "Load Temporary Add-on...".
        3.  Select the `manifest.json` file from the extension's directory. (Note: Temporary loading means it will be removed when Firefox is closed unless you package and sign it.)

3.  **Configure GitHub Personal Access Token:**
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

## Usage

*   **Opening the Extension:** Click on the GitHub Repository Manager icon in your browser's toolbar to open the popup.
*   **Initial Setup:** If you haven't saved a token, the setup screen will appear. Enter your GitHub Personal Access Token as described in the Setup section.
*   **Viewing Repositories:** Once configured, the main view will display a list of your repositories.
*   **Expanding Repository Details:** Click on any repository item in the list. This will expand the view to show details of the latest commit on the default branch, including the commit message, author, and commit hash. Click again to collapse.
*   **Refreshing Data:** Click the refresh icon (circular arrows) in the header to fetch the latest repository and branch information from GitHub.
*   **Accessing Settings:** Click the settings icon (gear) in the header to return to the token setup screen, where you can update or change your GitHub token.
*   **Navigating to GitHub:**
    *   Click on a repository's name to open its main page on GitHub in a new tab.
    *   Click on a commit message or hash in the expanded view to open that specific commit on GitHub in a new tab.
    *   Click on your username or avatar in the header to open your GitHub profile page in a new tab.

## Technologies Used

*   **HTML:** For the structure of the extension popup.
*   **CSS:** For styling the user interface.
*   **JavaScript:** For the core logic, API interactions, and dynamic content rendering.
*   **GitHub API (v3):** To fetch repository and user data.
*   **Web Extensions API:** Standard browser APIs for extension development (e.g., `chrome.storage`).

## File Structure

Here's a brief overview of the key files in this project:

*   **`manifest.json`**: The manifest file that defines the extension's properties, permissions, and entry points.
*   **`popup.html`**: The HTML structure for the extension's popup interface.
*   **`popup.css`**: Contains the styles for the `popup.html` interface.
*   **`popup.js`**: The main JavaScript file that controls the popup's behavior, user interactions, and coordinates with other modules.
*   **`api-handler.js`**: Handles all communication with the GitHub API, including fetching user and repository data.
*   **`branch-handler.js`**: Responsible for fetching and processing detailed branch and commit information for repositories.
*   **`cache-manager.js`**: Manages caching of data (repositories, user info) in `localStorage` to improve performance and reduce API calls.
*   **`ui-renderer.js`**: Contains functions to render the repository list and individual repository items in the UI.
*   **`icons/`**: (Directory) Contains the icons used for the extension (e.g., browser toolbar icon, favicon).
*   **`.gitignore`**: Specifies intentionally untracked files that Git should ignore.
