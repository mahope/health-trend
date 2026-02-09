@echo off
setlocal
for /f "tokens=5" %%p in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
  echo Killing PID %%p on port 3000
  taskkill /PID %%p /F
)
endlocal
