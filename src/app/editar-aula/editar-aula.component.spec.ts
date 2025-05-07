import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarAulaComponent } from './editar-aula.component';

describe('EditarAulaComponent', () => {
  let component: EditarAulaComponent;
  let fixture: ComponentFixture<EditarAulaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EditarAulaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditarAulaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
