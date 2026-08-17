import { Component } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-cart',
  imports: [DecimalPipe, RouterLink],
  templateUrl: './cart.html',
  styleUrl: './cart.scss',
})
export class Cart {
  constructor(public cart: CartService) {}

  increase(productId: number, currentQty: number): void {
    this.cart.updateQuantity(productId, currentQty + 1);
  }

  decrease(productId: number, currentQty: number): void {
    this.cart.updateQuantity(productId, currentQty - 1);
  }

  remove(productId: number): void {
    this.cart.remove(productId);
  }
}
