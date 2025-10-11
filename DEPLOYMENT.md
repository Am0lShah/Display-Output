# 🚀 Deployment Guide - Pi Board Display

## 📋 Pre-deployment Checklist

✅ **Build Status**: Compiled successfully with no errors  
✅ **Dependencies**: All packages installed correctly  
✅ **Environment**: Supabase configuration ready  
✅ **Error Handling**: ErrorBoundary implemented  
✅ **TypeScript**: All type errors resolved  

## 🌐 Deploy to Netlify (Recommended)

### Method 1: Drag & Drop (Easiest)

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Go to Netlify**:
   - Visit [netlify.com](https://netlify.com)
   - Sign up/Login with GitHub, GitLab, or email

3. **Deploy**:
   - Drag the `build` folder to Netlify deploy area
   - Wait for deployment to complete
   - Get your URL: `https://your-app-name.netlify.app`

### Method 2: Git Integration (Recommended for updates)

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial Pi Board Display"
   git branch -M main
   git remote add origin https://github.com/yourusername/pi-board-display.git
   git push -u origin main
   ```

2. **Connect to Netlify**:
   - Go to Netlify Dashboard
   - Click "New site from Git"
   - Choose GitHub and select your repository
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `build`
   - Deploy site

3. **Environment Variables** (if needed):
   - Go to Site settings → Environment variables
   - Add your Supabase credentials:
     ```
     REACT_APP_SUPABASE_URL=your_supabase_url
     REACT_APP_SUPABASE_ANON_KEY=your_supabase_key
     ```

## 🔧 Alternative Hosting Options

### Vercel
```bash
npm install -g vercel
vercel --prod
```

### GitHub Pages
```bash
npm install --save-dev gh-pages
# Add to package.json: "homepage": "https://yourusername.github.io/pi-board-display"
npm run build
npx gh-pages -d build
```

### Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

## 🥧 Raspberry Pi Configuration

### 1. Update Raspberry Pi OS
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Chromium
```bash
sudo apt install chromium-browser unclutter xdotool -y
```

### 3. Create Startup Script
```bash
nano ~/start_display.sh
```

**Content:**
```bash
#!/bin/bash

# Wait for network connection
echo "Waiting for network..."
while ! ping -c 1 google.com &> /dev/null; do
    sleep 5
done

echo "Network connected, starting display..."

# Hide cursor
unclutter -idle 0.5 -root &

# Disable screen blanking
xset s off
xset -dpms
xset s noblank

# Start Chromium in kiosk mode
chromium-browser \
  --kiosk \
  --no-sandbox \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --disable-restore-session-state \
  --disable-web-security \
  --disable-features=TranslateUI \
  --disable-ipc-flooding-protection \
  --start-fullscreen \
  --no-first-run \
  --fast \
  --fast-start \
  --disable-default-apps \
  --disable-translate \
  --disable-background-timer-throttling \
  --disable-renderer-backgrounding \
  --disable-backgrounding-occluded-windows \
  --disable-background-networking \
  https://YOUR-NETLIFY-URL.netlify.app

# If Chromium crashes, restart it
while true; do
    sleep 10
    if ! pgrep chromium > /dev/null; then
        echo "Chromium crashed, restarting..."
        chromium-browser --kiosk https://YOUR-NETLIFY-URL.netlify.app &
    fi
done
```

**Make executable:**
```bash
chmod +x ~/start_display.sh
```

### 4. Auto-start on Boot
```bash
mkdir -p ~/.config/lxsession/LXDE-pi
nano ~/.config/lxsession/LXDE-pi/autostart
```

**Content:**
```
@lxpanel --profile LXDE-pi
@pcmanfm --desktop --profile LXDE-pi
@xscreensaver -no-splash
@/home/pi/start_display.sh
```

### 5. WiFi Auto-connect
```bash
sudo nano /etc/wpa_supplicant/wpa_supplicant.conf
```

**Add your network:**
```
network={
    ssid="YourWiFiName"
    psk="YourWiFiPassword"
    priority=1
}
```

### 6. Optional: Set up Watchdog (Auto-restart if frozen)
```bash
sudo nano /etc/systemd/system/display-watchdog.service
```

**Content:**
```ini
[Unit]
Description=Pi Board Display Watchdog
After=network.target

[Service]
Type=simple
User=pi
ExecStart=/home/pi/start_display.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Enable:**
```bash
sudo systemctl enable display-watchdog.service
sudo systemctl start display-watchdog.service
```

## 🔍 Testing & Verification

### 1. Test Web App
- Open your deployed URL in a browser
- Verify QR code and device code appear
- Check responsive design on different screen sizes

### 2. Test on Raspberry Pi
- Boot up Raspberry Pi
- Verify auto-start works
- Check network connectivity
- Test pairing with mobile app

### 3. Test Mobile Integration
- Open mobile app
- Go to "Manage Devices"
- Scan QR code or enter device code
- Verify pairing works
- Send test content from "Send Notice"
- Verify content appears on Pi display

## 🛠️ Troubleshooting

### Common Issues

**Web app not loading:**
- Check Supabase configuration
- Verify build completed successfully
- Check browser console for errors

**Raspberry Pi not connecting:**
- Verify WiFi credentials
- Check internet connection: `ping google.com`
- Check Chromium logs: `journalctl -u display-watchdog`

**Pairing not working:**
- Verify database schema is set up
- Check network connectivity on both devices
- Verify Supabase real-time subscriptions

**Content not updating:**
- Check real-time subscriptions in browser dev tools
- Verify database permissions
- Check mobile app sends content correctly

### Debug Commands

**Check service status:**
```bash
sudo systemctl status display-watchdog
```

**View logs:**
```bash
journalctl -u display-watchdog -f
```

**Test network:**
```bash
ping google.com
curl -I https://your-netlify-url.netlify.app
```

**Restart display:**
```bash
sudo systemctl restart display-watchdog
```

## 📊 Performance Tips

### For Raspberry Pi:
- Use Class 10 SD card (minimum 16GB)
- Ensure good power supply (5V 3A recommended)
- Keep Pi cool with heatsinks/fan
- Use wired Ethernet if possible for stability

### For Web App:
- Images should be optimized (WebP format recommended)
- Videos should be compressed (H.264, max 1080p)
- Content should be cached for offline use

## 🔒 Security Considerations

- Change default Pi password: `passwd`
- Enable SSH key authentication
- Keep system updated: `sudo apt update && sudo apt upgrade`
- Use HTTPS for web app (Netlify provides this automatically)
- Regularly rotate device pairing codes

---

**🎉 Your Pi Board Display is now ready for deployment!**

For support, check the main README.md or review the troubleshooting section above.