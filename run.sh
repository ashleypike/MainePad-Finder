#!/bin/bash
# run.sh - start frontend and backend

cd mainepadfinder-app

# Start Flask backend
echo "Starting backend (Flask)..."
cd ./backend
source venv/scripts/activate
python3 app.py & # Runs in background
cd ..

echo "Backend started on http://localhost:5000"


# Start React frontend
echo "Starting frontend (Vite)..."
cd ./frontend
npm run dev & # Runs in background
cd ..

echo "Frontend started on https://localhost:5173"

# Wait for both processes to finish
wait