import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verify-otp.html',
  styleUrl: './verify-otp.scss'
})
export class VerifyOtp {
  otp = signal('');
  firstName = signal('');
  lastName = signal('');
  phoneNumber = signal('');
  isSubmitting = signal(false);
  errorMessage = signal('');

  constructor(private router: Router, private location: Location, private auth: Auth) {
    const storedEmail = this.getStorage().getItem('otp_email');
    console.log('Stored email found:', storedEmail);
    if (!storedEmail) {
      console.log('No stored email, redirecting to login');
      this.router.navigate(['/login']);
    }
  }

  private getStorage(): Storage {
    // Use the same storage logic as auth service
    try {
      localStorage.setItem('__test__', 'test');
      localStorage.removeItem('__test__');
      return localStorage;
    } catch (error) {
      console.warn('localStorage not available, using sessionStorage');
      return sessionStorage;
    }
  }

  goBack(): void {
    this.location.back();
  }

  async onVerifyOtp(): Promise<void> {
    const email = this.getStorage().getItem('otp_email');
    console.log('Retrieved email for OTP verification:', email);

    if (!email) {
      this.errorMessage.set('Email not found. Please start over.');
      this.router.navigate(['/login']);
      return;
    }

    if (!this.otp() || this.otp().length !== 6) {
      this.errorMessage.set('Please enter a valid 6-digit OTP');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    try {
      console.log('Sending OTP verification request for email:', email, 'OTP:', this.otp());
      const response = await fetch('https://wedflow-codeflare.onrender.com/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp: this.otp(),
          firstName: this.firstName() || undefined,
          lastName: this.lastName() || undefined,
          phoneNumber: this.phoneNumber() || undefined,
        }),
      });

      const data = await response.json();
      console.log('OTP verification response:', data);

      if (!response.ok) {
        throw new Error(data?.error || 'Invalid OTP');
      }

      this.auth.setSession(data.token, data.user);
      this.getStorage().removeItem('otp_email');
      this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('Error verifying OTP:', error);
      this.errorMessage.set(error instanceof Error ? error.message : 'Network error. Please try again.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async onResendOtp(): Promise<void> {
    const email = this.getStorage().getItem('otp_email');

    if (!email) {
      this.errorMessage.set('Email not found. Please start over.');
      this.router.navigate(['/login']);
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    try {
      const response = await fetch('https://wedflow-codeflare.onrender.com/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, turnstileToken: 'resend' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to resend OTP');
      }

      if (data?.devOtp) {
        alert(`Development mode: your new OTP is ${data.devOtp}`);
      } else {
        alert('New OTP sent successfully!');
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      this.errorMessage.set(error instanceof Error ? error.message : 'Network error. Please try again.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
