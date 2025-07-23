// 1. IMPORTS ORDENADOS Y LIMPIOS
import { ChangeDetectorRef, Component, OnInit, ViewChild, NgZone, OnDestroy } from '@angular/core';
import { HorariosService } from '../horarios.service';
import { AulasService } from '../aulas.service';
import { CalendarOptions, EventInput, EventClickArg, Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { FullCalendarComponent } from '@fullcalendar/angular';
import esLocale from '@fullcalendar/core/locales/es';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { NotificationService } from '../notificacion.service';
import rrulePlugin from '@fullcalendar/rrule';
import listPlugin from '@fullcalendar/list';
import { VerHorariosDocentesService } from '../ver-horarios-docentes.service';

// 2. INTERFACES Y CLASES AUXILIARES
interface HorarioResponse {
  id: number;
  success: boolean;
  message: string;
}

interface HorarioDetalle {
  id?: number;
  docente: { id: number; nombre: string; };
  asignatura: { id: number; nombre: string; };
  carrera: {
    id: number;
    nombre: string;
    carreras?: Array<{ id: number; nombre: string; }>; // Para carreras articuladas
  };
  curso: {
    id: number | string;
    nombre: string;
    cursos?: Array<{ id: number; nombre: string; }>; // Para cursos articulados
  };
  aula: { id: number; nombre: string; };
  dia: { id: number; nombre: string; };
  horaInicio: string;
  horaFin: string;
  fechaInicio: string;
  fechaFin: string;
  tipoClase?: string;
  grupoArticulado?: any;
}

// Clase para manejo de colores optimizada
class ColorManager {
  private static readonly PALETTE = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA',
    '#F1948A', '#85C1E9', '#F4D03F', '#A9DFBF', '#D7DBDD', '#FAD7A0',
    '#E8DAEF', '#D5DBDB', '#FADBD8', '#D1F2EB', '#FCF3CF', '#EBDEF0',
    '#EBF5FB', '#FEF9E7', '#EAEDED', '#FDF2E9', '#F4ECF7', '#EAF2F8'
  ];

  private colorMap = new Map<number, string>();
  private usedColorsCount = 0;

  private generateHSLColor(index: number): string {
    const hue = (index * 137.508) % 360;
    const saturation = 70 + (index % 3) * 10;
    const lightness = 65 + (index % 2) * 10;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  getColorForSubject(subjectId: number): string {
    if (!this.colorMap.has(subjectId)) {
      let color: string;

      if (this.usedColorsCount < ColorManager.PALETTE.length) {
        color = ColorManager.PALETTE[this.usedColorsCount];
      } else {
        color = this.generateHSLColor(this.usedColorsCount);
      }

      this.colorMap.set(subjectId, color);
      this.usedColorsCount++;
    }

    return this.colorMap.get(subjectId)!;
  }

  getAllColors(): Map<number, string> {
    return new Map(this.colorMap);
  }

  reset(): void {
    this.colorMap.clear();
    this.usedColorsCount = 0;
  }
}

// 3. COMPONENTE
@Component({
  selector: 'app-generar-horarios',
  templateUrl: './generar-horarios.component.html',
  styleUrl: './generar-horarios.component.css'
})
export class GenerarHorariosComponent implements OnInit, OnDestroy {
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  // 4. PROPIEDADES PÚBLICAS Y PRIVADAS AGRUPADAS Y ORDENADAS
  // --- Formularios y filtros ---
  periodos: any[] = [];
  aulas: any[] = [];
  dias: any[] = [];
  carreras: any[] = [];
  carrerasArticuladas: any[] = [];
  docenteAsignaturaNivel: any[] = [];
  cursos: any[] = [];
  docentes: any[] = [];
  cursosDisponibles: any[] = [];
  cursosArticulados: Array<{ ID_CURSOS: number, ID_CARRERAS: number, NOMBRE_CARRERAS?: string, NOMBRE_CURSOS?: string }> = [];

  // --- Selecciones y estados ---
  readonly DEFAULT_SELECTION = 0;
  readonly DEFAULT_COMBINATION = '0';
  PeriodoSeleccionado = this.DEFAULT_SELECTION;
  CombinacionSeleccionada: string = this.DEFAULT_COMBINATION;
  DocenteSeleccionado = this.DEFAULT_SELECTION;
  AulaSeleccionada = this.DEFAULT_SELECTION;
  DiaSeleccionado = this.DEFAULT_SELECTION;
  CarreraSeleccionada = this.DEFAULT_SELECTION;
  NivelSeleccionado = this.DEFAULT_SELECTION;
  AsignaturaSeleccionada = this.DEFAULT_SELECTION;
  horaInicio = '';
  horaFin = '';
  fechaInicio = '';
  fechaFin = '';
  mensajeError = '';

  // --- Modal y edición ---
  modalVisible = false;
  horarioSeleccionado: HorarioDetalle | null = null;
  modoEdicion = false;
  editHoraInicio = '';
  editHoraFin = '';
  editFechaInicio = '';
  editFechaFin = '';
  editAulaSeleccionada = this.DEFAULT_SELECTION;
  editDiaSeleccionado = this.DEFAULT_SELECTION;
  editDocenteSeleccionado: number = this.DEFAULT_SELECTION;
  mensajeModal = '';
  tipoMensajeModal: 'error' | 'success' | '' = '';
  docenteOriginal: number = 0;
  mostrarObservacion: boolean = false;
  observacion: string = '';

  // --- Horarios y visualización ---
  todosLosHorarios: HorarioDetalle[] = [];
  horariosFiltrados: HorarioDetalle[] = [];
  isAccordionOpen = false;
  tiposClase = [
    { nombre: 'Clase Regular', valor: 'regular' },
    { nombre: 'Clase Articulada', valor: 'articulada' }
  ];
  tipoClaseSeleccionado: string = 'regular';
  nuevaCarreraArticulada: number | null = null;
  nuevoCursoArticulado: number | null = null;

  // --- Calendario ---
  calendar!: Calendar;
  viewMode: 'calendar' | 'list' | 'compact' = 'calendar';
  eventDensity: 'low' | 'medium' | 'high' = 'medium';
  isCompactView: boolean = false;
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, rrulePlugin, listPlugin],
    initialView: 'timeGridWeek',
    themeSystem: 'standard',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,listWeek,compactView'
    },
    customButtons: {
      compactView: {
        text: 'Compacto',
        click: () => this.toggleCompactView()
      }
    },
    weekends: true,
    allDaySlot: false,
    slotMinTime: '07:00:00',
    slotMaxTime: '19:00:00',
    events: [],
    height: 'auto',
    locales: [esLocale],
    locale: 'es',

    // ✅ CORREGIDO: Configuración mejorada para eventos superpuestos
    dayMaxEvents: false,
    dayMaxEventRows: false,
    slotEventOverlap: false,
    eventMinWidth: 80,
    eventMaxStack: 4,

    // Configuración de tiempo
    slotDuration: '01:00:00',
    slotLabelInterval: '01:00:00',
    slotLabelFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },

    // ✅ CORREGIDO: Vistas personalizadas con configuración común
    views: {
      dayGridMonth: {
        eventDidMount: (info) => this.setupEventDisplay(info),
      },
      timeGridWeek: {
        dayHeaderFormat: {
          weekday: 'short',
          month: 'numeric',
          day: 'numeric'
        },
        eventDidMount: (info) => this.setupEventDisplay(info),
        eventOrderStrict: true,
        eventOrder: ['start', 'title']
      },
      listWeek: {
        buttonText: 'Lista',
        listDayFormat: {
          weekday: 'long',
          month: 'long',
          day: 'numeric'
        },
        listDaySideFormat: false,
        eventDidMount: (info) => this.setupListEventDisplay(info)
      },
      timeGridDay: {
        eventDidMount: (info) => this.setupEventDisplay(info)
      }
    },
    eventDidMount: (info) => {
      // Agregar clases directamente al elemento del evento
      info.el.classList.add('dark:bg-gray-700', 'dark:text-white', 'dark:border-gray-600');
    },
    eventContent: (arg) => {
      return {
        html: `<div class="p-1 text-sm" style="color: #000; font-weight: bold; font-size: 12px; white-space: normal; word-break: break-word; overflow: hidden; line-height: 1.1;">${arg.event.title.replace(/\n/g, '<br>')}</div>`
      };
    },
    // Eventos de interacción
    eventClick: (clickInfo: EventClickArg) => {
      this.handleEventClick(clickInfo);
    },

    // ✅ CORREGIDO: Eventos de mouse mejorados para evitar scroll
    eventMouseEnter: (info) => {
      this.showEventTooltip(info);
    },

    eventMouseLeave: () => {
      this.hideEventTooltip();
    },

    // ✅ CORREGIDO: Prevenir scroll automático
    scrollTime: '08:00:00',
    scrollTimeReset: false,
  };

  // --- Búsqueda y dropdowns ---
  searchInput = new Subject<string>();
  searchTerm: string = '';
  isDropdownOpen: boolean = false;
  selectedDocente: any = null;
  docentesFiltrados: any[] = [];

  // --- Otros ---
  private destroy$ = new Subject<void>();
  private colorManager = new ColorManager();

  // Agrega variables para encabezados de reporte si no existen
  nombreCarreraReporte: string = '';
  nombreDocenteReporte: string = '';

  // --- CONSTRUCTOR ---
  constructor(
    private horariosService: HorariosService,
    private aulasService: AulasService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private notificationService: NotificationService,
    private verHorariosDocentesService: VerHorariosDocentesService
  ) {}

  // --- CALENDARIO ---
  ngAfterViewInit() {
    // ✅ CORREGIDO: Inicialización mejorada del calendario
    setTimeout(() => {
      if (this.calendarComponent) {
        this.calendar = this.calendarComponent.getApi();
        this.calendar.render();
        // ✅ CORREGIDO: Añadir estilos CSS para el tooltip
        this.addTooltipStyles();
      }
    });
  }

  // ✅ NUEVO: Método para añadir estilos CSS del tooltip
  addTooltipStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .custom-tooltip {
        position: fixed;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        line-height: 1.4;
        z-index: 10000;
        max-width: 250px;
        word-wrap: break-word;
        pointer-events: none;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        transform: translateZ(0);
        will-change: transform;
      }

      .custom-tooltip::before {
        content: '';
        position: absolute;
        top: 50%;
        left: -5px;
        transform: translateY(-50%);
        border: 5px solid transparent;
        border-right-color: rgba(0, 0, 0, 0.9);
      }

      .event-compact {
        font-size: 10px !important;
        padding: 1px 3px !important;
        line-height: 1.2 !important;
      }

      .event-compact .fc-event-title {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    `;
    document.head.appendChild(style);
  }

  // ✅ CORREGIDO: Método mejorado para toggle de vista compacta
  toggleCompactView() {
    this.isCompactView = !this.isCompactView;

    if (this.isCompactView) {
      this.applyCompactView();
    } else {
      this.applyNormalView();
    }

    // ✅ CORREGIDO: Actualizar el calendario correctamente
    this.updateCalendarOptions();
  }

  // ✅ CORREGIDO: Aplicar vista compacta
  applyCompactView() {
    this.calendarOptions = {
      ...this.calendarOptions,
      eventMaxStack: 2,
      eventMinWidth: 50,
      slotDuration: '00:30:00',
      slotLabelInterval: '01:00:00',
      eventDisplay: 'block',
      dayMaxEvents: 3,
      moreLinkClick: 'popover',
      customButtons: {
        ...this.calendarOptions.customButtons,
        compactView: {
          text: 'Normal',
          click: () => this.toggleCompactView()
        }
      }
    };
  }

  // ✅ CORREGIDO: Aplicar vista normal
  applyNormalView() {
    this.calendarOptions = {
      ...this.calendarOptions,
      eventMaxStack: 4,
      eventMinWidth: 80,
      slotDuration: '00:30:00',
      slotLabelInterval: '01:00:00',
      eventDisplay: 'auto',
      dayMaxEvents: false,
      moreLinkClick: 'popover',
      customButtons: {
        ...this.calendarOptions.customButtons,
        compactView: {
          text: 'Compacto',
          click: () => this.toggleCompactView()
        }
      }
    };
  }

  // ✅ CORREGIDO: Método mejorado para actualizar opciones del calendario
  updateCalendarOptions() {
    if (this.calendar) {
      // Actualizar opciones del calendario una por una
      this.calendar.setOption('eventMaxStack', this.calendarOptions.eventMaxStack);
      this.calendar.setOption('eventMinWidth', this.calendarOptions.eventMinWidth);
      this.calendar.setOption('slotDuration', this.calendarOptions.slotDuration);
      this.calendar.setOption('slotLabelInterval', this.calendarOptions.slotLabelInterval);
      this.calendar.setOption('eventDisplay', this.calendarOptions.eventDisplay);
      this.calendar.setOption('dayMaxEvents', this.calendarOptions.dayMaxEvents);
      this.calendar.setOption('customButtons', this.calendarOptions.customButtons);

      // ✅ CORREGIDO: Actualizar headerToolbar para que funcione el botón today
      this.calendar.setOption('headerToolbar', {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,listWeek,compactView'
      });

      // Forzar re-render
      this.calendar.render();
    }
  }

  // ✅ CORREGIDO: Método mejorado para configurar display de eventos
  setupEventDisplay(info: any) {
    const element = info.el;
    const event = info.event;
    const asignaturaId = event.extendedProps['asignaturaId'];

    if (asignaturaId) {
      const color = this.colorManager.getColorForSubject(asignaturaId);
      element.style.backgroundColor = color;
      element.style.borderColor = color;
      element.style.borderWidth = '2px';
      element.style.borderRadius = '4px';
      element.style.margin = '1px';

      // Color de texto negro y negrilla por defecto
      element.style.color = '#000';
      element.style.fontWeight = 'bold';
      // Ajuste para que el texto no se salga
      element.style.whiteSpace = 'normal';
      element.style.wordBreak = 'break-word';
      element.style.overflow = 'hidden';

      if (this.isCompactView) {
        element.style.fontSize = '10px';
        element.style.fontWeight = 'bold';
        element.style.padding = '1px 3px';
        element.style.lineHeight = '1.2';
        const title = element.querySelector('.fc-event-title');
        if (title) {
          title.style.overflow = 'hidden';
          title.style.textOverflow = 'ellipsis';
          title.style.whiteSpace = 'normal';
          title.style.wordBreak = 'break-word';
          title.style.color = '#000';
          title.style.fontWeight = 'bold';
        }
      } else {
        element.style.fontSize = '11px';
        element.style.fontWeight = 'bold';
        element.style.padding = '2px 5px';
        element.style.lineHeight = '1.3';
        const title = element.querySelector('.fc-event-title');
        if (title) {
          title.style.color = '#000';
          title.style.fontWeight = 'bold';
          title.style.whiteSpace = 'normal';
          title.style.wordBreak = 'break-word';
          title.style.overflow = 'hidden';
        }
      }
      // Elimina clases que puedan forzar blanco
      element.classList.remove('dark:text-white');
    }
  }

  setupListEventDisplay(info: any) {
    const element = info.el;
    const event = info.event;
    const asignaturaId = event.extendedProps['asignaturaId'];

    if (asignaturaId) {
      const color = this.colorManager.getColorForSubject(asignaturaId);
      element.style.borderLeftColor = color;
      element.style.borderLeftWidth = '4px';
      element.style.color = '#000';
      element.style.fontWeight = 'bold';

      // Añadir información adicional
      const detailsDiv = document.createElement('div');
      detailsDiv.className = 'event-details';
      element.appendChild(detailsDiv);
    }
  }

  // ✅ CORREGIDO: Método auxiliar para filtrar horarios
  filtrarHorarios(termino: string) {
    if (!termino.trim()) {
      this.horariosFiltrados = [...this.todosLosHorarios];
    } else {
      this.horariosFiltrados = this.todosLosHorarios.filter(horario =>
        horario.asignatura.nombre.toLowerCase().includes(termino.toLowerCase()) ||
        horario.docente.nombre.toLowerCase().includes(termino.toLowerCase()) ||
        horario.aula.nombre.toLowerCase().includes(termino.toLowerCase())
      );
    }

    // Actualizar eventos en el calendario
    this.actualizarEventosCalendario();
  }

  // ✅ CORREGIDO: Método para convertir horarios a eventos
  convertirHorariosAEventos(horarios: HorarioDetalle[]): EventInput[] {
    return horarios.map(horario => ({
      id: horario.id?.toString(),
      title: horario.asignatura.nombre,
      start: `${horario.fechaInicio}T${horario.horaInicio}`,
      end: `${horario.fechaFin}T${horario.horaFin}`,
      extendedProps: {
        horarioId: horario.id,
        asignaturaId: horario.asignatura.id,
        profesor: horario.docente.nombre,
        aula: horario.aula.nombre,
        tipo: horario.tipoClase
      }
    }));
  }

  getOverlappingEventsCount(event: any): number {
    const eventStart = event.start;
    const eventEnd = event.end;

    if (!this.calendarOptions.events) {
      return 1;
    }
    return (this.calendarOptions.events as any[]).filter((otherEvent: any) => {
      if (otherEvent.id === event.id) return false;

      const otherStart = new Date(otherEvent.start);
      const otherEnd = new Date(otherEvent.end);

      return (eventStart < otherEnd && eventEnd > otherStart);
    }).length + 1;
  }

  // ✅ CORREGIDO: Método mejorado para configurar tooltip
  setupEventTooltip(element: HTMLElement, event: any) {
    const tooltipContent = [
      event.title,
      event.extendedProps['profesor'] ? `Profesor: ${event.extendedProps['profesor']}` : '',
      event.extendedProps['aula'] ? `Aula: ${event.extendedProps['aula']}` : '',
      event.extendedProps['tipo'] ? `Tipo: ${event.extendedProps['tipo']}` : ''
    ].filter(Boolean).join('<br>');

    element.setAttribute('data-tooltip', tooltipContent);
  }

  // ✅ CORREGIDO: Método mejorado para mostrar tooltip sin causar scroll
  showEventTooltip(info: any) {
    // Limpiar tooltip existente
    this.hideEventTooltip();

    const tooltip = document.createElement('div');
    tooltip.className = 'custom-tooltip';
    tooltip.innerHTML = info.el.getAttribute('data-tooltip') || '';

    // ✅ CORREGIDO: Añadir al body y posicionar correctamente
    document.body.appendChild(tooltip);

    const rect = info.el.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    // ✅ CORREGIDO: Posicionamiento mejorado para evitar scroll
    let left = rect.right + 10;
    let top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);

    // Verificar límites de la ventana
    if (left + tooltipRect.width > window.innerWidth) {
      left = rect.left - tooltipRect.width - 10;
    }
    if (top < 0) {
      top = 10;
    }
    if (top + tooltipRect.height > window.innerHeight) {
      top = window.innerHeight - tooltipRect.height - 10;
    }

    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';

    // ✅ CORREGIDO: Prevenir que el tooltip cause scroll
    tooltip.style.position = 'fixed';
    tooltip.style.zIndex = '10000';
  }

  // ✅ CORREGIDO: Método mejorado para ocultar tooltip
  hideEventTooltip() {
    const tooltips = document.querySelectorAll('.custom-tooltip');
    tooltips.forEach(tooltip => tooltip.remove());
  }

  handleEventClick(clickInfo: EventClickArg) {
    const overlappingEvents = this.getOverlappingEvents(clickInfo.event);

    if (overlappingEvents.length > 1) {
      this.showOverlappingEventsModal(overlappingEvents);
    } else {
      this.abrirModalDetalleHorario(clickInfo.event.extendedProps['horarioId']);
    }
  }

  getOverlappingEvents(event: any) {
    const eventStart = event.start;
    const eventEnd = event.end;

    if (!this.calendarOptions.events) {
      return [];
    }
    return (this.calendarOptions.events as any[]).filter((otherEvent: any) => {
      const otherStart = new Date(otherEvent.start);
      const otherEnd = new Date(otherEvent.end);

      return (eventStart < otherEnd && eventEnd > otherStart);
    });
  }

  showOverlappingEventsModal(events: any[]) {
    //console.log('Eventos superpuestos:', events);
  }



  // ✅ NUEVO: Método para configurar el calendario (llamar desde ngOnInit)
  setupCalendar() {
    this.calendarOptions = {
      ...this.calendarOptions,
      eventDidMount: (info) => this.setupEventDisplay(info),
    };
  }

  // ✅ CORREGIDO: Método para analizar densidad de eventos
  analyzeEventDensity() {
    const eventsByHour = new Map();

    if (this.calendarOptions.events) {
      (this.calendarOptions.events as any[]).forEach((event: any) => {
        const hour = new Date(event.start).getHours();
        const count = eventsByHour.get(hour) || 0;
        eventsByHour.set(hour, count + 1);
      });
    }

    const maxEventsPerHour = Math.max(...Array.from(eventsByHour.values()));

    if (maxEventsPerHour >= 8) {
      this.eventDensity = 'high';
      this.calendarOptions.slotDuration = '00:30:00';
      this.calendarOptions.eventMaxStack = 2;
    } else if (maxEventsPerHour >= 4) {
      this.eventDensity = 'medium';
      this.calendarOptions.slotDuration = '00:30:00';
      this.calendarOptions.eventMaxStack = 3;
    } else {
      this.eventDensity = 'low';
      this.calendarOptions.slotDuration = '00:30:00';
      this.calendarOptions.eventMaxStack = 4;
    }
  }


  // --- HORARIOS ---
  cargarDatosIniciales(): void {
    // Cargar períodos
    this.horariosService.obtenerPeriodos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.periodos = data;
          if (this.periodos.length > 0) {
            this.PeriodoSeleccionado = this.periodos[this.periodos.length - 1].ID_PERIODO;
            this.onPeriodoChange(this.PeriodoSeleccionado);
          }
        },
        error: (err) => this.handleError('Error al cargar períodos', err)
      });

    // Cargar aulas
    this.aulasService.obtenerAulas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.aulas = data,
        error: (err) => this.handleError('Error al cargar aulas', err)
      });

    // Cargar días
    this.horariosService.obtenerDias()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.dias = data,
        error: (err) => this.handleError('Error al cargar días', err)
      });

    this.cargarTodosLosHorarios();

    this.horariosService.obtenerCursos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.cursos = data,
        error: (err) => this.handleError('Error al cargar cursos', err)
      });
  }

  // Método optimizado para cargar horarios
  cargarTodosLosHorarios(): void {
    this.notificationService.showLoading('Cargando horarios...');

    // ✅ SOLUCIÓN: Forzar actualización del cache
    this.horariosService.obtenerTodosHorarios(true) // ✅ Pasar true para forzar refresh
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: HorarioDetalle[]) => {
          this.notificationService.hideLoading();


          this.todosLosHorarios = data;
          this.assignColorsToSchedules(data);

          if (this.PeriodoSeleccionado > 0) {
            this.filtrarHorariosPorPeriodo(this.PeriodoSeleccionado);
          } else {
            this.horariosFiltrados = [...this.todosLosHorarios];
            this.actualizarEventosCalendario();
          }
        },
        error: (err) => {
          this.notificationService.hideLoading();
          this.handleError('Error al cargar los horarios', err);
        }
      });
  }


  // Método optimizado para asignar colores
  private assignColorsToSchedules(horarios: HorarioDetalle[]): void {
    // Resetear colores para nueva carga
    this.colorManager.reset();

    // Obtener materias únicas y asignar colores
    const uniqueSubjects = new Set(horarios.map(h => h.asignatura.id));
    uniqueSubjects.forEach(subjectId => {
      this.colorManager.getColorForSubject(subjectId);
    });
  }

  // Filtrar horarios optimizado
  filtrarHorariosPorPeriodo(idPeriodo: number): void {
    // ✅ SOLUCIÓN: Forzar actualización del cache
    this.horariosService.obtenerHorariosPorPeriodoAgrupados(idPeriodo, true)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: HorarioDetalle[]) => {
          this.horariosFiltrados = data;
          this.actualizarEventosCalendario();
        },
        error: (err) => this.handleError('Error al filtrar horarios por periodo', err)
      });
  }
  private combinarFechaHora(fecha: string, hora: string): string {
    const fechaObj = new Date(fecha);
    const [horas, minutos] = hora.split(':');
    fechaObj.setHours(parseInt(horas), parseInt(minutos), 0, 0);
    return fechaObj.toISOString();
  }

  // Actualización de eventos optimizada
  actualizarEventosCalendario(): void {
    // Filtrar horarios incompletos para evitar errores de acceso a propiedades nulas
    const eventos: EventInput[] = this.horariosFiltrados
      .filter(horario =>
        horario &&
        horario.curso &&
        horario.asignatura &&
        horario.aula &&
        horario.docente &&
        horario.dia &&
        horario.fechaInicio &&
        horario.fechaFin &&
        horario.horaInicio &&
        horario.horaFin &&
        horario.carrera &&
        typeof horario.curso.nombre !== 'undefined' &&
        typeof horario.asignatura.nombre !== 'undefined' &&
        typeof horario.aula.nombre !== 'undefined' &&
        typeof horario.docente.nombre !== 'undefined' &&
        typeof horario.dia.id !== 'undefined' &&
        typeof horario.carrera.nombre !== 'undefined'
      )
      .map(horario => {
        const fechaInicio = new Date(horario.fechaInicio);
        const fechaFin = new Date(horario.fechaFin);
        fechaFin.setDate(fechaFin.getDate() + 1);
        let cursoNombre: string = horario.curso.nombre;
        return {
          id: `horario-${horario.id}`,
          title: `${horario.asignatura.nombre}\n${horario.aula.nombre}\n${horario.docente.nombre}`,
          daysOfWeek: [this.convertirDiaAFullCalendar(horario.dia.id)],
          startTime: horario.horaInicio,
          endTime: horario.horaFin,
          startRecur: fechaInicio,
          endRecur: fechaFin,
          extendedProps: {
            horarioId: horario.id,
            asignaturaId: horario.asignatura.id,
            docente: horario.docente.nombre,
            aula: horario.aula.nombre,
            carrera: horario.carrera.nombre,
            curso: cursoNombre,
            tipoClase: horario.tipoClase || 'REGULAR',
            cursosArticulados: horario.curso.cursos || null
          }
        };
      });

    this.ngZone.run(() => {
      // ✅ SOLUCIÓN: Siempre actualizar calendarOptions.events para asegurar consistencia
        this.calendarOptions = {
          ...this.calendarOptions,
        events: eventos
      };

      // Si el calendario ya está inicializado, también actualizar directamente
      if (this.calendarApi) {
        this.calendarApi.removeAllEvents();
        eventos.forEach(evento => this.calendarApi!.addEvent(evento));
      }

      // Forzar detección de cambios para asegurar actualización visual
      this.cdr.detectChanges();
    });
  }

  // Inserción rápida de un solo evento (por ejemplo, tras asignar un horario)
  agregarEventoAlCalendario(horario: HorarioDetalle): void {
    if (!this.calendarApi) return;
    const eventoId = `horario-${horario.id}`;
    // Elimina el evento anterior si existe para evitar duplicados
    const eventoExistente = this.calendarApi.getEventById(eventoId);
    if (eventoExistente) {
      eventoExistente.remove();
    }
    const fechaInicio = new Date(horario.fechaInicio);
    const fechaFin = new Date(horario.fechaFin);
    fechaFin.setDate(fechaFin.getDate() + 1);
    let cursoNombre: string = horario.curso.nombre;
    const evento: EventInput = {
      id: eventoId,
      title: `${horario.asignatura.nombre}\n${horario.aula.nombre}\n${horario.docente.nombre}`,
      daysOfWeek: [this.convertirDiaAFullCalendar(horario.dia.id)],
      startTime: horario.horaInicio,
      endTime: horario.horaFin,
      startRecur: fechaInicio,
      endRecur: fechaFin,
      extendedProps: {
        horarioId: horario.id,
        asignaturaId: horario.asignatura.id,
        docente: horario.docente.nombre,
        aula: horario.aula.nombre,
        carrera: horario.carrera.nombre,
        curso: cursoNombre,
        tipoClase: horario.tipoClase || 'REGULAR',
        cursosArticulados: horario.curso.cursos || null
          }
        };
    this.calendarApi.addEvent(evento);
    // No llamar a refetchEvents aquí para evitar duplicados visuales
  }

  // Manejo centralizado de errores
  private handleError(message: string, error: any): void {
    console.error(message, error);
    this.mensajeError = message;
    this.notificationService?.showError?.(message);
  }

  // Conversión de día optimizada
  convertirDiaAFullCalendar(diaId: number): number {
    return diaId === 7 ? 0 : diaId;
  }


  // Handlers de cambio optimizados
  onPeriodoChange(idPeriodo: number): void {
    // Limpiar datos y encabezados de reporte
    this.horariosFiltrados = [];
    this.todosLosHorarios = [];
    this.nombreCarreraReporte = '';
    this.nombreDocenteReporte = '';

    // ✅ SOLUCIÓN: Limpiar explícitamente el calendario al cambiar periodo
    this.ngZone.run(() => {
      if (this.calendarApi) {
        this.calendarApi.removeAllEvents();
      }
      this.calendarOptions = {
        ...this.calendarOptions,
        events: []
      };
      this.cdr.detectChanges();
    });

    this.PeriodoSeleccionado = idPeriodo;
    this.resetSelections();
    this.limpiarFormulario();

    this.horariosService.obtenerCarrerasPeriodo(idPeriodo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.carreras = data,
        error: (err) => this.handleError('Error al cargar carreras', err)
      });

    this.horariosService.obtenerCarrerasPeriodoArticulado(idPeriodo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.carrerasArticuladas = data,
        error: (err) => this.handleError('Error al cargar carreras', err)
      });

    this.horariosService.obtenerDocentePeriodo(idPeriodo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.docentes = data;
        },
        error: (err) => this.handleError('Error al cargar docentes', err)
      });

    this.filtrarHorariosPorPeriodo(idPeriodo);
  }

  onCarreraChange(idCarrera: number): void {
    // Limpiar encabezados de reporte relacionados
    this.nombreCarreraReporte = '';
    this.nombreDocenteReporte = '';

    this.CarreraSeleccionada = idCarrera;
    this.resetSelections();

    if (this.PeriodoSeleccionado > 0 && idCarrera > 0) {
      this.horariosService.obtenerDocenteAsignaturaNivel(this.PeriodoSeleccionado, idCarrera)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data) => this.docenteAsignaturaNivel = data,
          error: (err) => this.handleError('Error al cargar combinaciones', err)
        });
    }
  }

  // Búsqueda personalizada optimizada
  customSearchFn = (term: string, item: any): boolean => {
    if (!term) return true;

    const searchTerm = term.toLowerCase();
    return item.DOCENTE?.toLowerCase().includes(searchTerm) ||
      item.ASIGNATURA?.toLowerCase().includes(searchTerm) ||
      item.NIVEL?.toLowerCase().includes(searchTerm);
  };



  // Manejo de combinación optimizado
  onCombinacionChange(combinacion: any): void {
    this.resetCombinationSelections();

    if (!combinacion || combinacion === this.DEFAULT_COMBINATION) {
      return;
    }

    if (typeof combinacion === 'object') {
      this.setSelectionFromObject(combinacion);
    } else if (typeof combinacion === 'string') {
      this.setSelectionFromString(combinacion);
    }
  }

  private setSelectionFromObject(combinacion: any): void {
    this.DocenteSeleccionado = Number(combinacion.ID_DOCENTE) || 0;
    this.AsignaturaSeleccionada = Number(combinacion.ID_ASIGNATURA) || 0;
    this.NivelSeleccionado = Number(combinacion.ID_CURSOS) || 0;
  }

  private setSelectionFromString(combinacion: string): void {
    const ids = combinacion.split('-');
    if (ids.length === 3) {
      this.DocenteSeleccionado = Number(ids[0]) || 0;
      this.AsignaturaSeleccionada = Number(ids[1]) || 0;
      this.NivelSeleccionado = Number(ids[2]) || 0;
    }
  }

  private resetCombinationSelections(): void {
    this.DocenteSeleccionado = this.DEFAULT_SELECTION;
    this.AsignaturaSeleccionada = this.DEFAULT_SELECTION;
    this.NivelSeleccionado = this.DEFAULT_SELECTION;
  }

  private resetSelections(): void {
    this.CombinacionSeleccionada = this.DEFAULT_COMBINATION;
    this.resetCombinationSelections();
    this.docenteAsignaturaNivel = [];
  }

  // Asignar horario optimizado
  asignarHorario(): void {
    if (!this.validateHorarioData()) {
      this.notificationService.showWarningReport(
        'Datos incompletos',
        'Por favor, completa todos los campos requeridos antes de asignar el horario.',
        'Entendido'
      );
      return;
    }

    const horarioData = this.buildHorarioData();
    this.notificationService.showLoading('Asignando horario...');

    this.horariosService.asignarHorario(horarioData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: HorarioResponse) => {
          this.notificationService.hideLoading();

          if (res.id) {
            this.notificationService.showSuccessReport(
              'Horario asignado',
              'El horario se asignó correctamente.',
              'Continuar'
            );

            // Buscar el detalle del nuevo horario y agregarlo directamente
            this.horariosService.obtenerDetalleHorario(res.id)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (detalle: HorarioDetalle) => {
                  this.todosLosHorarios = [...this.todosLosHorarios, detalle];
                  this.horariosFiltrados = [...this.horariosFiltrados, detalle];
                  this.assignColorsToSchedules(this.todosLosHorarios);

                  // ✅ SOLUCIÓN: Forzar actualización completa del calendario
                  // Esto asegura que el evento aparezca inmediatamente, incluso si es el primero
                  setTimeout(() => {
                    this.actualizarEventosCalendario();
                    this.cdr.detectChanges();
                  }, 100);
                },
                error: () => {
                  // Si falla, recarga todo como fallback
                  this.cargarTodosLosHorarios();
                }
              });

            this.limpiarFormulario();
            this.isAccordionOpen = false;
          }
        },
        error: (err) => {
          this.notificationService.hideLoading();
          let mensaje = 'Error desconocido al asignar el horario';

          if (err.error?.output?.payload?.message) {
            mensaje = err.error.output.payload.message;
          } else if (err.error?.message) {
            mensaje = err.error.message;
          } else if (err.message) {
            mensaje = err.message;
          }

          this.notificationService.showErrorReport('Error', mensaje, 'Cerrar');
        }
      });
  }



  private validateHorarioData(): boolean {

    // Forzar actualización de valores si hay selección individual
    if (this.tipoClaseSeleccionado === 'regular' && this.DocenteAsignaturaSeleccionada) {
      if (this.DocenteSeleccionado === 0) {
        this.DocenteSeleccionado = this.DocenteAsignaturaSeleccionada.ID_DOCENTE;
      }
      if (this.AsignaturaSeleccionada === 0) {
        this.AsignaturaSeleccionada = this.DocenteAsignaturaSeleccionada.ID_ASIGNATURA;
      }
    }

    // Validar campos básicos
    if (!this.PeriodoSeleccionado || this.PeriodoSeleccionado <= 0) {
      this.mensajeError = 'Debe seleccionar un periodo';
      return false;
    }
    if (!this.DiaSeleccionado || this.DiaSeleccionado <= 0) {
      this.mensajeError = 'Debe seleccionar un día';
      return false;
    }
    if (!this.AulaSeleccionada || this.AulaSeleccionada <= 0) {
      this.mensajeError = 'Debe seleccionar un aula';
      return false;
    }
    if (!this.horaInicio || !this.horaFin) {
      this.mensajeError = 'Debe completar los horarios';
      return false;
    }
    if (!this.fechaInicio || !this.fechaFin) {
      this.mensajeError = 'Debe completar las fechas';
      return false;
    }

    // Validación específica para tipo de clase
    if (this.tipoClaseSeleccionado === 'regular') {
      if (!this.CarreraSeleccionada || this.CarreraSeleccionada <= 0) {
        this.mensajeError = 'Debe seleccionar una carrera';
        return false;
      }
      if (!this.NivelSeleccionado || this.NivelSeleccionado <= 0) {
        this.mensajeError = 'Debe seleccionar un nivel/curso';
        return false;
      }
      if (!this.DocenteSeleccionado || this.DocenteSeleccionado <= 0) {
        this.mensajeError = 'Debe seleccionar un docente';
        return false;
      }
      if (!this.AsignaturaSeleccionada || this.AsignaturaSeleccionada <= 0) {
        this.mensajeError = 'Debe seleccionar una asignatura';
        return false;
      }
      return true;
    } else if (this.tipoClaseSeleccionado === 'articulada') {
      if (!this.cursosArticulados || this.cursosArticulados.length === 0) {
        this.mensajeError = 'Debe agregar al menos un curso articulado';
        return false;
      }
      if (!this.DocenteSeleccionado || this.DocenteSeleccionado <= 0) {
        this.mensajeError = 'Debe seleccionar un docente';
        return false;
      }
      if (!this.AsignaturaSeleccionada || this.AsignaturaSeleccionada <= 0) {
        this.mensajeError = 'Debe seleccionar una asignatura';
        return false;
      }
      return true;
    }

    this.mensajeError = 'Debe seleccionar un tipo de clase válido';
    return false;
  }

  private buildHorarioData(): any {
    let horarioData: any = {
      ID_PERIODO: this.PeriodoSeleccionado,
      ID_DOCENTE: this.DocenteSeleccionado,
      ID_ASIGNATURA: this.AsignaturaSeleccionada,
      ID_DIA: this.DiaSeleccionado,
      ID_AULA: this.AulaSeleccionada,
      HORA_INICIO: this.horaInicio,
      HORA_FIN: this.horaFin,
      FECHA_INICIO: this.fechaInicio,
      FECHA_FIN: this.fechaFin
    };

    if (this.tipoClaseSeleccionado === 'regular') {
      horarioData.ID_CARRERAS = this.CarreraSeleccionada;
      horarioData.ID_CURSOS = this.NivelSeleccionado;
    } else if (this.tipoClaseSeleccionado === 'articulada') {
      horarioData.cursosArticulados = this.cursosArticulados;
    }

    return horarioData;
  }

  // Limpiar formulario
  limpiarFormulario(): void {
    this.AulaSeleccionada = this.DEFAULT_SELECTION;
    this.DiaSeleccionado = this.DEFAULT_SELECTION;
    this.cursosArticulados = [];
    this.CarreraSeleccionada = this.DEFAULT_SELECTION;
    this.DocenteAsignaturaSeleccionada = null;
    this.docentes = [];
    this.DocenteSeleccionado = 0;
  }

  // Obtener detalle de horario
  obtenerDetalleHorario(idHorario: number): void {
    this.horariosService.obtenerDetalleHorario(idHorario)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detalle: HorarioDetalle) => {
          detalle.id = idHorario;

          // ✅ SOLUCIÓN: Verificar si ya existe antes de agregar
          const existeIndex = this.todosLosHorarios.findIndex(h => h.id === idHorario);
          if (existeIndex >= 0) {
            this.todosLosHorarios[existeIndex] = detalle;
          } else {
            this.todosLosHorarios = [...this.todosLosHorarios, detalle];
          }

          if (this.PeriodoSeleccionado > 0) {
            const existeFiltradoIndex = this.horariosFiltrados.findIndex(h => h.id === idHorario);
            if (existeFiltradoIndex >= 0) {
              this.horariosFiltrados[existeFiltradoIndex] = detalle;
            } else {
              this.horariosFiltrados = [...this.horariosFiltrados, detalle];
            }

            this.colorManager.getColorForSubject(detalle.asignatura.id);
            this.actualizarEventosCalendario();
          }
        },
        error: (err) => this.handleError('Error al obtener el detalle del horario', err)
      });
  }

  // Formatear hora optimizado
  formatHora = (hora: string): string => {
    return hora ? hora.substring(0, 5) : '';
  };

  // Formatear fecha optimizado
  formatFecha = (fecha: string): string => {
    return fecha ? fecha.split('T')[0] : '';
  };

  // Getter optimizado para materias únicas
  get materiasUnicas(): Array<{ id: number, nombre: string, color: string }> {
    const materiasMap = new Map<number, { id: number, nombre: string, color: string }>();

    this.horariosFiltrados.forEach(horario => {
      const id = horario.asignatura.id;
      if (!materiasMap.has(id)) {
        materiasMap.set(id, {
          id: id,
          nombre: horario.asignatura.nombre,
          color: this.colorManager.getColorForSubject(id)
        });
      }
    });

    return Array.from(materiasMap.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  // MÉTODOS PARA EL MODAL (continuarían igual pero con optimizaciones similares)

  abrirModalDetalleHorario(horarioId: number): void {

    const horario = this.horariosFiltrados.find(h => h.id === horarioId);

    if (horario) {
      this.horarioSeleccionado = { ...horario };
      this.modoEdicion = false;
      this.editHoraInicio = this.formatHora(horario.horaInicio);
      this.editHoraFin = this.formatHora(horario.horaFin);
      this.editAulaSeleccionada = horario.aula.id;
      this.editDiaSeleccionado = horario.dia.id;
      this.editFechaFin = this.formatFecha(horario.fechaFin);
      this.editFechaInicio = this.formatFecha(horario.fechaInicio);
      this.editDocenteSeleccionado = Number(horario.docente.id);
      this.onEditModalOpen(horario.docente.id);

      // ✅ NUEVO: Guardar docente original y resetear observación
      this.docenteOriginal = Number(horario.docente.id);
      this.mostrarObservacion = false;
      this.observacion = '';
      if (!horario.tipoClase) {
        if (horario.curso.cursos && horario.curso.cursos.length > 0) {
          this.horarioSeleccionado.tipoClase = 'articulada';
        } else {
          this.horarioSeleccionado.tipoClase = 'regular';
        }
      }

      this.modalVisible = true;
    }
  }


  cerrarModal(): void {
    this.modalVisible = false;
    this.horarioSeleccionado = null;
    this.modoEdicion = false;
    this.mensajeModal = '';
    this.tipoMensajeModal = '';
  }

  activarModoEdicion(): void {
    this.modoEdicion = true;
    this.mensajeModal = '';
    this.tipoMensajeModal = '';

    // ✅ SOLUCIÓN: Cerrar el dropdown del select de docente al activar modo edición
    this.isDropdownOpen = false;
    this.initializeSelectedDocente();
  }

  cancelarEdicion(): void {
    if (this.horarioSeleccionado) {
      this.editDocenteSeleccionado = this.horarioSeleccionado.docente.id;
      this.editHoraInicio = this.formatHora(this.horarioSeleccionado.horaInicio);
      this.editHoraFin = this.formatHora(this.horarioSeleccionado.horaFin);
      this.editAulaSeleccionada = this.horarioSeleccionado.aula.id;
      this.editDiaSeleccionado = this.horarioSeleccionado.dia.id;
      this.editFechaFin = this.formatFecha(this.horarioSeleccionado.fechaFin);
      this.editFechaInicio = this.formatFecha(this.horarioSeleccionado.fechaInicio);

      // ✅ NUEVO: Resetear observación
      this.mostrarObservacion = false;
      this.observacion = '';
    }

    this.modoEdicion = false;
    this.mensajeModal = '';
    this.tipoMensajeModal = '';
  }

  // Los métodos restantes del modal continuarían con la misma lógica pero aplicando
  // las mismas optimizaciones de manejo de errores y subscripciones

  // Guarda los cambios en un horario
  guardarCambiosHorario(): void {
    if (!this.horarioSeleccionado || !this.horarioSeleccionado.id) {
      this.notificationService.showErrorReport(
        'Error',
        'No se puede actualizar el horario',
        'Cerrar'
      );
      return;
    }

    if (this.mostrarObservacion && this.observacion.trim().length < 10) {
      this.notificationService.showErrorReport(
        'Error',
        'La observación debe tener al menos 10 caracteres.',
        'Cerrar'
      );
      this.mostrarErrorObservacion = true;
      return;
    }

    // Comprobar si los valores son válidos antes de enviar
    if (!this.editAulaSeleccionada || !this.editDiaSeleccionado) {
      this.notificationService.showErrorReport(
        'Error',
        'Debe seleccionar un aula y un día válidos',
        'Cerrar'
      );
      return;
    }

    // Formatea la hora al formato HH:MM:SS
    const formatearHora = (hora: string): string => {
      if (!hora) return '';
      if (/^\d{2}:\d{2}:\d{2}$/.test(hora)) return hora;
      if (/^\d{2}:\d{2}$/.test(hora)) return `${hora}:00`;
      return hora;
    };

    // Validar que tengamos horas válidas
    if (!this.editHoraInicio || !this.editHoraFin) {
      this.notificationService.showErrorReport(
        'Error',
        'Debe proporcionar horarios válidos',
        'Cerrar'
      );
      return;
    }

    // Convertir los IDs a números para asegurar que sean del tipo correcto
    const aulaId = Number(this.editAulaSeleccionada);
    const diaId = Number(this.editDiaSeleccionado);
    const docenteId = Number(this.editDocenteSeleccionado);


    const aulaSeleccionada = this.aulas.find(a => Number(a.ID_AULA) === aulaId);
    const diaSeleccionado = this.dias.find(d => Number(d.ID_DIA) === diaId);

    // Verificar si encontramos el aula y el día antes de continuar
    if (!aulaSeleccionada || !diaSeleccionado) {
      this.notificationService.showErrorReport(
        'Error',
        'No se pudo encontrar el aula o el día seleccionado',
        'Cerrar'
      );
      return;
    }

    // ✅ CORRECCIÓN: Construir datos según el tipo de horario
    let horarioActualizado: any = {
      ID_HORARIO: Number(this.horarioSeleccionado.id),
      ID_PERIODO: this.PeriodoSeleccionado,
      ID_DOCENTE: docenteId,
      ID_ASIGNATURA: this.horarioSeleccionado.asignatura.id,
      ID_AULA: aulaId,
      ID_DIA: diaId,
      HORA_INICIO: this.formatHora(this.editHoraInicio),
      HORA_FIN: this.formatHora(this.editHoraFin),
      FECHA_INICIO: this.formatFecha(this.editFechaInicio),
      FECHA_FIN: this.formatFecha(this.editFechaFin),
    };
    if (this.mostrarObservacion && this.observacion.trim()) {
      horarioActualizado.observacion = this.observacion.trim();
    }

    // ✅ CORRECCIÓN: Preservar el tipo de horario original
    if (this.horarioSeleccionado.tipoClase === 'ARTICULADA' ||
      (this.horarioSeleccionado.carrera.carreras && this.horarioSeleccionado.carrera.carreras.length > 0)) {
      // Es un horario articulado - preservar los cursos articulados CORRECTAMENTE
      horarioActualizado.cursosArticulados = this.horarioSeleccionado.carrera.carreras?.map(carrera => ({
        ID_CURSOS: this.horarioSeleccionado!.curso.id,        // ✅ Usar ! para asegurar que no es null
        ID_CARRERAS: carrera.id,                             // ✅ ID de cada carrera (4, 5)
        ID_ASIGNATURA: this.horarioSeleccionado!.asignatura.id // ✅ Usar ! para asegurar que no es null
      })) || [];

    } else {
      // Es un horario regular - enviar carrera y curso individuales
      horarioActualizado.ID_CARRERAS = this.horarioSeleccionado!.carrera.id;
      horarioActualizado.ID_CURSOS = this.horarioSeleccionado!.curso.id;
    }

    // Mostrar loading
    this.notificationService.showLoading('Actualizando horario...');

    this.horariosService.actualizarHorario(horarioActualizado).subscribe({
      next: (response) => {
        this.notificationService.hideLoading();

        if (!this.horarioSeleccionado?.docente) {
          this.notificationService.showErrorReport(
            'Error',
            'El docente no está definido',
            'Cerrar'
          );
          return;
        }

        // ...dentro de guardarCambiosHorario()...
        const horarioDetalleActualizado: HorarioDetalle = {
          ...this.horarioSeleccionado,
          horaInicio: formatearHora(this.editHoraInicio),
          horaFin: formatearHora(this.editHoraFin),
          fechaInicio: this.editFechaInicio,
          fechaFin: this.editFechaFin,
          aula: {
            id: aulaId,
            nombre: aulaSeleccionada.NOMBRE_AULA
          },
          dia: {
            id: diaId,
            nombre: diaSeleccionado.NOMBRE_DIA
          },
          // ✅ FORZAR el tipo de clase según la estructura
          tipoClase: (this.horarioSeleccionado.carrera.carreras && this.horarioSeleccionado.carrera.carreras.length > 0)
            ? 'ARTICULADA'  // ✅ Usar el mismo formato que viene del backend
            : 'regular',
          // ✅ NO sobrescribir curso ni carrera para articulados
          curso: this.horarioSeleccionado.curso,
          carrera: this.horarioSeleccionado.carrera
        };

        this.ngZone.run(() => {
          this.actualizarHorarioEnListas(horarioDetalleActualizado);

          // Mostrar mensaje de éxito
          this.notificationService.showSuccess(
            response.mensaje || 'Horario actualizado correctamente'
          );

          this.modoEdicion = false;

          // Esperar a que el modal se actualice antes de cerrar
          setTimeout(() => {
            this.cerrarModal();
            // Forzar una actualización completa del calendario
            this.cargarTodosLosHorarios();
          }, 1500);
        });
      },
      error: (error) => {
        this.notificationService.hideLoading();
        console.error('Error en la actualización:', error);

        let mensajeError = 'Error al actualizar el horario';

        // Manejo específico de errores del backend
        if (error.status === 403 && error.error && error.error.message) {
          mensajeError = error.error.message;
        } else if (error.status === 404 && error.error && error.error.message) {
          mensajeError = error.error.message;
        } else if (error.status === 409 && error.error && error.error.message) {
          mensajeError = error.error.message;
        } else if (error.error) {
          if (error.error.message) {
            mensajeError = error.error.message;
          } else if (typeof error.error === 'string') {
            mensajeError = error.error;
          }
        } else if (error.message) {
          mensajeError = error.message;
        }

        this.notificationService.showErrorReport(
          'Error',
          mensajeError,
          'Cerrar'
        );
      }
    });
  }

  // Actualiza el horario en todas las listas
  private actualizarHorarioEnListas(horarioActualizado: HorarioDetalle): void {
    // ✅ SOLUCIÓN: Mejorar la actualización de listas
    const actualizarLista = (lista: HorarioDetalle[]) =>
      lista.map(h => h.id === horarioActualizado.id ? horarioActualizado : h);

    this.horariosFiltrados = actualizarLista(this.horariosFiltrados);
    this.todosLosHorarios = actualizarLista(this.todosLosHorarios);
    this.horarioSeleccionado = horarioActualizado;

    this.ngZone.run(() => {
      if (this.calendarApi) {
        const eventoId = `horario-${horarioActualizado.id}`;
        const eventoExistente = this.calendarApi.getEventById(eventoId);
        if (eventoExistente) {
          eventoExistente.remove();
        }
        let cursoNombre: string;
        if (horarioActualizado.curso.cursos && horarioActualizado.curso.cursos.length > 0) {
          cursoNombre = horarioActualizado.curso.nombre;
        } else {
          cursoNombre = horarioActualizado.curso.nombre;
        }
        const nuevoEvento = {
          id: eventoId,
          title: `${horarioActualizado.asignatura.nombre}\n${horarioActualizado.aula.nombre}\n${cursoNombre}`,
          startTime: horarioActualizado.horaInicio,
          endTime: horarioActualizado.horaFin,
          daysOfWeek: [this.convertirDiaAFullCalendar(horarioActualizado.dia.id)],
          extendedProps: {
            horarioId: horarioActualizado.id,
            asignaturaId: horarioActualizado.asignatura.id,
            docente: horarioActualizado.docente.nombre,
            aula: horarioActualizado.aula.nombre,
            carrera: horarioActualizado.carrera.nombre,
            curso: cursoNombre,
            tipoClase: horarioActualizado.tipoClase || 'REGULAR',
            cursosArticulados: horarioActualizado.curso.cursos || null
          }
        };
        this.calendarApi.addEvent(nuevoEvento);
        // No llamar a refetchEvents aquí para evitar duplicados visuales
      } else {
        this.actualizarEventosCalendario();
      }

      this.cdr.detectChanges();
    });
  }

  // Elimina un horario
  eliminarHorario(): void {
    if (!this.horarioSeleccionado || !this.horarioSeleccionado.id) {
      this.notificationService.showWarningReport(
        'Selección requerida',
        'No se puede eliminar el horario porque no se ha seleccionado ninguno.',
        'Entendido'
      );
      return;
    }

    this.notificationService.showConfirm(
      '¿Estás seguro?',
      'Esta acción eliminará el horario y no se puede deshacer.',
      'Sí, eliminar',
      'Cancelar'
    ).then((confirmado: boolean) => {
      if (confirmado) {
        this.notificationService.showLoading('Eliminando horario...');

        this.horariosService.eliminarHorario(this.horarioSeleccionado!.id!).subscribe({
          next: () => {
            const horarioId = this.horarioSeleccionado?.id;

            if (horarioId) {
              this.horariosFiltrados = this.horariosFiltrados.filter(h => h.id !== horarioId);
              this.todosLosHorarios = this.todosLosHorarios.filter(h => h.id !== horarioId);
              this.actualizarEventosCalendario();
              this.cerrarModal();

              this.notificationService.showSuccess(
                'Horario eliminado correctamente.'
              );
            }

            this.notificationService.hideLoading();
          },
          error: (err) => {
            this.notificationService.hideLoading();

            let mensaje = 'Error al eliminar el horario';
            if (err.error?.output?.payload?.message) {
              mensaje = err.error.output.payload.message;
            } else if (err.error?.message) {
              mensaje = err.error.message;
            } else if (err.message) {
              mensaje = err.message;
            }

            this.notificationService.showErrorReport('Error', mensaje, 'Cerrar');
          }
        });
      }
    });
  }

  //metodos para clases articuladas y regulares
  onTipoClaseChange(tipo: string) {
    this.tipoClaseSeleccionado = tipo;

    if (tipo === 'articulada') {
      this.CarreraSeleccionada = this.DEFAULT_SELECTION;
      this.cursosArticulados = [];
    } else {
      this.cursosArticulados = [];
      this.nuevaCarreraArticulada = null;
      this.nuevoCursoArticulado = null;
    }

  }

  onNuevaCarreraArticuladaChange(carreraId: number | null) {
    this.nuevaCarreraArticulada = carreraId;
    this.nuevoCursoArticulado = 0;

    if (carreraId) {
      this.cursosDisponibles = this.cursos;
    } else {
      this.cursosDisponibles = [];
    }
  }

  agregarCursoArticulado() {
    if (this.nuevaCarreraArticulada && this.nuevoCursoArticulado) {
      const yaExiste = this.cursosArticulados.some(curso =>
        curso.ID_CARRERAS === this.nuevaCarreraArticulada &&
        curso.ID_CURSOS === this.nuevoCursoArticulado
      );

      if (!yaExiste) {
        // Buscar los objetos completos para obtener los nombres
        const carreraSeleccionada = this.carrerasArticuladas.find(c => c.ID_CARRERAS === this.nuevaCarreraArticulada);
        const cursoSeleccionado = this.cursosDisponibles.find(c => c.ID_CURSOS === this.nuevoCursoArticulado);

        this.cursosArticulados = [
          ...this.cursosArticulados,
          {
          ID_CARRERAS: this.nuevaCarreraArticulada,
          ID_CURSOS: this.nuevoCursoArticulado,
          NOMBRE_CARRERAS: carreraSeleccionada?.NOMBRE_CARRERAS || 'Sin nombre',
          NOMBRE_CURSOS: cursoSeleccionado?.NOMBRE_CURSOS || 'Sin nombre'
          }
        ];

        this.nuevaCarreraArticulada = null;
        this.nuevoCursoArticulado = null;
        this.cursosDisponibles = [];
        this.cdr.detectChanges();
      } else {
        this.notificationService.showWarning('Esta combinación ya está agregada');
      }
    }
  }

  eliminarCursoArticulado(index: number) {
    this.cursosArticulados.splice(index, 1);
  }

  getCarreraNombre(carreraId: number): string {
    const carrera = this.carrerasArticuladas.find(c => c.ID_CARRERAS === carreraId);
    return carrera ? carrera.NOMBRE_CARRERAS : 'N/A';
  }

  getCursoNombre(cursoId: number): string {
    const curso = this.cursos.find(c => c.ID_CURSOS === cursoId);
    return curso ? curso.NOMBRE_CURSOS : 'N/A';
  }

  cargarDocenteAsignaturaNivel() {
    if (this.PeriodoSeleccionado > 0) {
      let parametros: any = {
        periodo: this.PeriodoSeleccionado
      };

      if (this.tipoClaseSeleccionado === 'regular' && this.CarreraSeleccionada > 0) {
        parametros.carrera = this.CarreraSeleccionada;
      } else if (this.tipoClaseSeleccionado === 'articulada' && this.cursosArticulados.length > 0) {
        parametros.cursosArticulados = this.cursosArticulados;
      }

      this.horariosService.obtenerDocenteAsignaturaNivel(this.PeriodoSeleccionado, parametros.carrera || null)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data) => this.docenteAsignaturaNivel = data,
          error: (err) => this.handleError('Error al cargar combinaciones', err)
        });
    }
  }

  // Tipo/Interfaz
  DocenteAsignaturaSeleccionada: {
    ID_DOCENTE: number;
    DOCENTE: string;
    ID_ASIGNATURA: number;
    ASIGNATURA: string;
  } | null = null;



  // Método para cargar datos (reemplaza tu método actual)
  cargarDocentesConAsignaturas(idPeriodo: number) {
    this.horariosService.obtenerDocentePeriodo(idPeriodo).subscribe({
      next: (data) => {
        // Tu JSON ya viene con la estructura correcta
        this.docentes = data;
      },
      error: (error) => {

      }
    });
  }

  // Método cuando cambia la selección
  onDocenteAsignaturaChange(seleccionado: any) {
    if (seleccionado) {
      this.DocenteSeleccionado = seleccionado.ID_DOCENTE;
      this.AsignaturaSeleccionada = seleccionado.ID_ASIGNATURA;
    }
  }

  // Devuelve una lista de docentes únicos (por ID) para evitar duplicados en el select
  // En tu componente
  get docentesUnicos() {
    const lista = this.docentes
      .map(docente => ({
        ...docente,
        ID_DOCENTE: Number(docente.ID_DOCENTE)
      }))
      .filter((docente, index, self) =>
        index === self.findIndex(d => d.ID_DOCENTE === docente.ID_DOCENTE)
      );
    return lista;
  }

  onDocenteEditChange(nuevoDocenteId: any): void {
    const nuevoDocente = Number(nuevoDocenteId);
    const docenteOriginal = Number(this.docenteOriginal);

    this.editDocenteSeleccionado = nuevoDocente;

    if (nuevoDocente !== docenteOriginal) {
      this.mostrarObservacion = true;
      // Resetear error cuando se muestra el campo
      this.mostrarErrorObservacion = false;
    } else {
      this.mostrarObservacion = false;
      this.observacion = '';
      this.mostrarErrorObservacion = false;
    }
  }
  mostrarErrorObservacion: boolean = false;

  validarObservacion(): boolean {
    if (this.mostrarObservacion) {
      const observacionValida = !!(this.observacion && this.observacion.trim().length > 0);
      this.mostrarErrorObservacion = !observacionValida;
      return observacionValida;
    }
    this.mostrarErrorObservacion = false;
    return true;
  }

  toggleDropdown(show: boolean) {
    this.isDropdownOpen = show;
    if (show) {
      // Cuando se abre, limpiar el término de búsqueda para permitir búsqueda
      this.searchTerm = '';
      this.docentesFiltrados = [...this.docentesUnicos];
    } else {
      // Cuando se cierra, mostrar el docente seleccionado
      if (this.selectedDocente) {
        this.searchTerm = this.selectedDocente.DOCENTE;
      } else {
        this.searchTerm = '';
      }
    }
  }
  onInputFocus() {
    // ✅ SOLUCIÓN: Solo abrir el dropdown si no está en modo edición o si el usuario hace click explícitamente
    if (!this.modoEdicion) {
      this.toggleDropdown(true);
      // Limpiar el campo para permitir búsqueda
      this.searchTerm = '';
      this.docentesFiltrados = [...this.docentesUnicos];
    }
  }
  onSearchChange() {
    if (!this.searchTerm.trim()) {
      this.docentesFiltrados = [...this.docentesUnicos];
    } else {
      this.docentesFiltrados = this.docentesUnicos.filter(docente =>
        docente.DOCENTE.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  // Seleccionar un docente
  selectDocente(docente: any) {
    this.selectedDocente = docente;
    this.editDocenteSeleccionado = docente?.ID_DOCENTE || null;
    this.searchTerm = docente?.DOCENTE || '';
    this.isDropdownOpen = false;

    // Llamar a tu función existente si es necesario
    if (this.onDocenteEditChange) {
      this.onDocenteEditChange(this.editDocenteSeleccionado);
    }
  }
  initializeSelectedDocente() {
    // ✅ SOLUCIÓN: Asegurar que el dropdown esté cerrado
    this.isDropdownOpen = false;

    if (this.editDocenteSeleccionado) {
      this.selectedDocente = this.docentesUnicos.find(
        d => d.ID_DOCENTE === this.editDocenteSeleccionado
      );
      this.searchTerm = this.selectedDocente?.DOCENTE || '';
    } else {
      this.selectedDocente = null;
      this.searchTerm = '';
    }
    this.docentesFiltrados = [...this.docentesUnicos];
  }
  onInputBlur() {
    // Pequeño delay para permitir que el click en una opción funcione
    setTimeout(() => {
      if (!this.isDropdownOpen) {
        this.searchTerm = this.selectedDocente?.DOCENTE || '';
      }
    }, 200);
  }
  onEditModalOpen(docenteId: any) {
    this.editDocenteSeleccionado = docenteId;
    if (!this.docentes || this.docentes.length === 0) {
      if (this.PeriodoSeleccionado > 0) {
        this.horariosService.obtenerDocentePeriodo(this.PeriodoSeleccionado).subscribe({
          next: (data) => {
            this.docentes = data;
            this.initializeSelectedDocente();
          },
          error: () => {
            this.docentes = [];
            this.docentesFiltrados = [];
          }
        });
      } else {
        this.docentesFiltrados = [];
      }
    } else {
      this.initializeSelectedDocente();
    }
  }

  getColorMateria(id: number | undefined): string {
    if (!id) return '#3B82F6';
    return this.colorManager.getColorForSubject(id);
  }

  ngOnInit(): void {
    this.cargarDatosIniciales();
    this.initializeSelectedDocente();
    this.analyzeEventDensity();
    this.setupCalendar();
    this.searchInput.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(termino => {
      this.filtrarHorarios(termino);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.hideEventTooltip();
  }

  get calendarApi(): Calendar | null {
    return this.calendarComponent ? this.calendarComponent.getApi() : null;
  }

  toggleAccordion(): void {
    this.isAccordionOpen = !this.isAccordionOpen;
  }
}

