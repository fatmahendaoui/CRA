import { Injectable, inject } from '@angular/core';
import { ProfileService } from '../../../services/profile.service';
import {
  DocumentData,
  collection,
  deleteDoc,
  getDocs,
  updateDoc,
  where,
  setDoc, doc, query, CollectionReference, getDoc
} from '@angular/fire/firestore';
import { Firestore } from '@angular/fire/firestore';

import { Auth } from '@angular/fire/auth';
import { Profile } from 'src/app/models/profile.model';
import { HttpClient } from '@angular/common/http';


@Injectable()
export class ProjectService {
  private readonly profileService = inject(ProfileService);
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(Auth);
  private readonly http = inject(HttpClient);

  async getAllUsersForProject(newproject: string, iduser: string): Promise<boolean> {
    if (newproject.trim() === "") {
      console.log('champ vide');
      return false;
    }

    const projectData = {
      'name': newproject,
      'projectTotal': 0,
    };

    const domaineRef = collection(
      this.firestore,
      'membership_CRA',
      iduser,
      'Projects'
    ) as CollectionReference<DocumentData>;

    // Check if the project exists before adding it to Firestore.
    const projectDocRef = doc(domaineRef, newproject);
    const projectDoc = await getDoc(projectDocRef);

    if (projectDoc.exists()) {
      console.log('Project already exists:', newproject);
      return true;
    }
    return false;
  }
  async addNewProject(idproject: string, newprojects: string, iduser: string): Promise<void> {
    if (idproject.trim() === "") {
      console.log('champ vide');
      return;
    }
    const projectData = {
      'name': newprojects,
      'projectTotal': 0,
    };
    const domaineRef =
      collection(
        this.firestore,
        'membership_CRA',
        iduser, 'Projects'
      ) as CollectionReference<DocumentData>

    try {
      await setDoc(doc(domaineRef, idproject), projectData);
      console.log('Project added to Firestore:', idproject);
    } catch (error) {
      console.error('Error adding project to Firestore:', error);
    }
  }

  async updateProjectName(projectId: string, iduser, newProjectName: string): Promise<void> {
    const projectRef = doc(this.firestore, 'membership_CRA', iduser, 'Projects', projectId);

    try {
      await updateDoc(projectRef, {
        name: newProjectName,
      });
      console.log('Project name updated:', newProjectName);
    } catch (error) {
      console.error('Error updating project name:', error);
    }
  }

  async updateProjectsMonth(newproject: string, iduser: string, days): Promise<void> {

    if (newproject.trim() === "") {
      console.log('champ vide');
      return;
    }

    const projectData = {
      [days[0].month + '_' + days[0].year]: days, // Array of timesheet items for each day
    };
    const domaineRef =
      collection(
        this.firestore,
        'membership_CRA',
        iduser, 'Projects'
      ) as CollectionReference<DocumentData>

    try {
      // Add the new project to the Firestore collection "membership_CRA"
      await updateDoc(doc(domaineRef, newproject), projectData);
      console.log('Project added to Firestore:', newproject);
    } catch (error) {
      console.error('Error adding project to Firestore:', error);
    }
  }
  async updatestatusbyUidandMonth(iduser: string, month, year, data): Promise<void> {

    if (iduser.trim() === "") {
      console.log('champ vide');
      return;
    }
    try {
      await setDoc(doc(this.firestore, 'dateship_CRA', iduser), {
        [month + '_' + year]: data, // Array of timesheet items for each day
      }, { merge: true });
      // console.log('Project added to Firestore:', newproject);
    } catch (error) {
      console.error('Error adding project to Firestore:', error);
    }
  }
  async getuserbyid(userId) {
    let usersList;
    const querySnapshot = await getDocs(
      query(
        collection(this.firestore, 'membership_CRA'),
        where('uid', '==', userId)
      )
    );
    querySnapshot.forEach((doc) => {
      usersList = doc.data();
    });

    // Return the user list outside of the forEach loop.
    return usersList;
  }
  async getSubmittedDateShipCRAs(status) {
    let submittedStatusItems: any[] = [];

    const querySnapshot = await getDocs(
      query(
        collection(this.firestore, 'dateship_CRA')
      )
    );
    const docs = querySnapshot.docs.map((doc) => {
      return {
        id: doc.id,
        ...doc.data(),
      };
    });

    for (const item of docs) {
      const user = await this.getuserbyid(item.id);
      if (user.idDomaine == this.profileService.profile.idDomaine) {
        for (const key in item) {
          if (item[key].status === status) {
            // await the return value of the getuserbyid() function before pushing the item to the submittedStatusItems array.
            const user = await this.getuserbyid(item.id);
            submittedStatusItems.push({ month: key, id: item.id, user });
          }
        }
      }
    }

    return submittedStatusItems;
  }
  async getongoingDateShipCRAs(status, date) {
    let submittedStatusItems: any[] = [];

    const querySnapshot = await getDocs(
      query(
        collection(this.firestore, 'dateship_CRA')
      )
    );
    const docs = querySnapshot.docs.map((doc) => {
      return {
        id: doc.id,
        ...doc.data(),
      };
    });

    for (const item of docs) {
      const user = await this.getuserbyid(item.id);
      if (user.idDomaine == this.profileService.profile.idDomaine) {
        if (item[date]) {
          for (const key in item) {
            if (key == date && item[key].status === status) {
              // await the return value of the getuserbyid() function before pushing the item to the submittedStatusItems array.
              const user = await this.getuserbyid(item.id);
              submittedStatusItems.push({ month: key, id: item.id, user });
            }
          }
        } else {
          submittedStatusItems.push({ month: date, id: item.id, user });
        }
      }
    }

    return submittedStatusItems;
  }
  async fetchProjects(uid: string): Promise<any> {
    try {
      const projectsSnapshot = await getDocs(collection(this.firestore, 'membership_CRA', uid, 'Projects'));
      let projects: any[] = []
      projectsSnapshot.forEach((doc) => {
        projects.push({
          ...doc.data(),
          id: doc.id,
        });
      });
      return projects;
    } catch (error) {
      console.error('Error fetching projects from Firestore:', error);
      return []; // Return an empty array in case of an error
    }
  }
  public async deleteProject(projectId: string): Promise<any[]> {
    const usersList: Profile[] = [];
    const allProjects: any[] = [];

    const querySnapshot = await getDocs(
      query(
        collection(this.firestore, 'membership_CRA'),
        where('idDomaine', '==', this.profileService.profile.idDomaine)
      )
    );

    querySnapshot.forEach((doc) => {
      usersList.push(doc.data() as Profile);
    });

    for await (const user of usersList) {
      const projectRef = doc(this.firestore, 'membership_CRA', user.uid, 'Projects', projectId);
      try {
        await deleteDoc(projectRef);
        console.log('Project deleted from Firestore:', projectId);
      } catch (error) {
        console.error('Error deleting project from Firestore:', error);
      }
    }

    return allProjects;
  }
  public async deleteUserProject(projectId: string, uid): Promise<any[]> {
    const allProjects: any[] = [];
    const projectRef = doc(this.firestore, 'membership_CRA', uid, 'Projects', projectId);
    try {
      await deleteDoc(projectRef);
      console.log('Project deleted from Firestore:', projectId);
    } catch (error) {
      console.error('Error deleting project from Firestore:', error);
    }

    return allProjects;
  }
  public async fetchAllProjects(): Promise<any[]> {
    const usersList: Profile[] = [];
    const allProjects: any[] = [];

    const querySnapshot = await getDocs(
      query(
        collection(this.firestore, 'membership_CRA'),
        where('idDomaine', '==', this.profileService.profile.idDomaine)
      )
    );

    querySnapshot.forEach((doc) => {
      usersList.push(doc.data() as Profile);
    });

    for await (const user of usersList) {
      console.log(usersList);

      const projects = await this.fetchProjects(user.uid);
      allProjects.push(...projects.filter((project) => project.name !== "Disponible" && project.name !== "Maladie" && project.name !== "Vacances"));

    }

    return allProjects;
  }
  public async fetchAllProjectswithuser(): Promise<any[]> {
    const usersList: Profile[] = [];
    const allProjects: any[] = [];

    const querySnapshot = await getDocs(
      query(
        collection(this.firestore, 'membership_CRA'),
        where('idDomaine', '==', this.profileService.profile.idDomaine)
      )
    );

    querySnapshot.forEach((doc) => {
      usersList.push(doc.data() as Profile);
    });

    for await (const user of usersList) {
      const projects = await this.fetchProjects(user.uid);
      // project.name !== "Disponible" && project.name !== "Maladie" && project.name !== "Vacances"
      allProjects.push(...projects.filter((project) => project.name !== "").map((project) => ({
        ...project,
        displayName: user.displayName,
      })));
    }

    return allProjects;
  }
  async getstatus(uid: string, month, year): Promise<any> {
    try {
      const docRef = doc(this.firestore, 'dateship_CRA', uid);
      const arrayField = await getDoc(docRef).then(doc => doc.get(month + '_' + year));
      return arrayField;

    } catch (error) {
      console.error('Error fetching projects from Firestore:', error);
      return []; // Return an empty array in case of an error
    }
  }
  public async checkUserAccess() {
    // check if the user exist in bqds-user is an admin using the profileService
    const queryResult = await this.profileService.checkAdmin(
      this.auth.currentUser!.uid
    );

    // Check if the query result has any documents and if the user's role is "admin"
    let isAdmin =
      queryResult.docs.length > 0 &&
      queryResult.docs[0].data()['role'] === 'admin';

    // Return the value of isAdmin
    return isAdmin;
  }




  public async sendNotificationToAdmin(data) {
    const usersList: Profile[] = [];
    const querySnapshot = await getDocs(
      query(
        collection(this.firestore, 'membership_CRA'),
        where('idDomaine', '==', this.profileService.profile.idDomaine)
      )
    );

    querySnapshot.forEach((doc) => {
      usersList.push(doc.data() as Profile);
    });

    for await (const user of usersList) {
      if (user.role == 'admin') {
        data.email = user.email;
        data.AdminName = user.displayName;
        this.http.post<void>(`https://us-central1-prodvalbridge.cloudfunctions.net/add_mail_cra`, data).subscribe(li => {
          console.log('done');

        })
      }

    }

  }
  public async sendNotificationToUser(data) {
    this.http.post<void>(`https://us-central1-prodvalbridge.cloudfunctions.net/regectedAccpeted_mail_cra`, data).subscribe(li => {
      console.log('done');

    })

  }
}