import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Package {
  id: string;
  name: string;
  duration_days: number;
  status: string;
  price: number;
  description: string | null;
  reminder_day: number | null;
  reminder_email_days: number;
  deliverables?: string[];
  created_at: string;
  updated_at: string;
}

export interface CreatePackageRequest {
  name: string;
  durationDays: number;
  price: number;
  description?: string;
  status?: string;
  reminderDay?: number;
  reminderEmailDays?: number;
  deliverables?: string[];
}

export interface UpdatePackageRequest {
  name?: string;
  durationDays?: number;
  price?: number;
  description?: string;
  status?: string;
  reminderDay?: number;
  reminderEmailDays?: number;
  deliverables?: string[];
}

export interface PackageListResponse {
  success: boolean;
  packages: Package[];
  count: number;
}

export interface PackageResponse {
  success: boolean;
  package: Package;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class PackageService {
  private apiUrl = 'https://wedflow-codeflare.onrender.com/api/packages';

  constructor(private http: HttpClient) {}

  getPackages(): Observable<PackageListResponse> {
    return this.http.get<PackageListResponse>(this.apiUrl);
  }

  getPackageById(id: string): Observable<PackageResponse> {
    return this.http.get<PackageResponse>(`${this.apiUrl}/${id}`);
  }

  createPackage(pkg: CreatePackageRequest): Observable<PackageResponse> {
    return this.http.post<PackageResponse>(this.apiUrl, pkg);
  }

  updatePackage(id: string, pkg: UpdatePackageRequest): Observable<PackageResponse> {
    return this.http.put<PackageResponse>(`${this.apiUrl}/${id}`, pkg);
  }

  deletePackage(id: string): Observable<DeleteResponse> {
    return this.http.delete<DeleteResponse>(`${this.apiUrl}/${id}`);
  }
}