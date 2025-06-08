import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AulasService } from '../aulas.service';
import { NotificationService } from '../notificacion.service';

@Component({
  selector: 'app-editar-aula',
  templateUrl: './editar-aula.component.html',
  styleUrl: './editar-aula.component.css'
})
export class EditarAulaComponent implements OnInit {
  aula: any = {};
  tipos: string[] = ['Normal','Laboratorio','Taller de moda','Taller de electricidad'];
  id: number = 0;
  constructor(
    private route: ActivatedRoute,
    private aulaService: AulasService,
    public router: Router,
    private notificationService: NotificationService
  ) { }
  ngOnInit(): void {
    this.id = +this.route.snapshot.paramMap.get('id')!;
    this.aulaService.obtenerAulasId(this.id).subscribe({
      next: (data) => {
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
      
      // Si tu servicio de actualización devuelve un mensaje de éxito
      this.notificationService.showSuccessReport(
        'Aula Actualizada',
        response.mensaje || 'Aula actualizada correctamente',
        'Continuar'
      );
      
      // Navegar después de mostrar el éxito
      setTimeout(() => {
        this.router.navigate(['/inicio/gestionar-aulas']);
      }, 1500);
    },
    error: (error) => {
      this.notificationService.hideLoading();
      console.error('Error al actualizar aula:', error);
      
      let mensajeError = 'Error al actualizar el aula';
      
      // Manejo específico de errores
      if (error.status === 403 && error.error && error.error.message) {
        // Error 403: Forbidden (ID 99 no se puede actualizar)
        mensajeError = error.error.message;
      } else if (error.status === 404 && error.error && error.error.message) {
        // Error 404: Not Found (Aula no encontrada)
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
