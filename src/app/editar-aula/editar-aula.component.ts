import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Aulas, AulasService } from '../aulas.service';
import { NotificationService } from '../notificacion.service';

// Interfaz para los tipos de aula (definida fuera del componente)
interface TipoAula {
  ID_TIPO: number;
  NOMBRE_TIPO: string;
}

@Component({
  selector: 'app-editar-aula',
  templateUrl: './editar-aula.component.html',
  styleUrl: './editar-aula.component.css'
})
export class EditarAulaComponent implements OnInit {
  aula: any = {
    nombre: '',
    tipo: 0 // ID del tipo seleccionado
  };
  tipos: any[] = []; // Array de tipos de aula
  id: number = 0;

  constructor(
    private route: ActivatedRoute,
    private aulaService: AulasService,
    public router: Router,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.id = +this.route.snapshot.paramMap.get('id')!;

    // Cargar los tipos disponibles primero
    this.cargarTipos();

    // Cargar los datos del aula
    this.cargarAula();
  }

  cargarTipos(): void {
    // Necesitas crear este método en tu servicio si no existe
    this.aulaService.obtenerTipoAulas().subscribe({
      next: (tipos) => {
        this.tipos = tipos;
      },
      error: (err) => {
        this.notificationService.showError('Error al cargar tipos de aula');
      }
    });
  }

  cargarAula(): void {
    this.aulaService.obtenerAulasId(this.id).subscribe({
      next: (data: Aulas) => {
        this.aula = {
          nombre: data.NOMBRE_AULA,
          tipo: data.TIPO_AULA
        };
      },
      error: (err) => {
        this.notificationService.showError('Error al obtener aula');
      }
    });
  }

  guardarCambios(): void {
    this.notificationService.showLoading('Actualizando aula...');


    this.aulaService.actualizarAulas(this.id, this.aula).subscribe({
      next: (response) => {
        this.notificationService.hideLoading();

        this.notificationService.showSuccessReport(
          'Aula Actualizada',
          response.mensaje || 'Aula actualizada correctamente',
          'Continuar'
        );

        setTimeout(() => {
          this.router.navigate(['/inicio/gestionar-aulas']);
        }, 1500);
      },
      error: (error) => {
        this.notificationService.hideLoading();

        let mensajeError = 'Error al actualizar el aula';

        if (error.status === 403 && error.error && error.error.message) {
          mensajeError = error.error.message;
        } else if (error.status === 404 && error.error && error.error.message) {
          mensajeError = error.error.message;
        } else if (error.error && error.error.message) {
          mensajeError = error.error.message;
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
}
