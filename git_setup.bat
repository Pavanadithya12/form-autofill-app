@echo off
set GIT="C:\Program Files\Git\cmd\git.exe"
cd /d "c:\Users\pavan\OneDrive\Desktop\form autofiller app"
%GIT% init
%GIT% config user.email "formautofill@app.com"
%GIT% config user.name "Form AutoFill App"
%GIT% add .
%GIT% commit -m "Initial commit: Intelligent Form Auto-Filler v2.0 - Next.js 15 + FastAPI"
echo DONE
