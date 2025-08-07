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

  generarPdfDocenteAuditoria(idPeriodo: number, idDocente: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/pdf-docente-por-id/${idPeriodo}/${idDocente}`, {
      headers: this.getAuthHeaders(),
      responseType: 'blob'
    });
  }
  generarPdfAulaAuditoria(idPeriodo: number, idAula: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/pdf-aula-por-id/${idPeriodo}/${idAula}`, {
      headers: this.getAuthHeaders(),
      responseType: 'blob'
    });
  }
  crearReporteAulasExcel(idPeriodo: number, idAula: number): Observable<Blob> {
    const url = `${this.apiUrl}/excel-aula-por-id/${idPeriodo}/${idAula}`;
    console.log('URL para Excel aula:', url);
    return this.http.get(url, {
      headers: this.getAuthHeaders(),
      responseType: 'blob'
    });
  }
  obtenerAulasHorarios(idPeriodo: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/aulas-horarios/${idPeriodo}`, {
      headers: this.getAuthHeaders()
    });
  }
  crearReporteDocentesExcel(idPeriodo: number, idDocente: number): Observable<Blob> {
    const url = `${this.apiUrl}/excel-docente-por-id/${idPeriodo}/${idDocente}`;
    console.log('URL para Excel docente:', url);
    return this.http.get(url, {
      headers: this.getAuthHeaders(),
      responseType: 'blob'
    });
  }






}
