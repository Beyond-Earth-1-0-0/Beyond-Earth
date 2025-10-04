from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware
import re, smtplib, ssl, random, string, time, os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

app = FastAPI()

# ======== CORS ========
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ======== OTP STORAGE ========
OTP_FILE = "../otps.txt"

def load_otps() -> dict:
    if not os.path.exists(OTP_FILE):
        return {}
    otps = {}
    with open(OTP_FILE, "r") as f:
        for line in f:
            parts = line.strip().split(",")
            if len(parts) == 2:
                otp, expiry = parts
                otps[otp] = float(expiry)
    return otps

def save_otps(otps: dict):
    with open(OTP_FILE, "w") as f:
        for otp, expiry in otps.items():
            f.write(f"{otp},{expiry}\n")

def cleanup_otps() -> dict:
    otps = load_otps()
    now = time.time()
    valid_otps = {otp: expiry for otp, expiry in otps.items() if expiry > now}
    save_otps(valid_otps)
    return valid_otps

# ======== VALIDATION & OTP GENERATION ========
def validate_email(email: str) -> bool:
    pattern = r"^[0-9]{10}@cis\.asu\.edu\.eg$"
    return re.match(pattern, email) is not None

def generate_unique_otp(length: int = 6, expiry_seconds: int = 120) -> tuple[str, float]:
    otps = cleanup_otps()
    while True:
        otp = ''.join(random.choices(string.digits, k=length))
        if otp not in otps:
            expiry_time = time.time() + expiry_seconds
            otps[otp] = expiry_time
            save_otps(otps)
            return otp, expiry_time

# ======== SEND EMAIL ========
def send_otp_email(receiver_email: str, otp: str, sender_email: str, sender_password: str):
    message = MIMEMultipart("alternative")
    message["Subject"] = "Your OTP Code"
    message["From"] = sender_email
    message["To"] = receiver_email

    text = f"Your OTP code is: {otp}\nThis code will expire in 2 minutes."
    html = f"<p>Your OTP code is: <b>{otp}</b><br><i>This code will expire in 2 minutes.</i></p>"

    message.attach(MIMEText(text, "plain"))
    message.attach(MIMEText(html, "html"))

    context = ssl.create_default_context()
    with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, receiver_email, message.as_string())

# ======== VERIFY OTP ========
def verify_otp(user_input: str) -> bool:
    otps = cleanup_otps()
    if user_input in otps:
        del otps[user_input]
        save_otps(otps)
        return True
    return False

# ======== FASTAPI ENDPOINTS ========
@app.post("/send-otp")
def send_otp_endpoint(email: str = Form(...)):
    # Replace with your actual Gmail and App Password
    sender_email = "beyondearthteam1@gmail.com"
    sender_password = "ybkn qrcj zjgn svcf"  # Get this from Google Account settings
    
    if not validate_email(email):
        return {"success": False, "message": "Invalid email format. Must be: 10digits@cis.asu.edu.eg"}

    otp, _ = generate_unique_otp()
    try:
        send_otp_email(email, otp, sender_email, sender_password)
        return {"success": True, "message": f"OTP sent to {email}"}
    except Exception as e:
        return {"success": False, "message": f"Failed to send OTP: {str(e)}"}

@app.post("/verify-otp")
def verify_otp_endpoint(otp: str = Form(...)):
    if verify_otp(otp):
        return {"success": True, "message": "OTP verified successfully"}
    return {"success": False, "message": "Invalid or expired OTP"}