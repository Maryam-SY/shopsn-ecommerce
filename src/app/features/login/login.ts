import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  username = signal('mor_2314');
  password = signal('83r5^_');
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit(): void {
    if (!this.username() || !this.password()) {
      this.error.set('Veuillez remplir tous les champs.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.auth.login(this.username(), this.password()).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/catalog']);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Identifiants invalides. Réessayez.');
      },
    });
  }
}
