# Camera Setup Guide

This guide explains how to connect your Ring or Wyze cameras to the Family Hub display.

## Quick Setup

### Method 1: Using Browser Console (Easiest)

1. Open your Family Hub dashboard in your browser
2. Press `F12` (or `Cmd+Option+I` on Mac) to open Developer Tools
3. Go to the "Console" tab
4. Run these commands to set your camera URLs:

```javascript
// For Ring cameras (using Ring's web interface)
localStorage.setItem('camera1', 'YOUR_RING_CAMERA_URL_HERE');
localStorage.setItem('camera2', 'YOUR_SECOND_CAMERA_URL_HERE');

// For Wyze cameras (using Wyze web interface)
localStorage.setItem('camera1', 'YOUR_WYZE_CAMERA_URL_HERE');
localStorage.setItem('camera2', 'YOUR_SECOND_CAMERA_URL_HERE');
```

5. Refresh the page to see your camera feeds

### Method 2: Direct iframe URLs

You can use any camera that provides an embeddable iframe URL. Common formats:

- **Ring**: Ring doesn't provide direct iframe embeds, but you can use their web app URL
- **Wyze**: Similar limitation - they use their own app interface
- **Generic IP cameras**: Many support RTSP or HTTP streams that can be embedded

## Ring Camera Setup

Ring cameras don't provide direct iframe embeds, but you have a few options:

### Option A: Ring Web App (Limited)
Ring's web interface at https://ring.com doesn't allow direct embedding due to authentication requirements.

### Option B: Use Ring's Public Share Feature
1. Open the Ring app
2. Go to your camera
3. Share → Create Share Link
4. Copy the share link
5. Note: This may require authentication and won't work in an iframe

### Option C: Third-Party Integration
Consider using services like:
- **Home Assistant** with Ring integration
- **Homebridge** with Ring plugin
- These can create embeddable streams

## Wyze Camera Setup

Wyze cameras also have limitations for direct embedding:

### Option A: Wyze Web App
Wyze's web interface requires login and doesn't support direct iframe embedding.

### Option B: RTSP Stream (Advanced)
If your Wyze camera supports RTSP:
1. Enable RTSP in Wyze app settings
2. Get your camera's RTSP URL (format: `rtsp://username:password@ip:port/stream`)
3. Convert RTSP to HLS or use a streaming server
4. Use the converted URL in the camera feed

### Option C: Third-Party Solutions
- Use **Home Assistant** with Wyze integration
- Use **TinyCam** or similar apps that can create web streams
- Use **VLC** or **FFmpeg** to convert RTSP to web-compatible format

## Generic IP Camera Setup

If you have IP cameras (not Ring/Wyze), they often support direct embedding:

### HTTP Stream
Many IP cameras provide HTTP streams:
```
http://camera-ip:port/video.mjpg
http://camera-ip:port/stream
```

### RTSP to Web Conversion
For RTSP cameras, you'll need to convert the stream:
1. Use **VLC** to convert RTSP to HTTP
2. Use **FFmpeg** with a streaming server
3. Use services like **Motion** or **ZoneMinder**

## Recommended Solutions

### For Best Results:

1. **Home Assistant Integration** (Recommended)
   - Install Home Assistant
   - Add Ring or Wyze integration
   - Create camera entities
   - Use Home Assistant's camera proxy URLs
   - These URLs can be embedded in iframes

2. **TinyCam Pro** (Android)
   - Supports both Ring and Wyze
   - Can create web streams
   - Provides embeddable URLs

3. **Scrypted** (Advanced)
   - Home automation platform
   - Excellent camera integration
   - Creates web-compatible streams

## Setting Up Camera URLs

Once you have embeddable URLs:

1. Open browser console on your dashboard
2. Set camera URLs:
   ```javascript
   localStorage.setItem('camera1', 'https://your-camera-url-here');
   localStorage.setItem('camera2', 'https://your-second-camera-url-here');
   ```
3. Refresh the page

## Troubleshooting

### Camera not showing?
- Check browser console for errors
- Verify the URL is accessible
- Ensure the URL supports iframe embedding (check for X-Frame-Options header)
- Try opening the URL directly in a new tab

### Authentication issues?
- Some cameras require authentication in the URL
- Format: `https://username:password@camera-url`
- Consider using a proxy or authentication service

### CORS errors?
- The camera server may block cross-origin requests
- You may need a proxy server
- Consider using Home Assistant or similar service as a proxy

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never expose camera credentials in URLs** if possible
2. **Use HTTPS** for camera streams when available
3. **Consider using a VPN** or local network only
4. **Use authentication tokens** instead of passwords
5. **Regularly update camera firmware**
6. **Use strong passwords** for camera accounts

## Alternative: Static Images

If live streaming isn't possible, you can set up cameras to refresh static images:

```javascript
// For cameras that provide snapshot URLs
localStorage.setItem('camera1', 'https://camera-url/snapshot.jpg');
// Then modify the code to use <img> instead of <iframe>
```

## Need Help?

If you're having trouble setting up cameras:
1. Check your camera manufacturer's documentation
2. Look for "web interface" or "embed" options
3. Consider using Home Assistant for better integration
4. Check if your camera supports ONVIF (standard protocol)

