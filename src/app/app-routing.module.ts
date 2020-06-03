import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TransformerComponent } from './transformer/transformer.component';

const routes: Routes = [
  { path: `app`, component: TransformerComponent, pathMatch: `full` },
  { path: `**`, redirectTo: `/app` }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
