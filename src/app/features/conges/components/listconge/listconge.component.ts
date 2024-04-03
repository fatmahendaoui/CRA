import { Component, OnInit } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { MatSelectChange } from '@angular/material/select';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-listconge',
  templateUrl: './listconge.component.html',
  styleUrls: ['./listconge.component.css']
})
export class ListcongeComponent implements OnInit {
  conges: any[] = [];
  

  constructor(private translocoService: TranslocoService) { }

  ngOnInit(): void {
    this.loadConges();
    
  }
  

  async loadConges(): Promise<void> {
    const firestore = getFirestore();
    const congesCollectionRef = collection(firestore, 'conge123');
    
    try {
      const querySnapshot = await getDocs(congesCollectionRef);
      querySnapshot.forEach((doc) => {
        const data = doc.data() as { [key: string]: any, status: number };
        this.conges.push({ id: doc.id, ...data, statusLabel: this.getStatusLabel(data.status) });
      });
      console.log('Liste des congés:', this.conges);
    } catch (error) {
      console.error('Erreur lors du chargement des congés depuis Firestore:', error);
    }
  }

  getStatusLabel(status: number): string {
    switch (status) {
      case 0:
        return 'En attente';
      case 1:
        return 'Approuvé';
      case 2:
        return 'Refusé';
      default:
        return '';
    }
  }

  async validerConge(conge: any): Promise<void> {
    const firestore = getFirestore();
    const congDocRef = doc(firestore, 'conge123', conge.id);
    
    try {
      await updateDoc(congDocRef, { status: 1 });
      console.log('Congé validé avec succès.');
      this.showSuccessAlert('Congé accepté');
      conge.status = 1;
      conge.statusLabel = 'Approuvé';
    } catch (error) {
      console.error('Erreur lors de la validation du congé:', error);
    }
  }

  async refuserConge(conge: any): Promise<void> {
    const firestore = getFirestore();
    const congDocRef = doc(firestore, 'conge123', conge.id);
    
    try {
      const { value: commentaire } = await Swal.fire({
        title: 'Ajouter un commentaire',
        input: 'textarea',
        inputPlaceholder: 'Ajouter un commentaire ',
        showCancelButton: true
      });

      await updateDoc(congDocRef, { status: 2, commentaire: commentaire || '' });
      console.log('Congé refusé avec succès.');
      this.showRefuseAlert('Congé refusé');
      conge.status = 2;
      conge.statusLabel = 'Refusé';
    } catch (error) {
      console.error('Erreur lors du refus du congé:', error);
    }
  }

  showSuccessAlert(message: string): void {
    Swal.fire('Succès', message, 'success');
  }

  showRefuseAlert(message: string): void {
    Swal.fire('Erreur', message, 'error');
  }

 
}
