import { Injectable } from '@angular/core';

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

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private readonly storageKey = 'wedflow_auth';
  private useSessionStorage = false;

  constructor() {
    // Check if localStorage is available, fallback to sessionStorage
    if (!this.isLocalStorageAvailable()) {
      console.warn('localStorage not available, using sessionStorage as fallback');
      this.useSessionStorage = true;
    }
  }

  private getStorage(): Storage {
    return this.useSessionStorage ? sessionStorage : localStorage;
  }

  setSession(token: string, user: AuthUser): void {
    try {
      this.getStorage().setItem(this.storageKey, JSON.stringify({ token, user }));
      console.log('Session saved successfully to', this.useSessionStorage ? 'sessionStorage' : 'localStorage');
    } catch (error) {
      console.error('Failed to save session to storage:', error);
      console.warn('This might be due to private mode or storage being disabled');
    }
  }

  getSession(): { token: string; user: AuthUser } | null {
    try {
      const raw = this.getStorage().getItem(this.storageKey);
      if (!raw) {
        console.log('No session found in storage');
        return null;
      }

      const session = JSON.parse(raw) as { token: string; user: AuthUser };
      console.log('Session retrieved successfully from', this.useSessionStorage ? 'sessionStorage' : 'localStorage');
      return session;
    } catch (error) {
      console.error('Failed to retrieve session from storage:', error);
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
    const session = this.getSession();
    if (!session?.token) {
      return false;
    }

    try {
      const payload = JSON.parse(atob(session.token.split('.')[1] || ''));
      return typeof payload?.exp === 'number' ? payload.exp * 1000 > Date.now() : true;
    } catch {
      this.clearSession();
      return false;
    }
  }

  clearSession(): void {
    try {
      this.getStorage().removeItem(this.storageKey);
      console.log('Session cleared successfully from', this.useSessionStorage ? 'sessionStorage' : 'localStorage');
    } catch (error) {
      console.error('Failed to clear session from storage:', error);
    }
  }

  isLocalStorageAvailable(): boolean {
    try {
      const testKey = '__localStorage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      console.error('localStorage is not available:', error);
      return false;
    }
  }
}
