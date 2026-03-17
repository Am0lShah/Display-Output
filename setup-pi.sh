#!/bin/bash
# =============================================
# PiBoard Display - Raspberry Pi Setup Script
# =============================================
# Run this once on your Raspberry Pi to install
# all dependencies and start the display.
# 
# Usage:
#   chmod +x setup-pi.sh
#   ./setup-pi.sh
# =============================================

set -e

echo ""
echo "============================================="
echo "  PiBoard Display Setup for Raspberry Pi"
echo "============================================="
echo ""

# Get the directory this script lives in
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR="$SCRIPT_DIR/build"
SERVER_DIR="$SCRIPT_DIR/server"

# ── Step 1: Check for Node.js ─────────────────
echo "Step 1/6: Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "Node.js not found. Installing Node.js 18 (LTS)..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo "Node.js installed: $(node --version)"
else
    echo "Node.js already installed: $(node --version)"
fi

# ── Step 2: Install 'serve' globally ──────────
echo ""
echo "Step 2/6: Installing 'serve' for React static hosting..."
if ! command -v serve &> /dev/null; then
    sudo npm install -g serve
    echo "'serve' installed."
else
    echo "'serve' already installed."
fi

# ── Step 3: Install server dependencies ───────
echo ""
echo "Step 3/6: Installing offline server dependencies..."
cd "$SERVER_DIR"
npm install
echo "Server dependencies installed."

# ── Step 4: Kill any existing processes ───────
echo ""
echo "Step 4/6: Stopping any existing PiBoard processes..."
pkill -f "node server.js" 2>/dev/null || true
pkill -f "serve -s build" 2>/dev/null || true
sleep 1

# ── Step 5: Start the offline Node server ─────
echo ""
echo "Step 5/6: Starting Offline Content Server on port 3001..."
cd "$SERVER_DIR"
nohup node server.js > /tmp/piboard-server.log 2>&1 &
SERVER_PID=$!
echo "Offline server started (PID: $SERVER_PID)"
sleep 2

# Verify the server started
if kill -0 $SERVER_PID 2>/dev/null; then
    echo "Server is running OK."
else
    echo "ERROR: Server failed to start. Check /tmp/piboard-server.log"
    cat /tmp/piboard-server.log
    exit 1
fi

# ── Step 6: Start the React display app ───────
echo ""
echo "Step 6/6: Starting React Display App on port 3000..."
cd "$SCRIPT_DIR"
nohup serve -s build -l 3000 > /tmp/piboard-display.log 2>&1 &
DISPLAY_PID=$!
echo "Display app started (PID: $DISPLAY_PID)"
sleep 2

# ── Open Firefox ──────────────────────────────
echo ""
echo "Opening Firefox at http://localhost:3000 ..."
# Try different methods to open browser
if command -v firefox-esr &> /dev/null; then
    firefox-esr http://localhost:3000 &
elif command -v firefox &> /dev/null; then
    firefox http://localhost:3000 &
elif command -v chromium-browser &> /dev/null; then
    chromium-browser --kiosk http://localhost:3000 &
else
    echo "Could not find Firefox. Please open manually: http://localhost:3000"
fi

echo ""
echo "============================================="
echo "  PiBoard Display is Running!"
echo "============================================="
echo ""
echo "  React Display : http://localhost:3000"
echo "  Offline Server: http://localhost:3001"
echo "  Server logs   : /tmp/piboard-server.log"
echo "  Display logs  : /tmp/piboard-display.log"
echo ""
echo "  Pi IP on PiBoardHotspot: 10.87.134.21"
echo "  (Phone should connect to PiBoardHotspot WiFi)"
echo "  (Then use IP 10.87.134.21 in the app)"
echo ""
echo "  To stop all services:"
echo "    pkill -f 'node server.js'"
echo "    pkill -f 'serve -s build'"
echo "============================================="
