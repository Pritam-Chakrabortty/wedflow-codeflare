import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CrewAssignment {
  id: string;
  booking_event_id: string;
  staff_id: string;
  assigned_role: string;
  assignment_date: string;
  start_time: string | null;
  end_time: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  staff_name: string;
  staff_email: string;
  staff_phone: string;
  event_name: string;
  event_date: string;
  venue: string;
  booking_number: string;
  client_name: string;
}

export interface CreateCrewAssignmentRequest {
  booking_event_id: string;
  staff_id: string;
  assigned_role: string;
  assignment_date?: string;
  start_time?: string;
  end_time?: string;
  status?: string;
  notes?: string;
}

export interface UpdateCrewAssignmentRequest {
  booking_event_id?: string;
  staff_id?: string;
  assigned_role?: string;
  assignment_date?: string;
  start_time?: string;
  end_time?: string;
  status?: string;
  notes?: string;
}

export interface CrewAssignmentListResponse {
  success: boolean;
  crewAssignments: CrewAssignment[];
  count: number;
}

export interface CrewAssignmentResponse {
  success: boolean;
  crewAssignment: CrewAssignment;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  availability: string;
  status: string;
  staff_name?: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
}

export interface StaffListResponse {
  success: boolean;
  staff: Staff[];
  count: number;
  users?: Staff[]; // Alternative response format
}

@Injectable({ providedIn: 'root' })
export class CrewAssignmentService {
  private readonly apiUrl = 'https://wedflow-codeflare.onrender.com/api/crew-assignments';
  private readonly staffApiUrl = 'https://wedflow-codeflare.onrender.com/api/staff-members';

  constructor(private http: HttpClient) {}

  getCrewAssignments(): Observable<CrewAssignmentListResponse> {
    return this.http.get<CrewAssignmentListResponse>(this.apiUrl);
  }

  getCrewAssignmentById(id: string): Observable<CrewAssignmentResponse> {
    return this.http.get<CrewAssignmentResponse>(`${this.apiUrl}/${id}`);
  }

  createCrewAssignment(assignment: CreateCrewAssignmentRequest): Observable<CrewAssignmentResponse> {
    return this.http.post<CrewAssignmentResponse>(this.apiUrl, assignment);
  }

  updateCrewAssignment(id: string, assignment: UpdateCrewAssignmentRequest): Observable<CrewAssignmentResponse> {
    return this.http.put<CrewAssignmentResponse>(`${this.apiUrl}/${id}`, assignment);
  }

  deleteCrewAssignment(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }

  getStaff(): Observable<StaffListResponse> {
    return this.http.get<StaffListResponse>(this.staffApiUrl);
  }
}