import { Component } from '@angular/core';
import { Periodo, VerHorariosDocentesService } from '../ver-horarios-docentes.service';
import { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { NotificationService } from '../notificacion.service';

@Component({
  selector: 'app-ver-horarios-docentes',
  templateUrl: './ver-horarios-docentes.component.html',
  styleUrl: './ver-horarios-docentes.component.css'
})
export class VerHorariosDocentesComponent {

  PeriodoSeleccionado: number = 0;
  DocenteSeleccionado: number = 0;
  periodos: Periodo[] = [];
  docentes: any[] = [];

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
    // Eliminamos el callback datesSet que causaba el problema
    eventDidMount: (info) => {
      if (info.event.extendedProps['asignaturaId']) {
        info.el.style.backgroundColor = this.getColorMateria(info.event.extendedProps['asignaturaId']);
      }
    },
    eventClick: (clickInfo: EventClickArg) => {
      this.abrirModalDetalleHorario(clickInfo.event.extendedProps['horarioId']);
    }
  };

  constructor(private verHorariosDocentesService: VerHorariosDocentesService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.cargarPeriodos();
  }

  cargarPeriodos(): void {
    this.verHorariosDocentesService.obtenerPeriodos().subscribe({
      next: (data) => {
        this.periodos = data;
        if (this.periodos.length > 0) {
          this.PeriodoSeleccionado = this.periodos[this.periodos.length - 1].id;
          this.onPeriodoChange(this.PeriodoSeleccionado);
        }
      },
      error: (err) => {
        console.error('Error al cargar periodos:', err);
        this.mensajeError = 'Error al cargar los periodos';
      }
    });
  }

  onPeriodoChange(idPeriodo: number): void {
    if (!idPeriodo) {
      this.docentes = [];
      this.DocenteSeleccionado = 0;
      return;
    }

    this.verHorariosDocentesService.obtenerDocentesPorPeriodoYCarrera(idPeriodo).subscribe({
      next: (data) => {
        this.docentes = data;
        this.DocenteSeleccionado = 0;
        this.limpiarCalendario();
      },
      error: (err) => {
        console.error('Error al cargar docentes:', err);
        this.mensajeError = 'Error al cargar docentes';
      }
    });
  }

  cargarDocentes(): void {
    if (this.PeriodoSeleccionado) {
      this.verHorariosDocentesService
        .obtenerDocentesPorPeriodoYCarrera(this.PeriodoSeleccionado)
        .subscribe({
          next: (data) => {
            this.docentes = data;
            this.DocenteSeleccionado = 0;
          },
          error: (err) => {
            console.error('Error al cargar docentes:', err);
            this.mensajeError = 'Error al cargar los docentes';
          }
        });
    }
  }

  onDocenteChange(): void {
    if (this.PeriodoSeleccionado && this.DocenteSeleccionado) {
      this.cargarHorarios();
    } else {
      this.limpiarCalendario();
    }
  }

 cargarHorarios(): void {
  if (!this.PeriodoSeleccionado || !this.DocenteSeleccionado) {
    this.notificationService.showWarningReport(
      'Filtros incompletos',
      'Por favor, selecciona el periodo y el docente antes de continuar.',
      'Entendido'
    );
    return;
  }

  this.mensajeError = '';
  this.notificationService.showLoading('Cargando horarios...');

  this.verHorariosDocentesService
    .obtenerHorariosPorPeriodoCarreraDocente(this.PeriodoSeleccionado, this.DocenteSeleccionado)
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

  // MÉTODO CORREGIDO: Usar eventos recurrentes para evitar el corrimiento de días
  actualizarEventosCalendario(): void {
    if (this.horariosFiltrados.length > 0) {
      this.actualizarEventosCalendarioRecurrente();
    }
  }

  // NUEVO MÉTODO: Usar daysOfWeek para eventos recurrentes
  actualizarEventosCalendarioRecurrente(): void {
    if (this.horariosFiltrados.length === 0) return;

    const eventos = this.horariosFiltrados.map(horario => {
      const diaSemana = this.obtenerDiaSemanaISO(horario.dia.nombre);
      
      return {
        title: `${horario.asignatura.nombre}\n${horario.docente.nombre}\n${horario.aula.nombre}`,
        daysOfWeek: [diaSemana], // Usar daysOfWeek para eventos recurrentes
        startTime: horario.horaInicio,
        endTime: horario.horaFin,
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

  // NUEVO MÉTODO: Obtener día de la semana para FullCalendar (0=domingo, 1=lunes, etc.)
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

  // MÉTODOS MANTENIDOS PERO YA NO SE USAN (puedes eliminarlos si quieres)
  actualizarEventosParaSemanaActual(fechaReferencia: Date): void {
    // Este método ya no se usa con la nueva implementación
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

  // Método mejorado para abrir el modal
  abrirModalDetalleHorario(horarioId: number): void {
    const horario = this.horariosFiltrados.find(h => h.id === horarioId);
    if (horario) {
      this.horarioSeleccionado = {
        id: horario.id,
        asignatura: horario.asignatura.nombre,
        curso: horario.curso.nombre,
        docente: horario.docente.nombre,
        carrera: horario.carrera.nombre,
        aula: horario.aula.nombre,
        dia: horario.dia.nombre,
        horaInicio: horario.horaInicio,
        horaFin: horario.horaFin,
        color: this.getColorMateria(horario.asignatura.id),
        codigo: horario.asignatura.codigo || 'N/A',
        creditos: horario.asignatura.creditos || 'N/A'
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