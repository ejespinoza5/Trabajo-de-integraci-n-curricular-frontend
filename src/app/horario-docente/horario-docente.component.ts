import { Component } from '@angular/core';
import { HorarioDocenteService } from '../horario-docente.service';
import { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { NotificationService } from '../notificacion.service';
@Component({
  selector: 'app-horario-docente',
  templateUrl: './horario-docente.component.html',
  styleUrl: './horario-docente.component.css'
})
export class HorarioDocenteComponent {

  horariosFiltrados: any[] = [];
  materiasUnicas: any[] = [];
  coloresMaterias: { [id: number]: string } = {};
  mensajeError: string = '';
  // Variables para el modal
  mostrarModal: boolean = false;
  horarioSeleccionado: any = null;

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek'
    },
    weekends: true,
    allDaySlot: false,
    slotMinTime: '07:00:00',
    slotMaxTime: '19:00:00',
    height: 'auto',
    locales: [esLocale],
    locale: 'es',
    events: [],
    slotLabelFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    buttonText: {
      today: 'Hoy',
      month: 'Mes',
      week: 'Semana',
      day: 'Día'
    },
    eventDataTransform: (event) => {
      return event;
    },
    datesSet: (dateInfo) => {
      this.actualizarEventosParaSemanaActual(dateInfo.start);
    },
    eventDidMount: (info) => {
      if (info.event.extendedProps['asignaturaId']) {
        info.el.style.backgroundColor = this.getColorMateria(info.event.extendedProps['asignaturaId']);
      }
    },
    eventClick: (clickInfo: EventClickArg) => {
      this.abrirModalDetalleHorario(clickInfo.event.extendedProps['horarioId']);
    }
  };

  constructor(private verHorariosDocenteService: HorarioDocenteService, private notificationService: NotificationService) { }
  ngOnInit(): void {
    this.cargarHorarios();
  }

  cargarHorarios(): void {
    this.mensajeError = '';
    this.notificationService.showLoading('Cargando horarios...');
    this.verHorariosDocenteService
      .obtenerHorarioDocente()
      .subscribe({
        next: (data: any[]) => {
          this.notificationService.hideLoading();

          this.horariosFiltrados = data;
          this.asignarColoresAMaterias();
          this.actualizarEventosCalendario();
        },
        error: (err) => {
          this.notificationService.hideLoading();
          console.error('Error al cargar los horarios:', err);
          this.mensajeError = 'Error al cargar los horarios';
          this.limpiarCalendario();
        }
      });
  }

  limpiarCalendario(): void {
    this.horariosFiltrados = [];
    this.materiasUnicas = [];
    this.coloresMaterias = {};
    this.contadorColores = 0;
    this.calendarOptions = {
      ...this.calendarOptions,
      events: []
    };
  }

  asignarColoresAMaterias(): void {
    this.materiasUnicas = [];
    this.coloresMaterias = {};
    this.contadorColores = 0;

    const materiasMap = new Map<number, string>();

    this.horariosFiltrados.forEach(horario => {
      const materia = horario.asignatura;
      if (!materiasMap.has(materia.id)) {
        materiasMap.set(materia.id, materia.nombre);
      }
    });

    Array.from(materiasMap, ([id, nombre]) => {
      if (!this.coloresMaterias[id]) {
        this.coloresMaterias[id] = this.generarColorAleatorio();
      }
      return { id, nombre };
    }).forEach(materia => {
      this.materiasUnicas.push(materia);
    });
  }

  private coloresDisponibles = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
    '#F59E0B', '#EF4444', '#10B981', '#8B5CF6', '#06B6D4'
  ];
  private contadorColores = 0;

  generarColorAleatorio(): string {
    const color = this.coloresDisponibles[this.contadorColores % this.coloresDisponibles.length];
    this.contadorColores++;
    return color;
  }

  getColorMateria(id: number): string {
    return this.coloresMaterias[id] || '#6B7280';
  }

  // MÉTODO ACTUALIZADO: Usar eventos con fechas específicas respetando fechaInicio y fechaFin
  actualizarEventosCalendario(): void {
    if (this.horariosFiltrados.length > 0) {
      this.actualizarEventosConFechasEspecificas();
    }
  }

  // NUEVO MÉTODO: Crear eventos respetando fechaInicio y fechaFin
  actualizarEventosConFechasEspecificas(): void {
    if (this.horariosFiltrados.length === 0) return;

    const eventos = this.horariosFiltrados.map(horario => {
      const diaSemana = this.obtenerDiaSemanaISO(horario.dia.nombre);

      // Convertir fechas ISO a Date objects
      const fechaInicio = new Date(horario.fechaInicio);
      const fechaFin = new Date(horario.fechaFin);

      // Formatear fechas para FullCalendar (YYYY-MM-DD)
      const startDate = this.formatearFechaParaCalendar(fechaInicio);
      const endDate = this.formatearFechaParaCalendar(fechaFin);

      return {
        title: this.generarTituloEvento(horario),
        daysOfWeek: [diaSemana],
        startTime: horario.horaInicio,
        endTime: horario.horaFin,
        startRecur: startDate, // Fecha de inicio del evento recurrente
        endRecur: endDate,     // Fecha de fin del evento recurrente
        backgroundColor: this.getColorMateria(horario.asignatura.id),
        borderColor: this.getColorMateria(horario.asignatura.id),
        extendedProps: {
          horarioId: horario.id,
          asignaturaId: horario.asignatura.id,
          aula: horario.aula?.nombre || 'Sin aula',
          docente: horario.docente?.nombre || 'Sin docente',
          asignatura: horario.asignatura?.nombre || 'Sin asignatura',
          curso: horario.curso?.nombre || 'Sin curso',
          carrera: horario.carrera?.nombre || 'Sin carrera',
          tipoClase: horario.tipoClase,
          grupoArticulado: horario.grupoArticulado,
          fechaInicio: horario.fechaInicio,
          fechaFin: horario.fechaFin
        }
      };
    });

    this.calendarOptions = {
      ...this.calendarOptions,
      events: eventos
    };
  }

  // NUEVO MÉTODO: Generar título del evento considerando clases articuladas
  generarTituloEvento(horario: any): string {
    const asignatura = horario.asignatura?.nombre || 'Sin asignatura';
    const docente = horario.docente?.nombre || 'Sin docente';
    const aula = horario.aula?.nombre || 'Sin aula';

    let titulo = `${asignatura}\n${docente}\n${aula}`;

    // Agregar información de carreras (tanto articuladas como regulares)
    const infoCarreras = this.obtenerInfoCarreras(horario.carrera);
    if (infoCarreras) {
      titulo += `\n${infoCarreras}`;
    }

    // Agregar información de cursos (tanto articulados como regulares)
    const infoCursos = this.obtenerInfoCursos(horario.curso);
    if (infoCursos) {
      titulo += `\n${infoCursos}`;
    }

    // Si es una clase articulada, agregar indicador
    if (horario.tipoClase === 'ARTICULADA') {
      titulo += `\n[ARTICULADA]`;
      if (horario.grupoArticulado) {
        titulo += ` Grupo ${horario.grupoArticulado}`;
      }
    }

    return titulo;
  }

  // NUEVO MÉTODO: Formatear fecha para FullCalendar
  formatearFechaParaCalendar(fecha: Date): string {
    return fecha.toISOString().split('T')[0];
  }

  // MÉTODO ACTUALIZADO: Obtener día de la semana para FullCalendar
  obtenerDiaSemanaISO(nombreDia: string): number {
    const dias: { [key: string]: number } = {
      'Domingo': 0,
      'Lunes': 1,
      'Martes': 2,
      'Miércoles': 3,
      'Miercoles': 3,
      'Jueves': 4,
      'Viernes': 5,
      'Sábado': 6,
      'Sabado': 6
    };
    return dias[nombreDia] ?? 1;
  }

abrirModalDetalleHorario(horarioId: number): void {
  const horario = this.horariosFiltrados.find(h => h.id === horarioId);
  if (horario) {
    this.horarioSeleccionado = {
      id: horario.id,
      asignatura: horario.asignatura?.nombre || 'Sin asignatura',
      curso: this.obtenerDetallesCurso(horario.curso),
      docente: horario.docente?.nombre || 'Sin docente',
      carrera: this.obtenerDetallesCarrera(horario.carrera),
      aula: horario.aula?.nombre || 'Sin aula',
      dia: horario.dia?.nombre || 'Sin día',
      horaInicio: horario.horaInicio,
      horaFin: horario.horaFin,
      fechaInicio: this.formatearFechaParaMostrar(horario.fechaInicio),
      fechaFin: this.formatearFechaParaMostrar(horario.fechaFin),
      tipoClase: horario.tipoClase,
      grupoArticulado: horario.grupoArticulado,
      color: this.getColorMateria(horario.asignatura?.id || 0),
      codigo: horario.asignatura?.codigo || 'N/A',
      creditos: horario.asignatura?.creditos || 'N/A',
      // Información adicional para clases articuladas
      esArticulada: horario.tipoClase === 'ARTICULADA'
    };
    this.mostrarModal = true;
  }
}

  // NUEVO MÉTODO: Obtener detalles completos de la carrera para el modal
  obtenerDetallesCarrera(carrera: any): any {
    if (!carrera) return { nombre: 'Sin carrera', lista: [] };

    // Si es una carrera múltiple (articulada)
    if (carrera.carreras && carrera.carreras.length > 0) {
      return {
        nombre: carrera.nombre, // Nombre completo concatenado
        lista: carrera.carreras, // Array de carreras individuales
        esMultiple: true
      };
    }

    // Si es una carrera única
    return {
      nombre: carrera.nombre,
      lista: [carrera],
      esMultiple: false
    };
  }

  // NUEVO MÉTODO: Obtener detalles completos del curso para el modal
  obtenerDetallesCurso(curso: any): any {
    if (!curso) return { nombre: 'Sin curso', lista: [] };

    // Si es un curso múltiple (articulado)
    if (curso.cursos && curso.cursos.length > 0) {
      return {
        nombre: curso.nombre, // Nombre completo concatenado
        lista: curso.cursos, // Array de cursos individuales
        esMultiple: true
      };
    }

    // Si es un curso único
    return {
      nombre: curso.nombre,
      lista: [curso],
      esMultiple: false
    };
  }

  // NUEVO MÉTODO: Formatear fecha para mostrar en el modal
  formatearFechaParaMostrar(fechaISO: string): string {
    if (!fechaISO) return 'N/A';

    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Método para cerrar el modal
  cerrarModal(): void {
    this.mostrarModal = false;
    this.horarioSeleccionado = null;
  }

  // Método para formatear la hora
  formatearHora(hora: string): string {
    if (!hora) return '';
    const [hours, minutes] = hora.split(':');
    return `${hours}:${minutes}`;
  }

  // MÉTODOS HEREDADOS (mantenidos por compatibilidad, pero ya no se usan)
  actualizarEventosCalendarioRecurrente(): void {
    console.warn('Este método ya no se usa. Se mantiene por compatibilidad.');
  }

  actualizarEventosParaSemanaActual(fechaReferencia: Date): void {
    console.warn('Este método ya no se usa. Se mantiene por compatibilidad.');
  }

  obtenerInicioSemana(fecha: Date): Date {
    const fechaCopia = new Date(fecha);
    const dia = fechaCopia.getDay();
    const diferencia = dia === 0 ? -6 : 1 - dia;
    fechaCopia.setDate(fechaCopia.getDate() + diferencia);
    return fechaCopia;
  }

  obtenerFechaParaDiaSemana(inicioSemana: Date, diaSemana: number): string {
    const fecha = new Date(inicioSemana);
    const diasAgregar = diaSemana === 0 ? 6 : diaSemana - 1;
    fecha.setDate(inicioSemana.getDate() + diasAgregar);
    return fecha.toISOString().split('T')[0];
  }

  obtenerDiaSemana(nombreDia: string): number {
    const dias: { [key: string]: number } = {
      'Domingo': 0,
      'Lunes': 1,
      'Martes': 2,
      'Miércoles': 3,
      'Miercoles': 3,
      'Jueves': 4,
      'Viernes': 5,
      'Sábado': 6,
      'Sabado': 6
    };
    return dias[nombreDia] ?? 1;
  }

  obtenerFechaProxima(diaSemana: number): string {
    const hoy = new Date();
    const diaActual = hoy.getDay();
    const diferencia = diaSemana === diaActual ? 0 : (diaSemana + 7 - diaActual) % 7;
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() + diferencia);
    return fecha.toISOString().split('T')[0];
  }

  // OPCIÓN 1: Agrega estos métodos a tu clase VerHorariosDocentesComponent

// NUEVO MÉTODO: Obtener información de carreras para el título del evento
obtenerInfoCarreras(carrera: any): string {
  if (!carrera) return '';

  // Si es una carrera múltiple (articulada)
  if (carrera.carreras && carrera.carreras.length > 0) {
    return carrera.carreras.map((c: any) => c.nombre).join(', ');
  }

  // Si es una carrera única
  return carrera.nombre || '';
}

// NUEVO MÉTODO: Obtener información de cursos para el título del evento
obtenerInfoCursos(curso: any): string {
  if (!curso) return '';

  // Si es un curso múltiple (articulado)
  if (curso.cursos && curso.cursos.length > 0) {
    return curso.cursos.map((c: any) => c.nombre).join(', ');
  }

  // Si es un curso único
  return curso.nombre || '';
}
}
