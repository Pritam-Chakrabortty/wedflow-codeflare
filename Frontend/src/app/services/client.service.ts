import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Client {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CreateClientRequest {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  status?: string;
}

export interface UpdateClientRequest {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  status?: string;
}

export interface ClientListResponse {
  success: boolean;
  clients: Client[];
  count: number;
}

export interface ClientResponse {
  success: boolean;
  client: Client;
}

@Injectable({
  providedIn: 'root',
})
export class ClientService {
  private apiUrl = 'https://wedflow-codeflare.onrender.com/api/clients';

  constructor(private http: HttpClient) {}

  getClients(): Observable<ClientListResponse> {
    return this.http.get<ClientListResponse>(this.apiUrl);
  }

  getClientById(id: string): Observable<ClientResponse> {
    return this.http.get<ClientResponse>(`${this.apiUrl}/${id}`);
  }

  createClient(client: CreateClientRequest): Observable<ClientResponse> {
    return this.http.post<ClientResponse>(this.apiUrl, client);
  }

  updateClient(id: string, client: UpdateClientRequest): Observable<ClientResponse> {
    return this.http.put<ClientResponse>(`${this.apiUrl}/${id}`, client);
  }

  deleteClient(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }
}
