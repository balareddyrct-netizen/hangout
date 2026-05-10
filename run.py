import subprocess
import sys
import os
import time

def start_backend():
    print("Starting FastAPI backend...")
    # Seed data if DB doesn't exist
    if not os.path.exists("hangout.db"):
        print("Database not found. Seeding initial data...")
        from backend.seed_data import seed_db
        seed_db()
        
    return subprocess.Popen([sys.executable, "-m", "uvicorn", "backend.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"])

def start_frontend():
    print("Starting Vite frontend...")
    # Change to frontend directory
    os.chdir("frontend")
    
    # Check if node_modules exists, if not run npm install
    if not os.path.exists("node_modules"):
        print("Installing frontend dependencies...")
        subprocess.run(["npm", "install"], shell=True)
        
    return subprocess.Popen(["npm", "run", "dev"], shell=True)

if __name__ == "__main__":
    try:
        backend_process = start_backend()
        time.sleep(2) # Wait for backend to start
        frontend_process = start_frontend()
        
        print("\n\n" + "="*50)
        print("🚀 Hangout App is running!")
        print("🌐 Frontend: http://localhost:5173")
        print("⚙️  Backend:  http://localhost:8000")
        print("="*50 + "\n\n")
        
        backend_process.wait()
        frontend_process.wait()
    except KeyboardInterrupt:
        print("\nShutting down...")
        backend_process.terminate()
        frontend_process.terminate()
        sys.exit(0)
