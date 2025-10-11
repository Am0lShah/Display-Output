# PiBoard Digital Signage Display

A modern, real-time digital signage webapp for Raspberry Pi displays. This webapp pairs with the PiBoard mobile app to display dynamic content with instant updates.

## 🚀 Features

- **Real-time Content Updates**: Instant synchronization with mobile app
- **Beautiful Default Screen**: Professional "PiBoard Innovators" branding
- **Multi-media Support**: Text, images, and video content
- **Responsive Design**: Optimized for various screen sizes
- **Offline Support**: Cached content for network interruptions
- **Kiosk Mode**: Full-screen display with disabled interactions

## 🛠 Technology Stack

- **Frontend**: React 18 with TypeScript
- **Real-time**: Supabase Real-time subscriptions
- **Database**: Supabase PostgreSQL
- **Styling**: CSS3 with animations
- **Deployment**: Netlify

## 📱 Mobile App Integration

This webapp works in conjunction with the PiBoard mobile app:
- **Device Pairing**: Secure pairing via device codes
- **Content Management**: Send/delete content from mobile app
- **Real-time Sync**: Changes appear instantly on display

## 🔧 Setup & Installation

### Prerequisites
- Node.js 18 or higher
- Supabase account and project

### Environment Variables
Create a `.env` file with:
```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation
```bash
npm install
npm start
```

### Build for Production
```bash
npm run build
```

## 🌐 Deployment

### Netlify Deployment
1. Connect this repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `build`
4. Add environment variables in Netlify dashboard

### Environment Variables for Netlify
- `REACT_APP_SUPABASE_URL`: Your Supabase project URL
- `REACT_APP_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## 🎯 Usage

### Device Pairing
1. Open the webapp on your display device
2. Note the device code shown on screen
3. Open PiBoard mobile app
4. Go to "Manage Devices" and enter the device code
5. Device will be paired and ready for content

### Content Display
- **Default State**: Shows "Welcome to PiBoard Innovators" screen
- **With Content**: Cycles through sent content automatically
- **Real-time Updates**: New content appears within 1-3 seconds

## 🔄 Real-time Features

- **Instant Updates**: Content changes appear immediately
- **Fallback Polling**: 30-second backup polling for reliability
- **Auto-reconnection**: Handles network interruptions gracefully
- **Cache Management**: Smart caching for offline scenarios

## 🎨 Customization

### Branding
- Update default content in `src/services/contentService.ts`
- Modify styling in `src/App.css`
- Change colors and themes in component styles

### Display Settings
- Adjust content duration in mobile app
- Modify transition animations in CSS
- Configure kiosk mode settings

## 🐛 Troubleshooting

### Real-time Updates Not Working
1. Check browser console for subscription logs
2. Verify Supabase real-time is enabled
3. Check network connectivity
4. Fallback polling will work as backup

### Content Not Displaying
1. Verify device is paired correctly
2. Check content was sent from mobile app
3. Refresh page to force content reload
4. Check browser console for errors

## 📊 Performance

- **Load Time**: < 2 seconds on modern devices
- **Real-time Latency**: 1-3 seconds for content updates
- **Memory Usage**: Optimized for 24/7 operation
- **Network Efficiency**: Minimal bandwidth usage

## 🔒 Security

- **RLS Policies**: Row-level security in Supabase
- **CORS Protection**: Configured for secure origins
- **Content Validation**: Input sanitization and validation
- **Secure Headers**: Security headers via Netlify

## 📈 Monitoring

- **Console Logging**: Detailed logs for debugging
- **Error Handling**: Graceful error recovery
- **Performance Metrics**: Built-in performance tracking
- **Health Checks**: Automatic connection monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the troubleshooting section
- Review console logs for errors
- Contact the development team

---

**PiBoard Digital Signage** - Transforming communication through innovative display technology 🚀