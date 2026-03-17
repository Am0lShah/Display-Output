#!/bin/bash
# =============================================
# PiBoard Display - Boot Autostart Setup
# =============================================
# Run this ONCE to set up automatic start on boot.
# After this, PiBoard will start automatically
# every time the Raspberry Pi boots.
#
# Usage:
#   chmod +x autostart.sh
#   ./autostart.sh
# =============================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
AUTOSTART_DIR="$HOME/.config/autostart"
DESKTOP_FILE="$AUTOSTART_DIR/piboard.desktop"

mkdir -p "$AUTOSTART_DIR"

cat > "$DESKTOP_FILE" << EOF
[Desktop Entry]
Type=Application
Name=PiBoard Display
Comment=Start PiBoard Digital Signage on boot
Exec=bash $SCRIPT_DIR/setup-pi.sh
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
EOF

echo "Autostart configured at: $DESKTOP_FILE"
echo "PiBoard will now start automatically on every boot."
echo ""
echo "To disable autostart, run:"
echo "  rm $DESKTOP_FILE"
