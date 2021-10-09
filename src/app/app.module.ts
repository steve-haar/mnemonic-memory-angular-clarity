import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HomeComponent } from './home/home.component';
import { AboutComponent } from './about/about.component';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ClarityIcons, windowCloseIcon } from '@cds/core/icon';
import { CdsModule } from '@cds/angular';
import { DigitsOnlyFormControlDirective } from './home/digits-only-form-control.directive';

import '@cds/core/badge/register.js';
import '@cds/core/button/register.js';
import '@cds/core/icon/register.js';
import '@cds/core/tag/register.js';
import '@cds/core/textarea/register.js';

ClarityIcons.addIcons(windowCloseIcon);

@NgModule({
  declarations: [
    AboutComponent,
    AppComponent,
    HomeComponent,
    DigitsOnlyFormControlDirective
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CdsModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
