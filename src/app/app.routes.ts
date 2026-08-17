import { Routes } from '@angular/router';
import { Login } from './features/login/login';
import { Catalog } from './features/catalog/catalog';
import { Cart } from './features/cart/cart';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'catalog' },
  { path: 'login', component: Login },
  { path: 'catalog', component: Catalog },
  { path: 'cart', component: Cart, canActivate: [authGuard] },
  { path: '**', redirectTo: 'catalog' },
];
