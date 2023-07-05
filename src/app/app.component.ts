import { Component, ElementRef, HostListener, ViewChild, Inject, ChangeDetectorRef, AfterViewInit, OnInit, ViewChildren, QueryList } from '@angular/core';
import html2canvas from 'html2canvas';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

interface filtr{
  nazwa:string,
  nazwaWysw:string,
  wartDomysl:number,
  min:string,
  max:string,
  jednostka:string
}
interface zastosowanyFiltr{
  nazwa:string,
  wartAktualna:number
}
interface parametryZdjecia{
  id:string,
  url:string,
  mouseDown:boolean,
  zastosowaneFiltry:zastosowanyFiltr[],
  img?:ElementRef<HTMLImageElement>,
  fileUpload?:ElementRef<HTMLInputElement>,
  kanw?:ElementRef<HTMLCanvasElement>
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit{

  constructor(public dialog: MatDialog, private cdr:ChangeDetectorRef) {}

  ngOnInit(): void {
    /*
     * Najpierw wpełniam tablice parametryZdjec bez referencji z DOMa, bo ich jeszcze przecież nie ma
     * Potem w afterViewInit jak już są img, fileUploady i canvasy, to przelatuje ją jeszcze raz i uzupełniam rzeczonymi elementami z DOMa
     */
    for(let i=0;i<17;i++){
      this.parametryZdjec.push({
        url:'',
        mouseDown:false,
        zastosowaneFiltry:[],
        id:'img1_'+(i+1)
      });
    }
  }
  ngAfterViewInit(){
    //let arrImagesow = this.images.toArray();
    /* inicjalizacja elementów DOM wygenerowanych w petli ngFor  */
    let iterator = 0;
    this.parametryZdjec.forEach((v)=>{
      v.img = this.images.get(iterator);
      v.kanw = this.canvases.get(iterator);
      v.fileUpload = this.fileuploads.get(iterator);
      iterator++;
    });
  }

  parametryZdjec:parametryZdjecia[] = [];

  /* Ponizsze ViewChildreny z QueryListami laduje w afterViewInit do tablicy parametryZdjec: */

  //ViewChildren z QueryList sie sotsuje, gdy mamy w ngForze np #img i on wszystkie #img w ten sposób magicznie obczai
  @ViewChildren('img') images!:QueryList<ElementRef<HTMLImageElement>>;
   
  //kanwasy, bo przy wykorzystaniu filtrow trzeba przerysowac rysunek z filtrami, bo html2canvas nie wszystkie cssy bierze pod uwage 
  @ViewChildren('canvas') canvases!:QueryList<ElementRef<HTMLCanvasElement>>;

  // do resetowania inputfile'ow, zeby przy wyborze tego samego pliku przez ten sam input[file] odpalił (change)
  // - np po zamianie zdjec miejscami/divami albo po wyczyscZdjecia()
  @ViewChildren('fileUpload') fileuploads!:QueryList<ElementRef<HTMLInputElement>>;

  @ViewChild('paspartu', { static: true }) paspartu!: ElementRef<HTMLElement>;
  @ViewChild('zrzutKolazu', { static: true }) zrzutKolazu!: ElementRef<HTMLElement>;//to jest niewidoczne, ale jest i ma wysokosc 100vh

  imgDoPrzesuniecia:parametryZdjecia|undefined;//HTMLImageElement|undefined;

  wybranySzablon = 'kwadraty4';
  szablony = ['kwadrat1','kwadraty4','kwadraty9',
              'kwadraty4inne','kwadraty4inneL','kwadraty4inneP','kwadraty4innePL',
              'kwadraty3boczne1duzy','kwadraty3boczne1duzyL','kwadraty3boczne1duzyP','kwadraty3boczne1duzyPL',
              'kwadraty2boczne1duzy','kwadraty2boczne1duzyL','kwadraty2boczne1duzyP','kwadraty2boczne1duzyPL',
              'podloga','podlogaP','innaPodloga','spirala',
              'kwadraty12malych1duzy','kwadraty16malych1duzy',
              'maleNaCzterech','maleNaCzterech2','maleNaDuzym','maleNaDuzymL','male2NaDuzym','male2NaDuzymL',
              'dwaPionowe', 'dwaPoziome','dwaPionowe-1-2', 'dwaPoziome-1-2','dwaPionowe-2-1', 'dwaPoziome-2-1'];

  gruboscPaspartu:number = 10;
  rozmiarKolazu:number = 900;

  color = '#FFFFFF';

  zrzutKolazuZrobiony = false;//co by guziki pobierz i zamknijzrzut schowac

  przesuwaniePion = true;
  przesuwaniePoziom = true;

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
    
    this.parametryZdjec.forEach((v)=>{
      if (v.img)
      this.wpasujZdjeciePoZmianieSzablonu(v.img.nativeElement);
    });

  }

  zrobZrzut(){
    this.zrzutKolazuZrobiony = true;
    this.loaderZrzut =true;

    this.cdr.detectChanges();//bez tego zrobi zrzut i dopiero po wyjsciu z funkcji odswiezy DOMa i usunie cien spod paspartu, ktory kaszani zrzut
    if(this.zrzutKolazu.nativeElement.hasChildNodes()){
      this.zrzutKolazu.nativeElement.removeChild(this.zrzutKolazu.nativeElement.children[0]);
    }
    
    let czyZastosowanoFiltry:boolean = false;

    this.parametryZdjec.forEach((val)=>{
      if(val.zastosowaneFiltry.length>0){
        czyZastosowanoFiltry = true;
      }
    });

    if(czyZastosowanoFiltry/*this.img1_1ZastosowaneFiltry.length>0 || this.img1_2ZastosowaneFiltry.length>0 || this.img1_3ZastosowaneFiltry.length>0 ||
        this.img1_4ZastosowaneFiltry.length>0 || this.img1_5ZastosowaneFiltry.length>0 || this.img1_6ZastosowaneFiltry.length>0*/){
          
      alert('Pogorszenie jakości cyklisty z racji filtrów i konieczności zastosowania innej metody renderingu zrzutu. Zastosowanie filtra w jakimkolwiek zdjęciu wpływa na jakość całego kolarza.. kolażu');

      this.parametryZdjec.forEach((val)=>{
        if(val.img && val.kanw){
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
        }
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

  zamknijZrzut() {
    this.zrzutKolazu.nativeElement.style.setProperty('visibility', 'hidden');
    this.zrzutKolazu.nativeElement.style.setProperty('z-index', '-1');
    this.zrzutKolazuZrobiony = false;

    this.parametryZdjec.forEach((val) => {
      if (val.img && val.kanw) {
        val.kanw.nativeElement.style.setProperty('visibility', 'hidden');
        val.img.nativeElement.style.setProperty('display', 'inherit');
      }
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

    this.parametryZdjec.forEach((v)=>{
      if (v.img) this.wpasujZdjeciePoZmianieSzablonu(v.img.nativeElement);
    });
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
  mouseDown(zdj:parametryZdjecia){//do przesuwania zdjec miedzy divami (wymiany zdjec)
    this.imgDoPrzesuniecia = zdj;
  }
  mouseUp(zdj:parametryZdjecia){//do przesuwania zdjec miedzy divami (wymiany zdjec)

    /*
    przypisanie obiektow bezposrednio (val=zdjDoPrzesuniecia i val=temp) nie działa jak bym chciał,[edit] I DOBRZE - idka nie mogę se ot tak zmieniać!!!
    więc najpierw znajduje zdjecie przekazane w parametrze (na ktorym był MOUSEUP)
    i do niego wrzucam co trzeba z bufora. Potem znajduje to docelowe (na którym był MOUSEDOWN) 
    
    Jakie propertisy trzeba zamienić:

    1.url - po url *ngIfa robie - musi byc. Ciekawostka: puste zdjęcie ma url='' i src='localhost:4200'
    2.src - musi być żeby miał rozmiar obrazka do wpasowania i wyśrodkowania - DAJEMY URL, bo nativeElement.src z parametru lub z this.imgDoPrzesuniecia
    jest referencja i może już być zmienione.
    3.zastosowaneFiltry
    4.nativeElement.style filter

    note: co chwile if, bo jak ma probably undefined, to nie widzi co ma w ifie nadrzędnym
    note2: muszą być dwie pętle
    */

    if (this.imgDoPrzesuniecia != undefined && this.imgDoPrzesuniecia.id != zdj.id) {
      
      let temp:parametryZdjecia = JSON.parse(JSON.stringify(zdj));//trzeba bo obiekt, czyli jak referencja
      let filtryTempaCss = zdj.img?.nativeElement.style.getPropertyValue('filter');

      let doPrzesuniecia:parametryZdjecia = JSON.parse(JSON.stringify(this.imgDoPrzesuniecia));//trzeba bo obiekt, czyli jak referencja
      let filtryDoPrzesunieciaCss = this.imgDoPrzesuniecia.img?.nativeElement.style.getPropertyValue('filter');

      this.parametryZdjec.forEach((val) => {
        if (val.id == zdj.id && val.img && doPrzesuniecia) {//to na ktorym jest MOUSEUP
          val.url = doPrzesuniecia.url;
          val.img.nativeElement.src = doPrzesuniecia.url;
          val.zastosowaneFiltry = doPrzesuniecia.zastosowaneFiltry;
          if (filtryDoPrzesunieciaCss){
            //val.img.nativeElement = this.imgDoPrzesuniecia.img.nativeElement;//OJ TO KASZANI NIEMIŁOSIERNIE!!! uważać na przypisywanie nativeElementow! 
            val.img.nativeElement.style.setProperty('filter',filtryDoPrzesunieciaCss);
          }
          this.wpasujZdjeciePoZmianieSzablonu(val.img.nativeElement);
          //console.log(val.id);
        }
      });

      this.parametryZdjec.forEach((val) => {
        if (val.img && doPrzesuniecia && val.id == doPrzesuniecia.id) {//to na ktorym bylo ostatnie MOUSEDOWN
          val.url = temp.url;
          val.img.nativeElement.src = temp.url;//temp.img.nativeElement.src;
          val.zastosowaneFiltry = temp.zastosowaneFiltry;
          (filtryTempaCss) ? val.img.nativeElement.style.setProperty('filter',filtryTempaCss) : val.img.nativeElement.style.setProperty('filter','none');
          this.wpasujZdjeciePoZmianieSzablonu(val.img.nativeElement);
          //console.log(val.id);
        }
      });

    }
    this.imgDoPrzesuniecia = undefined;
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
    // this.img1_x tez nie ma aktualnych [edit: juz nie this.img1_x, tylko tablica parametryZdjec.url]
    // a wymiary z resulta mają faktyczny rozmiar zdjecia a nie przeskalowany w DOMie
    // this.cdr.detectChanges(); tez nie dziala - ale dziala przy usunieciu cienia przy zrzucie
    // EDIT: udalo sie! image.onload()
    const file:File = event.target.files[0];

    //console.log(el.src);

    if (file) {

      var reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (ev: any) => {

        //el.src = ev.target.result; //pieknie działa i nie musialbym sprawdzac ktora fota, ale w htmlu do src ładuję url i po nim ngIfuję

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

        this.parametryZdjec.forEach((v)=>{
          if(v.id==el.id){
            v.url=ev.target.result;
            if(v.img)
              v.img.nativeElement.src=ev.target.result;
            //resetowanie, zeby przy wyborze tego samego pliku przez ten sam input[file] odpalił (change) - np po zamianie zdjec miejscami/divami albo po wyczyscZdjecia()
            if(v.fileUpload)
              v.fileUpload.nativeElement.value = '';
          }
        });

      }
    }

    //console.log(el.width);//el jest z parametru i w parametrze jeszcze nie ma w nim obrazka i jego rozmiaru
  }

  wyczyscZdjecia(){
    this.parametryZdjec.forEach((v)=>{
      v.url='';
      v.zastosowaneFiltry = [];
      v.zastosowaneFiltry.length = 0;
      v.img?.nativeElement.style.setProperty('filter','none');
    }); 
  }

  @HostListener('document:mousemove', ['$event']) documentClickEvent($event: MouseEvent) {
    //console.log('Through HostListener - MouseMove Event Details: ', $event);
    this.kursorX = $event.clientX;
    this.kursorY = $event.clientY;

    this.parametryZdjec.forEach((v)=>{
      if(v.mouseDown){
        //console.log(v.id,v.img);

        if(this.przesuwaniePoziom)
          if(v.img)
            v.img.nativeElement.style.setProperty('left',(this.kursorX - this.kursorXpoczatkowy + this.xObrazekPoczatkowy)+'px');
            //v.img.style.left = (this.kursorX - this.kursorXpoczatkowy + this.xObrazekPoczatkowy)+'px';
        if(this.przesuwaniePion)
          if(v.img) 
            v.img.nativeElement.style.setProperty('top',(this.kursorY - this.kursorYpoczatkowy + this.yObrazekPoczatkowy)+'px');
            //v.img.style.top = (this.kursorY - this.kursorYpoczatkowy + this.yObrazekPoczatkowy)+'px';

      }
    });

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
        this.parametryZdjec.forEach((v)=>{
          if (v.img && v.id == zdj.id){
            v.zastosowaneFiltry = result;
          }
        });
      }
      //console.dir(result);
    });
  }

  wyczyscFiltryZdjecia(zdj:HTMLImageElement){

    this.parametryZdjec.forEach((v)=>{
      if (v.img && v.id == zdj.id){
        v.zastosowaneFiltry = [];
        v.zastosowaneFiltry.length = 0;
      }
    });

    zdj.style.setProperty('filter','none');    
  }

  utowrzNgStyle(wybranySzablon:string,nrDiva:number,gruboscPaspartu:number,kolor:string):object{
    
    let styl={ };

    if(wybranySzablon=='maleNaCzterech' && nrDiva==4){
      styl = {
        'margin-top':'calc(-66.5% - '+(gruboscPaspartu)+'px)',
        'border':gruboscPaspartu+'px solid '+kolor
      };
    }

    if(wybranySzablon=='maleNaCzterech2' && nrDiva==4){
      styl = {
        'margin-top':'calc(-75% - '+(gruboscPaspartu)+'px)',
        'border':gruboscPaspartu+'px solid '+kolor
      };
    }

    if((wybranySzablon=='maleNaCzterech' || wybranySzablon=='maleNaCzterech2') && nrDiva!=4){
      styl = {
        'width':'calc(50% - '+(gruboscPaspartu/2)+'px)',
        'height':'calc(50% - '+(gruboscPaspartu/2)+'px)'
      };
    }

    if( ((wybranySzablon=='maleNaDuzym' || wybranySzablon=='maleNaDuzymL') && nrDiva==1) 
      || ( (wybranySzablon=='male2NaDuzym' || wybranySzablon=='male2NaDuzymL') && (nrDiva==1 || nrDiva==2) ) ){
      styl = {
        'border':gruboscPaspartu+'px solid '+kolor
      };
    }

    return styl;
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
      
      this.kopiaZastosowanychFiltrow = JSON.parse(JSON.stringify(this.data.zastosowaneFiltryZdjecia));
      //sprawdzenie czy jest juz zastosowany i pobranie bieżącej wartosci
      this.kopiaZastosowanychFiltrow.forEach((value)=>{      
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
  kopiaZastosowanychFiltrow:zastosowanyFiltr[] = [];//object zachowuje sie jak referencja,wiec potrzebujemy kopii, zeby anulowanie nie wplywalo na zastosowaneFiltry

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
    if(this.kopiaZastosowanychFiltrow.length>0){
      this.kopiaZastosowanychFiltrow.forEach((zastFiltr)=>{
        if(zastFiltr.nazwa == this.data.nazwaFiltra){//filtr ktory zmieniamy jest w zastosowanych - aktualizacja tabeli zastosowaneFiltry
          zastFiltr.wartAktualna = this.nowaWartosc;
          nowyFiltr = false;
        }
      });
    }

    if(nowyFiltr){
      this.kopiaZastosowanychFiltrow.push({nazwa:this.data.nazwaFiltra,wartAktualna:this.nowaWartosc});
    }

    this.cssWszystkieZastosowaneFiltry = '';//zerujemy to!!!

    if(this.kopiaZastosowanychFiltrow.length>0){
      this.kopiaZastosowanychFiltrow.forEach((zastFiltr)=>{
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
    this.dialogRef.close(this.kopiaZastosowanychFiltrow);
  }

}