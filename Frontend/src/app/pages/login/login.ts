import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

type LoginStep = 'email' | 'otp';

const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_OTP = '123456';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  step = signal<LoginStep>('email');

  email = signal('');
  isSubmitting = signal(false);

  otp = signal('');
  isVerifying = signal(false);

  errorMessage = signal('');

  toastVisible = signal(false);
  toastTitle = signal('');
  toastMessage = signal('');
  private toastTimeout: any;

  constructor(private router: Router, private location: Location) {}

  goBack(): void {
    this.location.back();
  }

  closeLogin(): void {
    this.router.navigate(['/']);
  }

  private showToast(title: string, message: string): void {
    this.toastTitle.set(title);
    this.toastMessage.set(message);
    this.toastVisible.set(true);
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toastVisible.set(false);
    }, 4000);
  }

  onSendOtp(): void {
    this.errorMessage.set('');
    const email = this.email().trim().toLowerCase();

    if (!email) {
      this.errorMessage.set('Please enter your email.');
      return;
    }

    if (email !== ADMIN_EMAIL) {
      this.errorMessage.set('Only admin@gmail.com is allowed to sign in.');
      return;
    }

    this.isSubmitting.set(true);

    setTimeout(() => {
      this.isSubmitting.set(false);
      this.step.set('otp');
      this.showToast('OTP sent', 'Enter the 6-digit code to continue.');
    }, 300);
  }

  onVerifyOtp(): void {
    this.errorMessage.set('');

    if (!this.otp() || this.otp().length !== 6) {
      this.errorMessage.set('Please enter a valid 6-digit OTP.');
      return;
    }

    if (this.otp() !== ADMIN_OTP) {
      this.errorMessage.set('Invalid OTP. Please try again.');
      return;
    }

    this.router.navigate(['/dashboard']);
  }

  onUseAnotherEmail(): void {
    this.step.set('email');
    this.otp.set('');
    this.errorMessage.set('');
  }

  maskedEmail(): string {
    const value = this.email();
    const atIndex = value.indexOf('@');
    if (atIndex <= 1) return value;

    const visible = value.slice(0, Math.min(3, atIndex));
    const domain = value.slice(atIndex);
    return `${visible}${'*'.repeat(Math.max(atIndex - visible.length, 0))}${domain}`;
  }
}
