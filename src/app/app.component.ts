import { Component, ElementRef, HostListener, ViewChild, Inject, ChangeDetectorRef, AfterViewInit, Input } from '@angular/core';
import html2canvas from 'html2canvas';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

export interface filtr{
  nazwa:string,
  nazwaWysw:string,
  wartDomysl:number,
  min:string,
  max:string,
  jednostka:string
}
export interface zastosowanyFiltr{
  nazwa:string,
  wartAktualna:number
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  constructor(public dialog: MatDialog, private cdr:ChangeDetectorRef) {}

  @ViewChild('img1_1', { static: true }) img1_1!: ElementRef<HTMLImageElement>;
  @ViewChild('img1_2', { static: true }) img1_2!: ElementRef<HTMLImageElement>;
  @ViewChild('img1_3', { static: true }) img1_3!: ElementRef<HTMLImageElement>;
  @ViewChild('img1_4', { static: true }) img1_4!: ElementRef<HTMLImageElement>;
  @ViewChild('img1_5', { static: true }) img1_5!: ElementRef<HTMLImageElement>;
  @ViewChild('img1_6', { static: true }) img1_6!: ElementRef<HTMLImageElement>;
  @ViewChild('paspartu', { static: true }) paspartu!: ElementRef<HTMLElement>;
  @ViewChild('zrzutKolazu', { static: true }) zrzutKolazu!: ElementRef<HTMLElement>;//to jest niewidoczne, ale jest i ma wysokosc 100vh

  //kanwasy, bo przy wykorzystaniu filtrow trzeba przerysowac rysunek z filtrami, bo html2canvas nie wszystkie cssy bierze pod uwage 
  @ViewChild('canvas_1', { static: true }) canvas_1!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvas_2', { static: true }) canvas_2!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvas_3', { static: true }) canvas_3!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvas_4', { static: true }) canvas_4!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvas_5', { static: true }) canvas_5!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvas_6', { static: true }) canvas_6!: ElementRef<HTMLCanvasElement>;

  /* 
  * do resetowania inputfile'ow, zeby przy wyborze tego samego pliku przez ten sam input[file] odpalił (change)
  * - np po zamianie zdjec miejscami/divami albo po wyczyscZdjecia()
  */
  @ViewChild('fileUpload1_1', {static: true}) fileUpload1_1!: ElementRef<HTMLInputElement>;
  @ViewChild('fileUpload1_2', {static: true}) fileUpload1_2!: ElementRef<HTMLInputElement>;
  @ViewChild('fileUpload1_3', {static: true}) fileUpload1_3!: ElementRef<HTMLInputElement>;
  @ViewChild('fileUpload1_4', {static: true}) fileUpload1_4!: ElementRef<HTMLInputElement>;
  @ViewChild('fileUpload1_5', {static: true}) fileUpload1_5!: ElementRef<HTMLInputElement>;
  @ViewChild('fileUpload1_6', {static: true}) fileUpload1_6!: ElementRef<HTMLInputElement>;

  imgSrcDoPrzesuniecia!: HTMLImageElement|undefined;

  wybranySzablon = 'kwadraty4';
  szablony = ['kwadraty4',
              'kwadraty4inne','kwadraty4inneL','kwadraty4inneP','kwadraty4innePL',
              'kwadraty3boczne1duzy','kwadraty3boczne1duzyL','kwadraty3boczne1duzyP','kwadraty3boczne1duzyPL',
              'kwadraty2boczne1duzy','kwadraty2boczne1duzyL','kwadraty2boczne1duzyP','kwadraty2boczne1duzyPL',
              'podloga','podlogaP','innaPodloga',
              'maleNaDuzym','spirala'];

  gruboscPaspartu:string = '10';
  rozmiarKolazu:number = 900;

  color = '#FFFFFF';

  zrzutKolazuZrobiony = false;//co by guziki pobierz i zamknijzrzut schowac

  przesuwaniePion = true;
  przesuwaniePoziom = true;

  url1_1 = '';
  url1_2 = '';
  url1_3 = '';
  url1_4 = '';
  url1_5 = '';
  url1_6 = '';

  img1_1MouseDown = false;
  img1_2MouseDown = false;
  img1_3MouseDown = false;
  img1_4MouseDown = false;
  img1_5MouseDown = false;
  img1_6MouseDown = false;

  kursorX = 0;
  kursorY = 0;
  kursorXpoczatkowy = 0;
  kursorYpoczatkowy = 0;
  xObrazekPoczatkowy:number = 0;//bo przy ponownym przesuwaniu nie ma juz top left na 0 tylko inne i bez tego mi wysrodkuje
  yObrazekPoczatkowy:number = 0;

  loaderZrzut = false;
  loaderDownloader = false;

  filtry:filtr[] = [
    {nazwa:'sepia',nazwaWysw:'sepia',wartDomysl:0,min:'0',max:'100',jednostka:'%'},
    {nazwa:'brightness',nazwaWysw:'jasność',wartDomysl:100,min:'0',max:'300',jednostka:'%'},
    {nazwa:'contrast',nazwaWysw:'kontrast',wartDomysl:100,min:'0',max:'1000',jednostka:'%'},
    {nazwa:'grayscale',nazwaWysw:'czarnobiel',wartDomysl:0,min:'0',max:'100',jednostka:'%'},
    {nazwa:'hue-rotate',nazwaWysw:'magia',wartDomysl:0,min:'0',max:'360',jednostka:'deg'},
    {nazwa:'invert',nazwaWysw:'negatyw',wartDomysl:0,min:'0',max:'100',jednostka:'%'},
    {nazwa:'blur',nazwaWysw:'rozmycie',wartDomysl:0,min:'0',max:'10',jednostka:'px'}
  ];
  img1_1ZastosowaneFiltry:zastosowanyFiltr[] = [];
  img1_2ZastosowaneFiltry:zastosowanyFiltr[] = [];
  img1_3ZastosowaneFiltry:zastosowanyFiltr[] = [];
  img1_4ZastosowaneFiltry:zastosowanyFiltr[] = [];
  img1_5ZastosowaneFiltry:zastosowanyFiltr[] = [];
  img1_6ZastosowaneFiltry:zastosowanyFiltr[] = [];

  zmianaGornegoMarginesuKolazu(){//margines, wysrodkowanie kolazu na zmiane jego rozmiaru
    //trzeba policzyc, zeby przy duzych kolazach nie srodkowal, a robil margin=0 top=0 
    //czyli jak rozmiarKolazu > 100vh - padding
    let wysokoscEkranu:number = this.zrzutKolazu.nativeElement.clientHeight;// ten htmlelement ma wysokosc 100vh
    if (this.rozmiarKolazu > wysokoscEkranu - 10){
      //this.marginTopKolazu = 0;
      this.paspartu.nativeElement.style.setProperty('margin-top','0px');
    }else{
      this.paspartu.nativeElement.style.setProperty('margin-top', (wysokoscEkranu/2 - this.rozmiarKolazu/2) +'px');
      //this.marginTopKolazu = wysokoscEkranu/2 - this.rozmiarKolazu/2
    }
    //this.cdr.detectChanges();
    this.wpasujZdjeciePoZmianieSzablonu(this.img1_1.nativeElement);
    this.wpasujZdjeciePoZmianieSzablonu(this.img1_2.nativeElement);
    this.wpasujZdjeciePoZmianieSzablonu(this.img1_3.nativeElement);
    this.wpasujZdjeciePoZmianieSzablonu(this.img1_4.nativeElement);
    this.wpasujZdjeciePoZmianieSzablonu(this.img1_5.nativeElement);
    this.wpasujZdjeciePoZmianieSzablonu(this.img1_6.nativeElement);
  }

  zrobZrzut(){
    this.zrzutKolazuZrobiony = true;
    this.loaderZrzut =true;

    this.cdr.detectChanges();//bez tego zrobi zrzut i dopiero po wyjsciu z funkcji odswiezy DOMa i usunie cien spod paspartu, ktory kaszani zrzut
    if(this.zrzutKolazu.nativeElement.hasChildNodes()){
      this.zrzutKolazu.nativeElement.removeChild(this.zrzutKolazu.nativeElement.children[0]);
    }
    
    if(this.img1_1ZastosowaneFiltry.length>0 || this.img1_2ZastosowaneFiltry.length>0 || this.img1_3ZastosowaneFiltry.length>0 ||
        this.img1_4ZastosowaneFiltry.length>0 || this.img1_5ZastosowaneFiltry.length>0 || this.img1_6ZastosowaneFiltry.length>0){
          
      alert('Pogorszenie jakości cyklisty z racji filtrów i konieczności zastosowania innej metody renderingu zrzutu. Zastosowanie filtra w jakimkolwiek zdjęciu wpływa na jakość całego kolarza.. kolażu');
      
      const tablicaKanwasuf = [
        {'kanw':this.canvas_1,'img':this.img1_1},
        {'kanw':this.canvas_2,'img':this.img1_2},
        {'kanw':this.canvas_3,'img':this.img1_3},
        {'kanw':this.canvas_4,'img':this.img1_4},
        {'kanw':this.canvas_5,'img':this.img1_5},
        {'kanw':this.canvas_6,'img':this.img1_6}
        ];

      tablicaKanwasuf.forEach((val)=>{
        //najpierw rozciagamy kanwasa do rozmiarow zdjecia a potem go skalujemy-dopasowujemy, bo inaczej ma kiepska jakosc
        val.kanw.nativeElement.width = val.img.nativeElement.width;
        val.kanw.nativeElement.height = val.img.nativeElement.height;
        val.kanw.nativeElement.style.setProperty('visibility','visible');
        const context = val.kanw.nativeElement.getContext('2d');
        if (context != null) {
          context.filter = getComputedStyle(val.img.nativeElement).filter//'hue-rotate(180deg)';
          //context.imageSmoothingEnabled = false;
    
          val.img.nativeElement.style.setProperty('display', 'none');
    
          context.drawImage(val.img.nativeElement, 0, 0, val.img.nativeElement.width, val.img.nativeElement.height,
            0, 0, val.kanw.nativeElement.width, val.kanw.nativeElement.height);
        }
        //dopasowanie wziete od img
        val.kanw.nativeElement.style.setProperty('width', val.img.nativeElement.style.getPropertyValue('width'));
        val.kanw.nativeElement.style.setProperty('height', val.img.nativeElement.style.getPropertyValue('height'));
        val.kanw.nativeElement.style.setProperty('top', val.img.nativeElement.style.getPropertyValue('top'));
        val.kanw.nativeElement.style.setProperty('left', val.img.nativeElement.style.getPropertyValue('left'));
      });
    }

    html2canvas(this.paspartu.nativeElement).then(canvas => {
      canvas.style.setProperty('height','95vh');
      canvas.style.setProperty('width','95vh');
      this.zrzutKolazu.nativeElement.appendChild(canvas);
      this.loaderZrzut = false;
    });
    
    this.zrzutKolazu.nativeElement.style.setProperty('visibility','visible');
    this.zrzutKolazu.nativeElement.style.setProperty('z-index','888');
    //this.img1_2.nativeElement.style.setProperty('width','100px');
  }

  zamknijZrzut(){
    this.zrzutKolazu.nativeElement.style.setProperty('visibility','hidden');
    this.zrzutKolazu.nativeElement.style.setProperty('z-index','-1');
    this.zrzutKolazuZrobiony = false;

    const tablicaKanwasuf = [
      {'kanw':this.canvas_1,'img':this.img1_1},
      {'kanw':this.canvas_2,'img':this.img1_2},
      {'kanw':this.canvas_3,'img':this.img1_3},
      {'kanw':this.canvas_4,'img':this.img1_4},
      {'kanw':this.canvas_5,'img':this.img1_5},
      {'kanw':this.canvas_6,'img':this.img1_6}
      ];

      tablicaKanwasuf.forEach((val)=>{
        val.kanw.nativeElement.style.setProperty('visibility','hidden');
        val.img.nativeElement.style.setProperty('display','inherit');
      });
  }

  pobierzZrzut(){
    this.loaderDownloader = true;
    html2canvas(this.paspartu.nativeElement).then(canvas => {
      canvas.toBlob((blob) => {
        // To download directly on browser default 'downloads' location
        if (blob != null) {
          let d = new Date();
          let link = document.createElement("a");
          link.download = "cyklista_"+d.getFullYear().toString()+(d.getMonth()+1).toString()+d.getDate()+"_"+d.getHours().toString()+d.getMinutes().toString()+d.getSeconds().toString()+".jpg";
          link.href = URL.createObjectURL(blob);
          link.click();
        }
        this.loaderDownloader = false;
        // To save manually somewhere in file explorer
        //window.saveAs(blob, 'image.png');

    },'image/jpeg',1);
    });
  }

  ustawPrzesuwanie(pion:boolean,poziom:boolean){//przesuwanie zdjecia wzgledem diva
    this.przesuwaniePion = pion;
    this.przesuwaniePoziom = poziom;
  }

  wybierzKolaz(kolaz:string){
    this.wybranySzablon = kolaz;
    this.cdr.detectChanges();
    this.wpasujZdjeciePoZmianieSzablonu(this.img1_1.nativeElement);
    this.wpasujZdjeciePoZmianieSzablonu(this.img1_2.nativeElement);
    this.wpasujZdjeciePoZmianieSzablonu(this.img1_3.nativeElement);
    this.wpasujZdjeciePoZmianieSzablonu(this.img1_4.nativeElement);
    this.wpasujZdjeciePoZmianieSzablonu(this.img1_5.nativeElement);
    this.wpasujZdjeciePoZmianieSzablonu(this.img1_6.nativeElement);
  }

  /*
  * Wymiana zdjęc między divami
  * w edge'u działa, w chromie działa
  * FIREFOX - mouseup odpala się dla elementu na ktorym było mousedown, więc nie działa w takiej formie
  * próbowałem mouseenter na sąsiednim elemencie (i dwie zmienne imgSrcDoPrzesuniecia1 i imgSrcDoPrzesuniecia2), 
  * ale najpierw i tak się odpali mouseup z elementu na ktorym naduszono mousedown,
  * a na mouseup już musi wiedziec z ktorym divem się zamienia na zdjęcia, a jeszcze nie wie bo się mouseenter nie odpalił na mouseenter, a dopiero po mouseupie
  * więc nie działa
  */
  mouseDown(zdj:HTMLImageElement){//do przesuwania zdjec miedzy divami (wymiany zdjec)
    this.imgSrcDoPrzesuniecia = zdj;
  }

  mouseUp(zdj:HTMLImageElement){//do przesuwania zdjec miedzy divami (wymiany zdjec)

    if(this.imgSrcDoPrzesuniecia != undefined && this.imgSrcDoPrzesuniecia.id != zdj.id){
      //console.log('przesuwam');
      let zdjTempSrc = zdj.src;
      let urlTemp = '';

      zdj.src = this.imgSrcDoPrzesuniecia.src;
      //potrzebne zeby jak do pustego przesuwam to sie w pustym pojawilo zdjecie (*ngIf="url_x != ''")
      if(zdj.id=='img1_1'){
        urlTemp = this.url1_1;
        this.url1_1 = this.imgSrcDoPrzesuniecia.src;
      }
      if(zdj.id=='img1_2'){
        urlTemp = this.url1_2;
        this.url1_2 = this.imgSrcDoPrzesuniecia.src;
      }
      if(zdj.id=='img1_3'){
        urlTemp = this.url1_3;
        this.url1_3 = this.imgSrcDoPrzesuniecia.src;
      }
      if(zdj.id=='img1_4'){
        urlTemp = this.url1_4;
        this.url1_4 = this.imgSrcDoPrzesuniecia.src;
      }
      if(zdj.id=='img1_5'){
        urlTemp = this.url1_5;
        this.url1_5 = this.imgSrcDoPrzesuniecia.src;
      }
      if(zdj.id=='img1_6'){
        urlTemp = this.url1_6;
        this.url1_6 = this.imgSrcDoPrzesuniecia.src;
      }

      this.wpasujZdjeciePoZmianieSzablonu(zdj);

      let tablicaImgow = [
        {'srcUrl':this.url1_1,'img':this.img1_1},
        {'srcUrl':this.url1_2,'img':this.img1_2},
        {'srcUrl':this.url1_3,'img':this.img1_3},
        {'srcUrl':this.url1_4,'img':this.img1_4},
        {'srcUrl':this.url1_5,'img':this.img1_5},
        {'srcUrl':this.url1_6,'img':this.img1_6}
        ];
  
      tablicaImgow.forEach((val)=>{
        if(this.imgSrcDoPrzesuniecia != undefined && val.img.nativeElement.id == this.imgSrcDoPrzesuniecia.id){
          val.img.nativeElement.src = zdjTempSrc;//to dziala jak referencja
          val.srcUrl = zdjTempSrc;//a to nie dziala jak referencja, czyli mozna wywalic i w ogole mozna klucze wywalic i tylko tabelke imgow zrobic
          //czyli znowu musze na pałę:
          if(this.imgSrcDoPrzesuniecia.id=='img1_1'){
            this.url1_1 = urlTemp;
          }
          if(this.imgSrcDoPrzesuniecia.id=='img1_2'){
            this.url1_2 = urlTemp;
          }
          if(this.imgSrcDoPrzesuniecia.id=='img1_3'){
            this.url1_3 = urlTemp;
          }
          if(this.imgSrcDoPrzesuniecia.id=='img1_4'){
            this.url1_4 = urlTemp;
          }
          if(this.imgSrcDoPrzesuniecia.id=='img1_5'){
            this.url1_5 = urlTemp;
          }
          if(this.imgSrcDoPrzesuniecia.id=='img1_6'){
            this.url1_6 = urlTemp;
          }
          //console.log(urlTemp);

          this.wpasujZdjeciePoZmianieSzablonu(val.img.nativeElement);
        }
        /*if(this.imgSrcDoPrzesuniecia != undefined && zdj.id == val.img.nativeElement.id){
          val.srcUrl = this.imgSrcDoPrzesuniecia.src;//to niestety nie działa jakby było referencją, więc wyżej spr id i this.url1_x = src
          this.cdr.detectChanges();
        }*/
      });

    }/*else{
      console.log('nie przesuwam');
    }*/
    this.imgSrcDoPrzesuniecia = undefined;
  }

  onFileDroped(event:any,el:HTMLImageElement){
    event.preventDefault();
    //event.stopPropagation();
    let terefere = {target:{files: event.dataTransfer.files}};//nieelegancki myk,zeby pasowalo do onFileSelected(). no moznaby to ladnie dyrektywa ogarnac
    this.onFileSelected(terefere,el);
    event.target.style.setProperty('opacity','1');//classList.remove('przezroczystosc');
  }
  stopujZapobiegaj(ev:any) {
    ev.stopPropagation();
    ev.preventDefault();
    ev.target.style.setProperty('opacity','.2');
  }

  usunPrzezroczystosc(ev:any){
    ev.target.style.setProperty('opacity','1');
  }

  onFileSelected(event:any,el:HTMLImageElement) {
    // Chcialbym, zeby po zaladowaniu zdjecia zostalo ono wysrodkowane, ALE:
    // el z przekazanego parametru nie ma jeszcze aktualnych rozmiarow (nawet zadnych, jesli jest nowy)
    // this.img1_x tez nie ma aktualnych
    // a wymiary z resulta mają faktyczny rozmiar zdjecia a nie przeskalowany w DOMie
    // this.cdr.detectChanges(); tez nie dziala - ale dziala przy usunieciu cienia przy zrzucie
    // EDIT: udalo sie! image.onload()
    const file:File = event.target.files[0];

    //console.log(el.src);

    if (file) {

      var reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (ev: any) => {

        //el.src = ev.target.result; //pieknie działa i nie musialbym sprawdzac ktora fota, ale w htmlu do src ładuję this.url1_x i po nim ngIfuję

        const image = new Image();
        image.src = ev.target.result;
        image.onload = () => {
          //console.log(image.width, image.height);// a to ma faktyczny rozmiar zdjecia, czyli np. 4624 x 3468
          //console.log(el.parentElement?.offsetWidth,el.parentElement?.offsetHeight,el.width,el.height);

          if(el.parentElement != null){//porownanie proporcji ramki i zdjęcia i odpowiednie dopasowanie
            if( (el.parentElement.offsetWidth / el.parentElement.offsetHeight) > (image.width / image.height) ){
              el.style.setProperty('height', 'auto');
              el.style.setProperty('width', '100%');
            }else{
              el.style.setProperty('height', '100%');
              el.style.setProperty('width', 'auto');
            }
            this.wysrodkujZdjecie(el);
          }

        };

        if (el.id=='img1_1') {
          this.url1_1 = ev.target.result;//to jest blob jakiś w stringu praktycznie zapisany - spoko
        }

        if (el.id=='img1_2') {
          this.url1_2 = ev.target.result;
        }

        if (el.id=='img1_3') {
          this.url1_3 = ev.target.result;
        }

        if (el.id=='img1_4') {
          this.url1_4 = ev.target.result;
        }

        if (el.id=='img1_5') {
          this.url1_5 = ev.target.result;
        }

        if (el.id=='img1_6') {
          this.url1_6 = ev.target.result;
        }
      }
    }

    //resetowanie, zeby przy wyborze tego samego pliku przez ten sam input[file] odpalił (change) - np po zamianie zdjec miejscami/divami albo po wyczyscZdjecia()
    this.fileUpload1_1.nativeElement.value = '';
    this.fileUpload1_2.nativeElement.value = '';
    this.fileUpload1_3.nativeElement.value = '';
    this.fileUpload1_4.nativeElement.value = '';
    this.fileUpload1_5.nativeElement.value = '';
    this.fileUpload1_6.nativeElement.value = '';
    //console.log(el.width);//el jest z parametru i w parametrze jeszcze nie ma w nim obrazka i jego rozmiaru
  }

  wyczyscZdjecia(){
    this.url1_1 = '';
    this.url1_2 = '';
    this.url1_3 = '';
    this.url1_4 = '';
    this.url1_5 = '';
    this.url1_6 = '';
  }

  @HostListener('document:mousemove', ['$event']) documentClickEvent($event: MouseEvent) {
    //console.log('Through HostListener - MouseMove Event Details: ', $event);
    this.kursorX = $event.clientX;
    this.kursorY = $event.clientY;

    if(this.img1_1MouseDown){
      if(this.przesuwaniePoziom)
        this.img1_1.nativeElement.style.setProperty('left',(this.kursorX - this.kursorXpoczatkowy + this.xObrazekPoczatkowy)+'px');
      if(this.przesuwaniePion)
        this.img1_1.nativeElement.style.setProperty('top',(this.kursorY - this.kursorYpoczatkowy + this.yObrazekPoczatkowy)+'px');
    }

    if(this.img1_2MouseDown){
      if(this.przesuwaniePoziom)
        this.img1_2.nativeElement.style.setProperty('left',(this.kursorX - this.kursorXpoczatkowy + this.xObrazekPoczatkowy)+'px');
      if(this.przesuwaniePion)
        this.img1_2.nativeElement.style.setProperty('top',(this.kursorY - this.kursorYpoczatkowy + this.yObrazekPoczatkowy)+'px');
    }

    if(this.img1_3MouseDown){
      if(this.przesuwaniePoziom)
        this.img1_3.nativeElement.style.setProperty('left',(this.kursorX - this.kursorXpoczatkowy + this.xObrazekPoczatkowy)+'px');
      if(this.przesuwaniePion)
        this.img1_3.nativeElement.style.setProperty('top',(this.kursorY - this.kursorYpoczatkowy + this.yObrazekPoczatkowy)+'px');
    }

    if(this.img1_4MouseDown){
      if(this.przesuwaniePoziom)
        this.img1_4.nativeElement.style.setProperty('left',(this.kursorX - this.kursorXpoczatkowy + this.xObrazekPoczatkowy)+'px');
      if(this.przesuwaniePion)
        this.img1_4.nativeElement.style.setProperty('top',(this.kursorY - this.kursorYpoczatkowy + this.yObrazekPoczatkowy)+'px');
    }

    if(this.img1_5MouseDown){
      if(this.przesuwaniePoziom)
        this.img1_5.nativeElement.style.setProperty('left',(this.kursorX - this.kursorXpoczatkowy + this.xObrazekPoczatkowy)+'px');
      if(this.przesuwaniePion)
        this.img1_5.nativeElement.style.setProperty('top',(this.kursorY - this.kursorYpoczatkowy + this.yObrazekPoczatkowy)+'px');
    }

    if(this.img1_6MouseDown){
      if(this.przesuwaniePoziom)
        this.img1_6.nativeElement.style.setProperty('left',(this.kursorX - this.kursorXpoczatkowy + this.xObrazekPoczatkowy)+'px');
      if(this.przesuwaniePion)
        this.img1_6.nativeElement.style.setProperty('top',(this.kursorY - this.kursorYpoczatkowy + this.yObrazekPoczatkowy)+'px');
    }

    // //console.log('img1: '+this.img1_1.nativeElement.offsetLeft);
    // console.log('img2: '+this.img1_2.nativeElement.offsetLeft);
    // var tere = document.getElementById('img1_2');
    // console.log(tere?.offsetLeft);
  }

  //wykorzystywane przy mousedown na danym obrazku, zeby nie przesuwał mi się lewy górny róg obrazka w miejsce kursora, a żeby pozostał na miejscu
  kursoryPoczatkowe(top:number,left:number){//top i left danego obrazka
    this.xObrazekPoczatkowy = left;
    this.yObrazekPoczatkowy = top;

    this.kursorXpoczatkowy = this.kursorX;
    this.kursorYpoczatkowy = this.kursorY;
  }

  wysrodkujZdjecie(zdj:HTMLImageElement){
    zdj.style.setProperty('top','calc(50% - '+zdj.height/2+'px)');
    zdj.style.setProperty('left','calc(50% - '+zdj.width/2+'px)');
  }

  dopasujZdjecie(zdj:HTMLImageElement,kierunek:string = 'pion'){
    if(kierunek=='poziom'){
      zdj.style.setProperty('width','100%');
      zdj.style.setProperty('height','auto');
    }else{
      zdj.style.setProperty('height','100%');
      zdj.style.setProperty('width','auto');
    }
    this.wysrodkujZdjecie(zdj);
  }

  wpasujZdjeciePoZmianieSzablonu(el: HTMLImageElement) {
    if (el.parentElement != null) {//porownanie proporcji ramki i zdjęcia i odpowiednie dopasowanie
      if ((el.parentElement.offsetWidth / el.parentElement.offsetHeight) > (el.width / el.height)) {
        el.style.setProperty('height', 'auto');
        el.style.setProperty('width', '100%');
      } else {
        el.style.setProperty('height', '100%');
        el.style.setProperty('width', 'auto');
      }
      this.wysrodkujZdjecie(el);
    }
  }

  skalujZdjecie(zdj:HTMLImageElement): void {//czyli otworz dialog
    const dialogRef = this.dialog.open(SkalowanieDialog, {
      width: '250px',
      data: 100
    });

    dialogRef.afterClosed().subscribe(result => {
      //console.log('The dialog was closed');
      let skala = result;
      //UWAGA!!! ważna jest kolejność, jezeli width jest AUTO to przy zmianie height automatycznie zmieni sie width i zmienna zdj.width bedzie juz inna
      // i ten width potem zmieni się drugi raz przy setProperty,
      // więc najpierw zmieniamy to co jest na auto - czasem jest to width czasem height - zależy jak było dopasowane zdjęcie
      //EDIT: zanim cokolwiek ruszymy, to ladujemy width i height, ale nie z zdj.style.getPropertyValue, bo tam moze byc auto albo %, tylko ze zdj(HTMLImageElement): 
      let szer = zdj.width;
      let wys = zdj.height;
      //console.log(zdj.style.getPropertyValue('width'));
      zdj.style.setProperty('width',(szer*skala/100)+'px');
      zdj.style.setProperty('height',(wys*skala/100)+'px');
      this.wysrodkujZdjecie(zdj);
    });
  }

  filtrujZdjecie(zdj:HTMLImageElement,zastosowaneFiltryZdjecia:zastosowanyFiltr[],nazwaFiltra:string): void {//czyli otworz dialog

    const dialogRef = this.dialog.open(FiltrDialog, {
      width: '548px',
      data: {
        filtry:this.filtry,
        nazwaFiltra:nazwaFiltra,
        zastosowaneFiltryZdjecia:zastosowaneFiltryZdjecia,
        zdj:zdj}
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result){
        if(zdj.id=='img1_1'){
          this.img1_1ZastosowaneFiltry = result;
        }
        if(zdj.id=='img1_2'){
          this.img1_2ZastosowaneFiltry = result;
        }
        if(zdj.id=='img1_3'){
          this.img1_3ZastosowaneFiltry = result;
        }
        if(zdj.id=='img1_4'){
          this.img1_4ZastosowaneFiltry = result;
        }
        if(zdj.id=='img1_5'){
          this.img1_5ZastosowaneFiltry = result;
        }
        if(zdj.id=='img1_6'){
          this.img1_6ZastosowaneFiltry = result;
        }
      }
      //console.dir(result);
    });
  }

  wyczyscFiltryZdjecia(zdj:HTMLImageElement){
    //jak parametrem przkeazuje zastosowaneFiltry to nie dziala, więc:
    if(zdj.id=='img1_1'){
      this.img1_1ZastosowaneFiltry = [];
      this.img1_1ZastosowaneFiltry.length = 0;
    }
    if(zdj.id=='img1_2'){
      this.img1_2ZastosowaneFiltry = [];
      this.img1_2ZastosowaneFiltry.length = 0;
    }
    if(zdj.id=='img1_3'){
      this.img1_3ZastosowaneFiltry = [];
      this.img1_3ZastosowaneFiltry.length = 0;
    }
    if(zdj.id=='img1_4'){
      this.img1_4ZastosowaneFiltry = [];
      this.img1_4ZastosowaneFiltry.length = 0;
    }
    if(zdj.id=='img1_5'){
      this.img1_5ZastosowaneFiltry = [];
      this.img1_5ZastosowaneFiltry.length = 0;
    }
    if(zdj.id=='img1_6'){
      this.img1_6ZastosowaneFiltry = [];
      this.img1_6ZastosowaneFiltry.length = 0;
    }
    
    zdj.style.setProperty('filter','none');    
  }
  
}

@Component({
  selector: 'app-dialog-skalowanie',
  templateUrl: 'app-dialog-skalowanie.html',
})
export class SkalowanieDialog {

  constructor(
    public dialogRef: MatDialogRef<SkalowanieDialog>,
    @Inject(MAT_DIALOG_DATA) public data: number) {}

  onNoClick(): void {
    this.dialogRef.close(100);
  }

}

@Component({
  selector: 'app-dialog-filtr',
  templateUrl: 'app-dialog-filtr.html',
})
export class FiltrDialog implements AfterViewInit{

  constructor(
    public dialogRef: MatDialogRef<FiltrDialog>,
    @Inject(MAT_DIALOG_DATA) public data: {
      filtry:filtr[],
      nazwaFiltra:string,
      zastosowaneFiltryZdjecia:zastosowanyFiltr[],
      zdj:HTMLImageElement},
    
    private cdr:ChangeDetectorRef) { 
      
      //sprawdzenie ktory filtr i ustawienie zmiennych
      this.data.filtry.forEach((value)=>{
      
        if(value.nazwa == this.data.nazwaFiltra){
          this.nazwaWysw = value.nazwaWysw
          this.jednostka = value.jednostka;
          this.min = value.min;
          this.max = value.max;
          this.nowaWartosc = value.wartDomysl;
        }
      });

      //sprawdzenie czy jest juz zastosowany i pobranie bieżącej wartosci
      this.data.zastosowaneFiltryZdjecia.forEach((value)=>{      
        if(value.nazwa == this.data.nazwaFiltra){
          this.nowaWartosc = value.wartAktualna;
        }
      });
  }//koniec konstruktora

  @ViewChild('imidrz', { static: true }) imidrz!: ElementRef<HTMLElement>;
  imarz = new Image();
  nowaWartosc = 20;
  nazwaWysw = '';
  jednostka = '';
  min = ''//do hmtla do sldera zakres
  max = ''//do hmtla do sldera zakres

  cssWszystkieZastosowaneFiltry = '';

  ngAfterViewInit(): void {


    //UWAGA!!! jak appenduje bezposrednio this.data.zdj, to usuwa mi tego img z kolazu, dlatego zrobilem dodatkowa zmienna imarz = new Image();
    this.imarz.src = this.data.zdj.src;
    this.imarz.style.setProperty('width','100%');
    this.imarz.style.setProperty('filter',this.data.zdj.style.getPropertyValue('filter'));
    this.imidrz.nativeElement.appendChild(this.imarz);
  }

  naZmiane(): void {//najpierw aktualizuje tabelke zastosowaneFiltry, a potem tylko podglądowi robie filtr w cssie

    let nowyFiltr = true;//moga byc juz jakies zastosowaneFiltry, ale nie musi w nich byc tego co go zmieniamy
    if(this.data.zastosowaneFiltryZdjecia.length>0){
      this.data.zastosowaneFiltryZdjecia.forEach((zastFiltr)=>{
        if(zastFiltr.nazwa == this.data.nazwaFiltra){//filtr ktory zmieniamy jest w zastosowanych - aktualizacja tabeli zastosowaneFiltry
          zastFiltr.wartAktualna = this.nowaWartosc;
          nowyFiltr = false;
        }
      });
    }

    if(nowyFiltr){
      this.data.zastosowaneFiltryZdjecia.push({nazwa:this.data.nazwaFiltra,wartAktualna:this.nowaWartosc});
    }

    this.cssWszystkieZastosowaneFiltry = '';//zerujemy to!!!

    if(this.data.zastosowaneFiltryZdjecia.length>0){
      this.data.zastosowaneFiltryZdjecia.forEach((zastFiltr)=>{
        this.data.filtry.forEach((typFiltra)=>{
          
          if(typFiltra.nazwa == zastFiltr.nazwa){
            this.cssWszystkieZastosowaneFiltry += " "+typFiltra.nazwa+"("+zastFiltr.wartAktualna+typFiltra.jednostka+")";
          }

        });
      });
    }

    //console.log(this.cssWszystkieZastosowaneFiltry);
    this.imarz.style.setProperty('filter',this.cssWszystkieZastosowaneFiltry);
  }
  naOK(){//zdjeciu w kolazu robie filtr, bo to referencja i sie zmienia za dialogiem
    this.data.zdj.style.setProperty('filter',this.cssWszystkieZastosowaneFiltry);

    //zwracam zastosowaneFiltry po zmianach
    this.dialogRef.close(this.data.zastosowaneFiltryZdjecia);
  }

}