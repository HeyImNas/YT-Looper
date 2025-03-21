# YouTube Looper Firefox Extension

A Firefox browser extension that allows you to easily loop specific parts of YouTube videos by setting custom timestamps.

## Features

- Set custom start and end timestamps for video loops
- Save multiple loops for different parts of videos
- Simple and intuitive interface
- Collapsible widget that stays out of your way when not needed
- Automatically remembers your loops for each YouTube video
- Works in both light and dark YouTube themes

## Installation

1. Download this repository
2. Open Firefox and navigate to `about:debugging`
3. Click on "This Firefox" in the left menu
4. Click "Load Temporary Add-on..."
5. Navigate to the downloaded repository and select the `manifest.json` file

## Usage

1. Go to any YouTube video
2. The YouTube Looper widget will appear near the video player (collapsed by default)
3. Click on the "YouTube Looper ▼" button to expand the control panel
4. Set start and end timestamps either manually or using the "Set Current" buttons
5. Click "Apply Loop" or toggle "Loop Active" to start looping
6. Save your favorite loops with the "Save Loop" button
7. Click the header again to collapse the panel when not in use

### Widget Placement

The extension will try to place the looper widget in the most appropriate location near the video player. Due to YouTube's frequent layout changes, the exact placement may vary, but the extension will attempt these locations in order:

1. Directly below the video player (before the title and description)
2. After the player container
3. At the top of the main content area
4. After the video element itself

If you don't see the widget immediately, try refreshing the page or navigating to a different video.

### Collapsible Interface

The widget starts in a collapsed state to be as unobtrusive as possible. Only a small header bar is visible until you need the controls. This design:

- Minimizes the space used on the YouTube page
- Reduces visual clutter when not actively setting loops
- Still keeps the looper accessible with just one click
- Remembers your preferred state for each video

## Packaging and Distribution

### Using the Package Script
1. Run the included `package.bat` script by double-clicking it
2. The script will create a `youtube-looper.zip` file containing all extension files
3. This zip file can be submitted to [Firefox Add-ons](https://addons.mozilla.org/developers/) for publication

### Manual Packaging
If you prefer to package the extension manually:
1. Create a ZIP file containing the following files:
   - `manifest.json`
   - `content.js`
   - `styles.css`
   - `icons/` directory with all icon files
2. Make sure to include proper PNG icon files as referenced in the manifest.json

### Note on Icons
The extension includes placeholder icon files. For a proper extension:
1. Convert the `icon.svg` to PNG format in the required sizes (48x48 and 96x96)
2. Replace the placeholder files in the `icons/` directory

## Troubleshooting

If you don't see the YouTube Looper widget:
1. Make sure you're on a YouTube video page (URL should contain "youtube.com/watch")
2. Try refreshing the page
3. Check the browser console for any error messages
4. If problems persist, try reinstalling the extension

## License

MIT
