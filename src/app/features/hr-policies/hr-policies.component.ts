import { Component, HostListener } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';

@Component({
  selector: 'app-hr-policies',
  templateUrl: './hr-policies.component.html',
  styleUrls: ['./hr-policies.component.scss'],
})
export class HrPoliciesComponent {
  pdfUrl = 'assets/Règlement et processus internes V1.pdf'; // Chemin relatif vers le fichier PDF
  pdf: any;
  currentSlideIndex = 0;
  isPdfLoaded = false; // Indicateur de chargement du PDF

  ngOnInit() {
    pdfjsLib.getDocument(this.pdfUrl).promise.then(pdf => {
      this.pdf = pdf;
      this.isPdfLoaded = true; // Le PDF est chargé
      this.renderSlide(this.currentSlideIndex);
    }).catch(error => {
      console.error('Erreur lors du chargement du PDF', error);
    });
  }

  renderSlide(pageNum: number) {
    if (!this.pdf) return; // Assurez-vous que le PDF est bien chargé avant de tenter de le rendre
    this.pdf.getPage(pageNum + 1).then((page) => {
      const canvas = document.getElementById('pdf-canvas') as HTMLCanvasElement;
      const context = canvas.getContext('2d');
      const viewport = page.getViewport({ scale: 1 });

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      page.render({
        canvasContext: context,
        viewport: viewport,
      });
    });
  }

  nextSlide() {
    if (this.currentSlideIndex < this.pdf.numPages - 1) {
      this.currentSlideIndex++;
      this.renderSlide(this.currentSlideIndex);
    }
  }

  previousSlide() {
    if (this.currentSlideIndex > 0) {
      this.currentSlideIndex--;
      this.renderSlide(this.currentSlideIndex);
    }
  }

  // Écouteur d'événements pour capturer les touches fléchées gauche et droite
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'ArrowRight') {
      this.nextSlide(); // Si la flèche droite est appuyée, aller à la slide suivante
    } else if (event.key === 'ArrowLeft') {
      this.previousSlide(); // Si la flèche gauche est appuyée, aller à la slide précédente
    }
  }
}
