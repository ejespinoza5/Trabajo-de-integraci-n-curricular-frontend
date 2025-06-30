import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReportesService {
  private apiUrl = 'http://localhost:3000/v1';

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  crearReporte(coordinador: any): Observable<Blob> {
    return this.http.post(this.apiUrl + '/generar-pdf', coordinador, {
      headers: this.getAuthHeaders(),
      responseType: 'blob'
    });
  }

  obtenerObservacionesPorCarrera(idCarrera: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/observaciones/${idCarrera}`, {
      headers: this.getAuthHeaders()
    });
  }

  editarObservaciones(idObservacion: number, datos: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/observaciones/${idObservacion}`, datos, {
      headers: this.getAuthHeaders()
    });
  }
  
  
  obtenerAutoridades(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/autoridades`, {
      headers: this.getAuthHeaders()
    });
  }
  actualizarAutoridad(datos: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/autoridades`, datos, {
      headers: this.getAuthHeaders()
    });
  }

  





}
