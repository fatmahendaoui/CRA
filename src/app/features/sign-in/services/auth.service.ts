import { Injectable, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Profile, UserRole } from 'src/app/models/profile.model';
import { ProfileService } from 'src/app/services/profile.service';
import { v4 as uuidv4 } from 'uuid';
import { CollectionReference, DocumentData, Firestore, QuerySnapshot, collection, doc, getDoc, getDocs, getFirestore, query, setDoc, where } from '@angular/fire/firestore';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly profileService = inject(ProfileService);
  public profile: Profile;
  private readonly firestore= inject(Firestore); // Modified: Firestore instance

  public async CheckUserExist(uid: string): Promise<boolean> {
    // Check if the user is an admin
    const queryResult = await this.profileService.checkAdmin(uid);



    // Check if the user is an admin
    const isAdmin = queryResult.docs.length > 0;


    // Check conditions for authorized access
    if (isAdmin) {
      // Navigate to the 'folders' route
      this.router.navigate(['/dashbord']);
      return true;
    } else {
      // Navigate to the 'not-authorized' route
      this.router.navigate(['/sign-in']);
      return false;
    }
  }

  async createDomaine(domaineName: string): Promise<{ profile: Profile | null; exists: boolean }> {
    try {
      const user = this.auth.currentUser!;
      const createdOn = new Date().toISOString().substring(0, 10) + 'T00:00:00.000Z';
      const domaineId = uuidv4();

      // Check if the domain name already exists
      const domaineQuery: QuerySnapshot<DocumentData> = await getDocs(
        query(collection(this.firestore, 'domaine_CRA') as CollectionReference<DocumentData>, where('domaineName', '==', domaineName))
      );

      if (!domaineQuery.empty) {
        // Domain name already exists
        return { profile : null, exists: true };
      }

       // Get the current date
       const currentDate = new Date();

       // Calculate the trial end date by adding 15 days to the current date

      // Save profile data to 'domaine_BQDS' collection
      await setDoc(doc(this.firestore, 'domaine_CRA', domaineId), {
        domaineId,
        user_id: user.uid,
        domaineName,
        status: false,
      });

      const profile: Profile = {
        role: UserRole.Admin,
        created_on: createdOn,
        idDomaine: domaineId,
        uid: user.uid,
        last_connected: user.metadata.lastSignInTime ?? '',
        photoURL: user.photoURL ?? '',
        displayName: user.displayName ?? '',
        email: user.email ?? '',

      };

      // Save profile data to 'membership_BQDS' collection
      await setDoc(doc(this.firestore, 'membership_CRA', user.uid), profile);

       await this.addNewProject("Disponible", user.uid);
       await  this.addNewProject("Vacances", user.uid);
       await this.addNewProject("Maladie", user.uid);
      // Navigate to settings page
      this.router.navigate(['/dashbord']);

      return { profile, exists: false };
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  }


  async addNewProject(newproject: string, iduser: string): Promise<void> {
    if (newproject.trim() === "") {
      console.log('champ vide');
      return;
    }
    // resultTimesheet.map(li=>{
    //   li.nbHeure=0;
    //   li.project= newproject;
    // })

    const projectData = {
      'name': newproject,
      // [resultTimesheet[0].month+'_'+resultTimesheet[0].year] : resultTimesheet, // Array of timesheet items for each day
      'projectTotal': 0,
    };
    const domaineRef = 
      collection(
        this.firestore,
        'membership_CRA',
        iduser,'Projects'
      ) as CollectionReference<DocumentData>
    
    try {
      await setDoc(doc(domaineRef,newproject), projectData);
      console.log('Project added to Firestore:', newproject);
    } catch (error) {
      console.error('Error adding project to Firestore:', error);
    }
  }


}
