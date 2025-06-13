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
      error: (error) => {
        this.notificationService.hideLoading();
        console.error('Error al cargar los horarios:', error);

        const mensaje = error?.error?.message || 'Error al cargar los horarios';
        this.mensajeError = mensaje;

        this.notificationService.showErrorReport(
          'Error',
          mensaje,
          'Cerrar'
        );

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

  actualizarEventosCalendario(): void {
    if (this.horariosFiltrados.length > 0) {
      this.actualizarEventosParaSemanaActual(new Date());
    }
  }

  actualizarEventosParaSemanaActual(fechaReferencia: Date): void {
    if (this.horariosFiltrados.length === 0) return;

    const inicioSemana = this.obtenerInicioSemana(fechaReferencia);

    const eventos = this.horariosFiltrados.map(horario => {
      const diaSemana = this.obtenerDiaSemana(horario.dia.nombre);
      const fechaClase = this.obtenerFechaParaDiaSemana(inicioSemana, diaSemana);

      return {
        title: `${horario.asignatura.nombre}\n${horario.docente.nombre}\n${horario.aula.nombre}`,
        start: `${fechaClase}T${horario.horaInicio}`,
        end: `${fechaClase}T${horario.horaFin}`,
        backgroundColor: this.getColorMateria(horario.asignatura.id),
        borderColor: this.getColorMateria(horario.asignatura.id),
        extendedProps: {
          horarioId: horario.id,
          asignaturaId: horario.asignatura.id,
          aula: horario.aula.nombre,
          docente: horario.docente.nombre,
          asignatura: horario.asignatura.nombre
        }
      };
    });

    this.calendarOptions = {
      ...this.calendarOptions,
      events: eventos
    };
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

  // Método mejorado para abrir el modal
  abrirModalDetalleHorario(horarioId: number): void {
    const horario = this.horariosFiltrados.find(h => h.id === horarioId);
    if (horario) {
      this.horarioSeleccionado = {
        id: horario.id,
        asignatura: horario.asignatura.nombre,
        docente: horario.docente.nombre,
        aula: horario.aula.nombre,
        dia: horario.dia.nombre,
        horaInicio: horario.horaInicio,
        horaFin: horario.horaFin,
        color: this.getColorMateria(horario.asignatura.id),
        codigo: horario.asignatura.codigo || 'N/A',
        creditos: horario.asignatura.creditos || 'N/A',
        tipo: horario.tipo || 'Clase'
      };
      this.mostrarModal = true;
    }
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
}
