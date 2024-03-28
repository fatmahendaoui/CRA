import { Injectable, inject } from '@angular/core';
import { Observable, catchError, from, map, switchMap } from 'rxjs';
import {
  DocumentData,
  collection,
  getDocs,
  updateDoc,
  setDoc, doc, query, getDoc, QuerySnapshot, where
} from '@angular/fire/firestore';
import { Firestore } from '@angular/fire/firestore';
import { ProfileService } from 'src/app/services/profile.service';

@Injectable()
export class Day_offService {
  private readonly firestore = inject(Firestore);
  private readonly profileService = inject(ProfileService);
  public idDomaine = this.profileService.getIdDomaine();
  async AddDay_off(user): Promise<void> {
    // Récupérer l'idDomaine de l'utilisateur connecté
    const idDomaine = await this.profileService.getIdDomaine();
    const annee = user.date.getFullYear(); // Obtenez l'année au format AAAA
    const jour = user.date.getDate(); // Obtenez le jour du mois
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const month2 = monthNames[user.date.getMonth()];
    try {
      await setDoc(doc(this.firestore, 'Day_off', month2 + '_' + annee + '_' + idDomaine), {
        [jour]: user.date,
        [jour + '_' + month2 + '_' + annee]: user.name,
        'idDomaine': idDomaine
      }, { merge: true });
    } catch (error) {
      console.error('Error adding project to Firestore:', error);
    }
  }
  async UpdateDayOffName(dayOff): Promise<void> {
    const annee = dayOff.date.getFullYear(); // Obtenez l'année au format AAAA
    const jour = dayOff.date.getDate(); // Obtenez le jour du mois
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const month2 = monthNames[dayOff.date.getMonth()];
    // Récupérer l'idDomaine de l'utilisateur connecté
    const idDomaine = await this.profileService.getIdDomaine();

    const usersCollection = collection(this.firestore, 'Day_off');
    const userDocRef = doc(usersCollection, month2 + '_' + annee + '_' + idDomaine);

    await updateDoc(userDocRef,
      ({
        [jour + '_' + month2 + '_' + annee]: dayOff.name,
        'idDomaine': idDomaine
      }));
  }
  public fetchAlldaysoff(): Observable<any[]> {
    return from(this.profileService.getIdDomaine()).pipe(
      switchMap(idDomaine => {
        // If idDomaine is null, return an empty array
        if (!idDomaine) {
          return [];
        }

        // Query Firestore for day offs with matching idDomaine
        const queryRef = query(
          collection(this.firestore, 'Day_off'),
          where('idDomaine', '==', idDomaine)
        );

        return from(getDocs(queryRef)).pipe(
          map((querySnapshot: QuerySnapshot<DocumentData>) => {
            const dayoff: any[] = [];
            let dayoffs: any[] = [];
            querySnapshot.forEach((doc) => {
              dayoff.push(doc.data()); // Type assertion here
            });
            console.log(dayoff);

            dayoff.map(li => {
              for (const key in li) {
                if (li.hasOwnProperty(key)) {
                  const timestamp = li[key]; // Exemple de timestamp

                  // Convertissez le timestamp en millisecondes en ajoutant les secondes converties
                  const milliseconds = timestamp.seconds * 1000;
                  // Créez une instance de Date en utilisant le timestamp en millisecondes
                  const date: any = new Date(milliseconds);
                  console.log(li);
                  const annee = date.getFullYear(); // Obtenez l'année au format AAAA
                  const jour = date.getDate(); // Obtenez le jour du mois
                  const monthNames = [
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                  ];

                  const month2 = monthNames[date.getMonth()];
                  if (date != 'Invalid Date') {
                    dayoffs.push({ date: date, name: li[jour + '_' + month2 + '_' + annee] })
                  }
                }
              }
            })
            return dayoffs;
          })
        );
      }),
      catchError(error => {
        throw error;
      })
    );
  }
  public fetchAllKeyDay_off(month, year, domaineID) {
    let dayoffs: any[] = [];
    if (domaineID == this.profileService.getIdDomaine()) {
      return domaineID;
    }
    const docRef = doc(this.firestore, 'Day_off', month + '_' + year + '_' + domaineID);
    //Récupérer les données du document.
    return getDoc(docRef).then((snapshot) => {
      if (snapshot.exists()) {
        const membershipData: any = snapshot.data();
        for (const key in membershipData) {
          if (membershipData[key] && !membershipData[key].unset) {
            dayoffs.push(+key);
          }
        }
        return dayoffs;
      } else {
        return []
      }
    })

  }
  // Function to delete a user from Firestore
  async deletedaysoff(date: Date): Promise<void> {
    const mois = date.getMonth(); // Le mois est représenté par un nombre, 0 correspond à janvier, 1 à février, etc.
    const annee = date.getFullYear(); // Obtenez l'année au format AAAA
    const jour = date.getDate(); // Obtenez le jour du mois
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const month2 = monthNames[date.getMonth()];
    // Récupérer l'idDomaine de l'utilisateur connecté
    const idDomaine = await this.profileService.getIdDomaine();


    const usersCollection = collection(this.firestore, 'Day_off');
    const userDocRef = doc(usersCollection, month2 + '_' + annee + '_' + idDomaine);

    // Perform the deletion using the deleteDoc function and convert the Promise to an Observable
    try {
      await updateDoc(userDocRef, {
        [jour]: { unset: true },
        [jour + '_' + month2 + '_' + annee]: { unset: true },
      });
    } catch (error) {
      console.error('Error deleting day off:', error);
      throw error; // Propagez l'erreur pour qu'elle soit traitée par l'appelant
    }


  }
}
