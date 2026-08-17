import { Component, OnInit, signal, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { Product } from '../../core/models/product.model';

@Component({
  selector: 'app-catalog',
  imports: [DecimalPipe],
  templateUrl: './catalog.html',
  styleUrl: './catalog.scss',
})
export class Catalog implements OnInit {
  products = signal<Product[]>([]);
  categories = signal<string[]>([]);
  selectedCategory = signal<string>('all');
  loading = signal(true);
  error = signal<string | null>(null);

  filteredProducts = computed(() => {
    const category = this.selectedCategory();
    const all = this.products();
    return category === 'all' ? all : all.filter(p => p.category === category);
  });

  constructor(private productService: ProductService, public cart: CartService) {}

  ngOnInit(): void {
    this.loading.set(true);

    this.productService.getAll().subscribe({
      next: products => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les produits. Réessayez plus tard.');
        this.loading.set(false);
      },
    });

    this.productService.getCategories().subscribe({
      next: categories => this.categories.set(categories),
    });
  }

  selectCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  addToCart(product: Product): void {
    this.cart.add(product);
  }
}
