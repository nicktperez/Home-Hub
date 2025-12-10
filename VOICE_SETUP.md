# Voice Commands Setup Guide

This guide explains how to use voice commands with your Family Hub dashboard, including browser-based voice recognition, Alexa integration, and Siri shortcuts.

## Browser-Based Voice Commands (Built-in)

The dashboard includes built-in voice recognition using the Web Speech API. This works on any device with a microphone.

### How to Use

1. **Click the microphone button** (🎤) in the bottom-left corner of the screen
2. **Speak your command** clearly
3. The system will process your command and provide feedback

### Supported Commands

#### Shopping List
- "Add [item] to shopping list"
- "Shopping list [item]"
- "Add [item] to shopping"

**Examples:**
- "Add milk to shopping list"
- "Shopping list bread"
- "Add eggs to shopping"

#### Notes
- "Add [text] to notes"
- "Note [text]"
- "Remember [text]"

**Examples:**
- "Add pick up dry cleaning to notes"
- "Note call dentist tomorrow"
- "Remember birthday party on Saturday"

#### Projects
- "Add [project] to projects"
- "Project [name]"
- "New project [name]"

**Examples:**
- "Add paint bedroom to projects"
- "Project fix garage door"
- "New project organize basement"

#### Navigation
- "Show month" / "Go to month" / "Month view"
- "Show week" / "Go to week" / "Week view"
- "Show today" / "Go to today" / "Today view"
- "Show projects" / "Go to projects" / "Projects view"
- "Show notes" / "Go to notes" / "Notes view"
- "Show shopping" / "Go to shopping" / "Shopping list"

### Browser Requirements

- **Chrome/Edge**: Full support
- **Safari**: Limited support (may require macOS/iOS 14.5+)
- **Firefox**: Limited support
- **Mobile**: Works on mobile browsers with microphone access

### Permissions

The browser will ask for microphone permission on first use. You must allow microphone access for voice commands to work.

---

## Alexa Integration

You can integrate Alexa to control your Family Hub using Alexa Routines or a custom skill.

### Method 1: Alexa Routines (Easiest)

1. **Open Alexa App** on your phone
2. Go to **More** → **Routines**
3. Tap **+** to create a new routine
4. **When this happens**: Choose a voice command (e.g., "Add milk to shopping list")
5. **Add action** → **Smart Home** → **Web Request**
6. Configure the web request:
   - **Method**: POST
   - **URL**: `https://your-vercel-url.vercel.app/api/shopping`
   - **Headers**: 
     - `Content-Type: application/json`
   - **Body**:
     ```json
     {
       "item": "milk"
     }
     ```

7. Save the routine

### Method 2: Custom Alexa Skill (Advanced)

For more control, you can create a custom Alexa skill:

1. **Go to [Alexa Developer Console](https://developer.amazon.com/alexa/console/ask)**
2. Create a new skill
3. Use the **Alexa-Hosted** option for quick setup
4. Configure intents for:
   - AddShoppingItem
   - AddNote
   - AddProject
   - NavigateToSlide

5. In your skill code, make HTTP requests to your API:
   ```javascript
   const response = await fetch('https://your-vercel-url.vercel.app/api/shopping', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ item: 'milk' })
   });
   ```

### Alexa Voice Commands Examples

Once set up, you can say:
- "Alexa, add milk to shopping list"
- "Alexa, add note: pick up dry cleaning"
- "Alexa, new project: paint bedroom"

---

## Siri Shortcuts (iOS/Mac)

You can create Siri shortcuts to control your Family Hub from Apple devices.

### Setting Up Siri Shortcuts

1. **Open Shortcuts app** on your iPhone/iPad/Mac
2. Tap **+** to create a new shortcut
3. **Add Action** → **Get Contents of URL**
4. Configure:
   - **URL**: `https://your-vercel-url.vercel.app/api/shopping`
   - **Method**: POST
   - **Headers**: 
     - `Content-Type: application/json`
   - **Request Body**: JSON
     ```json
     {
       "item": "milk"
     }
     ```

5. **Add Action** → **Show Notification** (optional, for feedback)
6. Tap the shortcut name to rename it (e.g., "Add to Shopping List")
7. Tap **Add to Siri** to record your voice command
8. Say your command (e.g., "Add to shopping list")

### Creating Multiple Shortcuts

Create separate shortcuts for:
- **Add to Shopping List**: POST to `/api/shopping`
- **Add Note**: POST to `/api/notes`
- **Add Project**: POST to `/api/projects`

### Siri Voice Commands

After setup, you can say:
- "Hey Siri, add to shopping list" (then say the item)
- "Hey Siri, add note" (then say the note)
- "Hey Siri, new project" (then say the project name)

### Advanced: Shortcuts with Input

For more flexibility, create shortcuts that ask for input:

1. **Add Action** → **Ask for Input**
2. Set input type to "Text"
3. Set prompt (e.g., "What item?")
4. Use the input variable in your API call:
   ```json
   {
     "item": "[Input]"
   }
   ```

---

## API Endpoints Reference

All voice commands use these API endpoints:

### Shopping List
```
POST /api/shopping
Body: { "item": "milk" }
```

### Notes
```
POST /api/notes
Body: { "content": "Pick up dry cleaning", "color": "yellow" }
```

### Projects
```
POST /api/projects
Body: { "title": "Paint bedroom" }
```

### Navigation
Navigation is handled client-side, but you can trigger it via:
- Browser voice commands (built-in)
- Custom Alexa skill with webhook
- Siri shortcuts with JavaScript actions

---

## Troubleshooting

### Browser Voice Commands Not Working

1. **Check microphone permissions**: Go to browser settings and allow microphone access
2. **Use HTTPS**: Voice recognition requires HTTPS (works automatically on Vercel)
3. **Try different browser**: Chrome/Edge have best support
4. **Check browser console**: Look for error messages

### Alexa Not Responding

1. **Check routine configuration**: Verify URL and method are correct
2. **Test API directly**: Use Postman or curl to test the endpoint
3. **Check Vercel logs**: See if requests are reaching your API
4. **Verify authentication**: Some APIs may require authentication

### Siri Shortcuts Not Working

1. **Test shortcut manually**: Run it from Shortcuts app first
2. **Check URL format**: Ensure it's correct and accessible
3. **Verify JSON format**: Make sure request body is valid JSON
4. **Check permissions**: Shortcuts may need network access permission

---

## Security Considerations

⚠️ **Important Security Notes:**

1. **API Keys**: If you add authentication, store keys securely
2. **HTTPS Only**: Always use HTTPS for API calls
3. **Rate Limiting**: Consider rate limiting for public APIs
4. **Input Validation**: The API should validate all inputs
5. **CORS**: Ensure CORS is properly configured for your domain

---

## Advanced: Custom Voice Commands

You can extend the browser voice recognition by modifying `processVoiceCommand()` in `script.js`:

```javascript
function processVoiceCommand(transcript) {
  // Add your custom commands here
  if (transcript.includes("your custom command")) {
    // Do something
    return;
  }
  // ... existing commands
}
```

---

## Need Help?

- **Browser Voice**: Check browser console for errors
- **Alexa**: Review Alexa Developer Console logs
- **Siri**: Check Shortcuts app for error messages
- **API**: Check Vercel function logs

