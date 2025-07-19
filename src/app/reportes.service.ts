import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api-config';

@Injectable({
  providedIn: 'root'
})
export class ReportesService {
  private apiUrl = API_BASE_URL;

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


  crearReporteExcel(coordinador: any): Observable<Blob> {
    return this.http.post(this.apiUrl + '/generar-excel', coordinador, {
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
