import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface AuthUser {
  id: number | string;
  email: string;
  role?: string;
  workspace_id?: number | string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone_number?: string | null;
  staff_name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  staffName?: string | null;
}

const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_OTP = '123456';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private readonly storageKey = 'wedflow_auth';
  private pendingSession: Promise<void> | null = null;
  private useSessionStorage = false;

  constructor() {
    if (!this.isLocalStorageAvailable()) {
      this.useSessionStorage = true;
    }
  }

  private getStorage(): Storage {
    return this.useSessionStorage ? sessionStorage : localStorage;
  }

  setSession(token: string, user: AuthUser): void {
    try {
      this.getStorage().setItem(this.storageKey, JSON.stringify({ token, user }));
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  getSession(): { token: string; user: AuthUser } | null {
    try {
      const raw = this.getStorage().getItem(this.storageKey);
      if (!raw) return null;
      return JSON.parse(raw) as { token: string; user: AuthUser };
    } catch {
      this.clearSession();
      return null;
    }
  }

  getToken(): string | null {
    return this.getSession()?.token ?? null;
  }

  getUser(): AuthUser | null {
    return this.getSession()?.user ?? null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  clearSession(): void {
    try {
      this.getStorage().removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }

  // Signs in silently with the fixed credentials to obtain a real backend token,
  // so the app loads data without asking the user to log in.
  ensureSession(): Promise<void> {
    if (this.getToken()) {
      return Promise.resolve();
    }

    if (this.pendingSession) {
      return this.pendingSession;
    }

    this.pendingSession = (async () => {
      try {
        const response = await fetch(`${environment.apiUrl}/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: ADMIN_EMAIL, otp: ADMIN_OTP }),
        });

        if (!response.ok) {
          console.warn('Auto sign-in failed with status', response.status);
          return;
        }

        const data = await response.json();
        if (data?.token && data?.user) {
          this.setSession(data.token, data.user);
        }
      } catch (error) {
        console.warn('Auto sign-in request failed:', error);
      } finally {
        this.pendingSession = null;
      }
    })();

    return this.pendingSession;
  }

  isLocalStorageAvailable(): boolean {
    try {
      const testKey = '__localStorage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }
}
