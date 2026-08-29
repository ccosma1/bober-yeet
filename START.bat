@echo off
cd /d "%~dp0"
echo Play online:  https://ccosma1.github.io/bober-yeet/
echo Local board:  http://127.0.0.1:8765/
start "" "http://127.0.0.1:8765/"
python server.py
if errorlevel 1 (
  echo Python is needed for the local shared scoreboard.
  echo Opening the online game instead...
  start "" "https://ccosma1.github.io/bober-yeet/"
  pause
)
