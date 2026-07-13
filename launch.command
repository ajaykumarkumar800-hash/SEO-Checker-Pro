#!/bin/bash

# Change directory to the folder where this script is located
cd "$(dirname "$0")"

clear
echo "=========================================================="
echo "          SEO CHECKER PRO — LOCAL SERVICE SYSTEM          "
echo "=========================================================="
echo ""
echo "1. Checking & Installing Python Dependencies..."
pip3 install -r requirements.txt

echo ""
echo "2. Launching Local Web Server..."
# Wait 1.5 seconds for the server to start, then open Chrome/Safari automatically
(sleep 1.5 && open "http://127.0.0.1:5000") &

echo "3. Server started! Press CTRL+C in this terminal window to stop."
echo ""
python3 app.py
