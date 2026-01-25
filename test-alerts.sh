#!/bin/bash

# Test Alerts Script - Send dummy alerts to the webhook endpoint
# Usage: ./test-alerts.sh

SERVER_URL="http://localhost:3000"

echo "🚀 Generating dummy alerts..."
echo ""

# Array of dummy alerts with US and India stocks
alerts=(
    '{"ticker": "AAPL", "message": "Price broke above 200 support level"}'
    '{"ticker": "GOOGL", "message": "Golden cross detected on daily chart"}'
    '{"ticker": "MSFT", "message": "Strong bullish momentum building"}'
    '{"ticker": "TSLA", "message": "RSI oversold, potential reversal"}'
    '{"ticker": "NFLX", "message": "Breakout above resistance zone"}'
    '{"ticker": "TCS", "message": "Strong buy signal triggered"}'
    '{"ticker": "INFY", "message": "Support level holding strong"}'
    '{"ticker": "RELIANCE", "message": "Bullish engulfing pattern formed"}'
    '{"ticker": "WIPRO", "message": "Moving average crossover confirmed"}'
    '{"ticker": "HCL-TECH", "message": "Volume surge detected"}'
    '{"ticker": "BAJAJFINSV", "message": "Momentum reversal signal"}'
    '{"ticker": "MARUTI", "message": "Breakout from consolidation"}'
)

# Send each alert
count=0
for alert in "${alerts[@]}"; do
    count=$((count + 1))
    echo "📤 Sending alert $count/12..."

    response=$(curl -s -X POST "$SERVER_URL/webhook" \
        -H "Content-Type: application/json" \
        -d "$alert")

    # Check if response contains success
    if echo "$response" | grep -q '"success":true'; then
        stock=$(echo "$alert" | grep -o '"ticker": "[^"]*' | cut -d'"' -f4)
        echo "   ✅ Alert for $stock created successfully"
    else
        echo "   ❌ Failed to create alert"
    fi

    # Small delay between requests
    sleep 0.5
done

echo ""
echo "✨ All alerts sent! Navigate to $SERVER_URL and click the Alerts button to view them."
echo ""
