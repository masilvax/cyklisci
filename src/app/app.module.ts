import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent, FiltrDialog, SkalowanieDialog } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatRippleModule} from '@angular/material/core';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatMenuModule} from '@angular/material/menu';
import {MatDividerModule} from '@angular/material/divider';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatDialogModule} from '@angular/material/dialog';
import { NgxColorsModule } from 'ngx-colors';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatSliderModule} from '@angular/material/slider'; 
//import { MAT_COLOR_FORMATS, NgxMatColorPickerModule, NGX_MAT_COLOR_FORMATS } from '@angular-material-components/color-picker';

@NgModule({
  declarations: [
    AppComponent,
    SkalowanieDialog,
    FiltrDialog
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    MatInputModule,
    MatRippleModule,
    MatToolbarModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    MatDialogModule,
    NgxColorsModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatSliderModule
    //NgxMatColorPickerModule
  ],
  providers: [
  //  { provide: MAT_COLOR_FORMATS, useValue: NGX_MAT_COLOR_FORMATS }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
