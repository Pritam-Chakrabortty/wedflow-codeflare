import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Professional {
  id: string;
  initials: string;
  name: string;
  verified: boolean;
  type: 'Individual' | 'Team';
  experienceYears: number;
  city: string;
  state: string;
  skills: string[];
  summary: string;
  availableRate: number;
  email: string;
  phone: string;
}

export interface WorkRequest {
  id: string;
  project: string;
  professionalRole: string;
  professionalName: string;
  professionalEmail: string;
  professionalPhone: string;
  eventDate: string;
  venue: string;
  budget: number;
  status: 'Pending' | 'Accepted' | 'Declined' | 'Completed';
}

export interface ProfessionalsResponse {
  success: boolean;
  professionals: Professional[];
  count: number;
}

export interface WorkRequestsResponse {
  success: boolean;
  workRequests: WorkRequest[];
  count: number;
}

export interface CreateWorkRequestRequest {
  project_name: string;
  professional_role: string;
  professional_name: string;
  professional_email?: string;
  professional_phone?: string;
  event_date?: string;
  venue?: string;
  budget?: number;
  status?: string;
  notes?: string;
}

export interface UpdateWorkRequestRequest {
  project_name?: string;
  professional_role?: string;
  professional_name?: string;
  professional_email?: string;
  professional_phone?: string;
  event_date?: string;
  venue?: string;
  budget?: number;
  status?: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root',
})
export class MarketplaceService {
  private apiUrl = 'https://wedflow-codeflare.onrender.com/api';

  constructor(private http: HttpClient) {}

  getProfessionals(): Observable<ProfessionalsResponse> {
    return this.http.get<ProfessionalsResponse>(`${this.apiUrl}/freelancers`);
  }

  getWorkRequests(): Observable<WorkRequestsResponse> {
    return this.http.get<WorkRequestsResponse>(`${this.apiUrl}/marketplace-work-requests`);
  }

  createWorkRequest(request: CreateWorkRequestRequest): Observable<{ success: boolean; workRequest: WorkRequest }> {
    // Convert status to lowercase for backend compatibility
    const transformedRequest = {
      ...request,
      status: request.status ? request.status.toLowerCase() : undefined
    };
    return this.http.post<{ success: boolean; workRequest: WorkRequest }>(`${this.apiUrl}/marketplace-work-requests`, transformedRequest);
  }

  updateWorkRequest(id: string, request: UpdateWorkRequestRequest): Observable<{ success: boolean; workRequest: WorkRequest }> {
    // Convert status to lowercase for backend compatibility
    const transformedRequest = {
      ...request,
      status: request.status ? request.status.toLowerCase() : undefined
    };
    return this.http.put<{ success: boolean; workRequest: WorkRequest }>(`${this.apiUrl}/marketplace-work-requests/${id}`, transformedRequest);
  }

  deleteWorkRequest(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/marketplace-work-requests/${id}`);
  }
}
