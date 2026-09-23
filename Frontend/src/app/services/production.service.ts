import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ProductionTicket {
  id: string;
  booking_id: string | null;
  title: string;
  description: string | null;
  category: string;
  status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'revision_needed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'critical';
  assignee_id: string | null;
  assignee_name: string | null;
  assignee_email: string | null;
  deadline: string;
  is_overdue: boolean;
  is_acknowledged?: boolean;
  escalation_level: number | null;
  escalation_role: string | null;
  material_note: string | null;
  completion_notes: string | null;
  booking_number: string | null;
  client_name: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTicketRequest {
  booking_id?: string;
  title: string;
  description?: string;
  category: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  assignee_id?: string;
  deadline: string;
  material_note?: string;
}

export interface UpdateTicketRequest {
  booking_id?: string;
  title?: string;
  description?: string;
  category?: string;
  status?: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'revision_needed' | 'cancelled';
  priority?: 'low' | 'normal' | 'high' | 'critical';
  assignee_id?: string;
  deadline?: string;
  material_note?: string;
  completion_notes?: string;
}

export interface TicketListResponse {
  success: boolean;
  tickets: ProductionTicket[];
  count: number;
}

export interface TicketResponse {
  success: boolean;
  ticket: ProductionTicket;
}

export interface EscalationLevel {
  id: string;
  level: number;
  overdue_hours: number;
  role: string;
  priority?: string;
}

export interface EscalationMatrixResponse {
  success: boolean;
  escalationMatrix: EscalationLevel[];
  count: number;
}

@Injectable({ providedIn: 'root' })
export class ProductionService {
  private readonly apiUrl = `${environment.apiUrl}/production-tickets`;
  private readonly escalationApiUrl = `${environment.apiUrl}/escalation-matrix`;

  constructor(private http: HttpClient) {}

  getTickets(): Observable<TicketListResponse> {
    return this.http.get<TicketListResponse>(this.apiUrl);
  }

  getTicketById(id: string): Observable<TicketResponse> {
    return this.http.get<TicketResponse>(`${this.apiUrl}/${id}`);
  }

  createTicket(ticket: CreateTicketRequest): Observable<TicketResponse> {
    return this.http.post<TicketResponse>(this.apiUrl, ticket);
  }

  updateTicket(id: string, ticket: UpdateTicketRequest): Observable<TicketResponse> {
    return this.http.put<TicketResponse>(`${this.apiUrl}/${id}`, ticket);
  }

  deleteTicket(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }

  acknowledgeEscalation(id: string): Observable<TicketResponse> {
    return this.http.post<TicketResponse>(`${this.apiUrl}/${id}/acknowledge`, {});
  }

  getEscalationMatrix(): Observable<EscalationMatrixResponse> {
    return this.http.get<EscalationMatrixResponse>(this.escalationApiUrl);
  }

  saveEscalationMatrix(level: number, overdueHours: number, role: string, priority?: string): Observable<any> {
    return this.http.post(this.escalationApiUrl, { level, overdueHours, role, priority });
  }
}