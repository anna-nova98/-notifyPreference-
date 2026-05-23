#!/bin/bash

echo "=== Notification Preferences Service API Demo ==="
echo "Make sure the service is running on http://localhost:3000"
echo

BASE_URL="http://localhost:3000/api/v1"
USER_ID="demo-user-$(date +%s)"

echo "1. Health check:"
curl -s "$BASE_URL/health" | jq .
echo

echo "2. Get default preferences for new user ($USER_ID):"
curl -s "$BASE_URL/users/$USER_ID/preferences" | jq .
echo

echo "3. Disable marketing emails:"
curl -s -X POST "$BASE_URL/users/$USER_ID/preferences" \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": [{
      "notificationType": "marketing_email",
      "channel": "email",
      "enabled": false
    }]
  }' | jq .
echo

echo "4. Set quiet hours (22:00-08:00 Moscow time):"
curl -s -X POST "$BASE_URL/users/$USER_ID/preferences" \
  -H "Content-Type: application/json" \
  -d '{
    "quietHours": {
      "enabled": true,
      "timezone": "Europe/Moscow",
      "startHour": 22,
      "endHour": 8,
      "applyToNotificationTypes": ["marketing_push", "marketing_email"]
    }
  }' | jq .
echo

echo "5. Check if transactional email is allowed (should be allowed):"
curl -s -X POST "$BASE_URL/evaluate" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'"$USER_ID"'",
    "notificationType": "transactional_email",
    "channel": "email",
    "region": "US",
    "datetime": "2026-05-21T14:30:00Z"
  }' | jq .
echo

echo "6. Check if marketing push is allowed during quiet hours (should be denied):"
curl -s -X POST "$BASE_URL/evaluate" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'"$USER_ID"'",
    "notificationType": "marketing_push",
    "channel": "push",
    "region": "US",
    "datetime": "2026-05-21T20:30:00Z"
  }' | jq .
echo

echo "7. Create global policy (prohibit marketing SMS in EU):"
curl -s -X POST "$BASE_URL/policies" \
  -H "Content-Type: application/json" \
  -d '{
    "notificationType": "marketing_sms",
    "channel": "sms",
    "region": "EU",
    "enabled": false,
    "description": "GDPR compliance - marketing SMS prohibited in EU"
  }' | jq .
echo

echo "8. Check if marketing SMS is allowed in EU (should be denied by global policy):"
curl -s -X POST "$BASE_URL/evaluate" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'"$USER_ID"'",
    "notificationType": "marketing_sms",
    "channel": "sms",
    "region": "EU",
    "datetime": "2026-05-21T14:30:00Z"
  }' | jq .
echo

echo "9. Get all global policies:"
curl -s "$BASE_URL/policies" | jq .
echo

echo "=== Demo completed ==="
echo "User ID: $USER_ID"
echo "API Base URL: $BASE_URL"