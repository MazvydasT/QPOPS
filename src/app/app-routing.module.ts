import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TransformerComponent } from './transformer/transformer.component';

const routes: Routes = [
  { path: `main`, component: TransformerComponent, pathMatch: `full` },
  { path: `**`, redirectTo: `/main` }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true, relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
