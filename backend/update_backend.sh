#!/bin/bash
echo "Starting Backend Update..."
cd /www/wwwroot/fwq/backend

echo "Pulling latest code..."
git pull

echo "Finding running uvicorn process..."
PID=$(ps aux | grep 'uvicorn' | grep -v 'grep' | awk '{print $2}')

if [ -n "$PID" ]; then
    echo "Killing old process $PID..."
    kill -9 $PID
else
    echo "No running uvicorn process found."
fi

echo "Starting new process..."
nohup /www/wwwroot/fwq/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 > uvicorn.log 2>&1 &

echo "Backend restarted successfully! Logs are being written to uvicorn.log"
