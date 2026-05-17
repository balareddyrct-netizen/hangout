import random
import string
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from backend.database import OTPCode
from backend.config import settings


def generate_otp_code() -> str:
    """Generate a random 6-digit OTP code."""
    return ''.join(random.choices(string.digits, k=6))


def send_otp_email(email: str, code: str) -> bool:
    """Send OTP via email. Falls back to console logging if SMTP is not configured."""
    
    subject = "Hangout - Verify Your Email"
    html_body = f"""
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="font-family: 'Playfair Display', Georgia, serif; color: #1A1A1A; font-size: 28px; margin: 0;">Hangout</h1>
            <p style="color: #6B7280; margin-top: 8px;">Verify your email address</p>
        </div>
        <div style="background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 16px; padding: 32px; text-align: center;">
            <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">Your verification code is:</p>
            <div style="background: #F3F4F6; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #8B5CF6;">{code}</span>
            </div>
            <p style="color: #9CA3AF; font-size: 13px;">This code expires in 5 minutes. Do not share it with anyone.</p>
        </div>
        <p style="text-align: center; color: #D1D5DB; font-size: 12px; margin-top: 24px;">© Hangout App</p>
    </div>
    """
    
    if settings.SMTP_EMAIL and settings.SMTP_PASSWORD:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = settings.SMTP_EMAIL
            msg["To"] = email
            msg.attach(MIMEText(html_body, "html"))
            
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_EMAIL, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_EMAIL, email, msg.as_string())
            
            print(f"[OTP] Email sent to {email}")
            return True
        except Exception as e:
            print(f"[OTP] SMTP failed: {e}. Falling back to console.")
    
    # Fallback: print to console
    print(f"\n{'='*50}")
    print(f"  OTP for {email}: {code}")
    print(f"  (Expires in 5 minutes)")
    print(f"{'='*50}\n")
    return True


def create_and_send_otp(email: str, db: Session) -> str:
    """Generate, store, and send an OTP for the given email."""
    code = generate_otp_code()
    
    # Invalidate any previous OTP for this email
    db.query(OTPCode).filter(OTPCode.email == email, OTPCode.verified == False).delete()
    
    # Create new OTP
    otp = OTPCode(
        email=email,
        code=code,
        expires_at=datetime.utcnow() + timedelta(minutes=5)
    )
    db.add(otp)
    db.commit()
    
    # Send it
    send_otp_email(email, code)
    
    return code


def verify_otp(email: str, code: str, db: Session) -> bool:
    """Verify the OTP code for the given email."""
    otp = db.query(OTPCode).filter(
        OTPCode.email == email,
        OTPCode.code == code,
        OTPCode.verified == False,
        OTPCode.expires_at > datetime.utcnow()
    ).first()
    
    if not otp:
        return False
    
    otp.verified = True
    db.commit()
    return True
