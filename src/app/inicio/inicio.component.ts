import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { NotificationService } from '../notificacion.service';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css'
})
export class InicioComponent {
constructor(public usuarioService: AuthService, private router:Router, private notificationService: NotificationService){}

opcionesMenu = [
    {
      titulo: 'Gestionar Aulas',
      descripcion: 'Administra y configura las aulas disponibles',
      icono: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
      ruta: '/inicio/gestionar-aulas',
      gradiente: 'from-purple-500 to-pink-600',
      rolesPermitidos: ['SUPERADMINISTRADOR']
    },
    {
      titulo: 'Coordinadores',
      descripcion: 'Gestiona los coordinadores del sistema',
      icono: 'M17 20h5v-2a4 4 0 00-5-3.87M9 20h5v-2a4 4 0 00-5-3.87M12 4a4 4 0 110 8 4 4 0 010-8z',
      ruta: '/inicio/coordinadores',
      gradiente: 'from-blue-500 to-cyan-600',
      rolesPermitidos: ['SUPERADMINISTRADOR']
    },
    {
      titulo: 'Generar Horarios',
      descripcion: 'Crea y configura horarios académicos',
      icono: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      ruta: '/inicio/generar-horario',
      gradiente: 'from-verde-claro to-emerald-600',
      rolesPermitidos: ['COORDINADOR', 'SUPERADMINISTRADOR']
    },
    {
      titulo: 'Generar Reportes',
      descripcion: 'Genera reportes detallados del sistema',
      icono: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      ruta: '/inicio/generar-reporte',
      gradiente: 'from-orange-500 to-red-600',
      rolesPermitidos: ['SUPERADMINISTRADOR', 'COORDINADOR']
    },
    {
      titulo: 'Ver Horarios',
      descripcion: 'Consulta horarios por curso y carrera',
      icono: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
      ruta: '/inicio/ver-horario',
      gradiente: 'from-teal-500 to-green-600',
      rolesPermitidos: ['COORDINADOR', 'SUPERADMINISTRADOR']
    },
    {
      titulo: 'Ver Horarios Docentes',
      descripcion: 'Consulta horarios de profesores',
      icono: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
      ruta: '/inicio/ver-horario-docente',
      gradiente: 'from-indigo-500 to-purple-600',
      rolesPermitidos: ['SUPERADMINISTRADOR', 'COORDINADOR']
    },
    {
      titulo: 'Mi Horario',
      descripcion: 'Consulta tu horario personal',
      icono: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      ruta: '/inicio/mi-horario',
      gradiente: 'from-pink-500 to-rose-600',
      rolesPermitidos: ['ESTUDIANTE']
    },
    {
      titulo: 'Horario Docente',
      descripcion: 'Consulta tu horario como docente',
      icono: 'M4 6h16M4 10h16M4 14h10M4 18h10',
      ruta: '/inicio/docente-horario',
      gradiente: 'from-amber-500 to-orange-600',
      rolesPermitidos: ['DOCENTE']
    }
  ];

}
