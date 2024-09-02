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

import { Auth, User } from '@angular/fire/auth';
import { Profile, UserRole } from 'src/app/models/profile.model';
import { HttpClient } from '@angular/common/http';
import { from, Observable } from 'rxjs';


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
  async addNewProject(idproject: string, newprojects: string, iduser: string, managerId: string, users: string[]): Promise<void> {
    const usersList: Profile[] = [];
    if (idproject.trim() === "") {
      console.log('champ vide');
      return;
    }
    console.log('userssssssssss:', users);
    const usersWithManager = [...users, managerId];

    const projectData = {
      'name': newprojects,
      'projectTotal': 0,
      managerId: managerId, // Store the manager's user ID
      users: usersWithManager // Add the users' IDs to the project data
    };
    console.log('Project data: testtetetettetette', projectData);
    /*
    const domaineRef =
      collection(
        this.firestore,
        'membership_CRA',
        iduser, 'Projects'
      ) as CollectionReference<DocumentData>
*/
    const projectDocRef = doc(this.firestore, 'membership_CRA', iduser, 'Projects', newprojects);

    // Update the manager's role to 'manager'
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
      console.log('User 111111111', user);
      console.log('Manager ID 111111111 ', managerId);
      if (user.uid === managerId) {
        console.log('Manager found:', user);
        this.updateUserRoleManager(user.uid, UserRole.Manager, projectData.users);
        //user.role = UserRole.Manager;
      }
    }
    try {
      // Update the manager's role to 'manager'

      /* await setDoc(doc(domaineRef, idproject), projectData);
       console.log('Project added to Firestore:', idproject);*/
      // Si l'utilisateur est également le manager, mettre à jour son rôle
      return setDoc(projectDocRef, projectData);


    } catch (error) {
      console.error('Error adding project to Firestore:', error);
    }
  }
  updateUserRoleManager(userId: string, role, users: string[]): Observable<void> {
    // Assuming the 'membership_CRA' collection contains documents with document IDs equal to the user IDs
    const usersCollection = collection(this.firestore, 'membership_CRA');
    const userDocRef = doc(usersCollection, userId);
    // Create an object with the updated user data (only including the 'role' property in this example)
    const userUpdate = {
      role: role,
      notify: true,
    };
    // Perform the update using the updateDoc function and convert the Promise to an Observable
    return from(updateDoc(userDocRef, userUpdate));
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

  async updateProjectManager(projectId: string, iduser: string, newManagerId: string): Promise<void> {
    const projectRef = doc(this.firestore, 'membership_CRA', iduser, 'Projects', projectId);

    try {
      // Fetch the current project data to get the current manager ID
      const projectDoc = await getDoc(projectRef);
      const currentManagerId = projectDoc.data()?.['managerId'];
      const users = projectDoc.data()?.['users'];


      // If there is a current manager and the manager ID is different from the new one, revert their role to 'User'
      if (currentManagerId && currentManagerId !== newManagerId) {
        await this.updateUserRoleManager(currentManagerId, UserRole.User, users);
      }

      await updateDoc(projectRef, {
        managerId: newManagerId,
      });

      await this.updateUserRoleManager(newManagerId, UserRole.Manager, users);

      console.log('Project manager updated:', newManagerId);
    } catch (error) {
      console.error('Error updating project manager:', error);
    }
  }

  async updateProjectsMonth(newproject: string, iduser: string, days): Promise<void> {

    if (newproject.trim() === "") {
      console.log('champ vide');
      return;
    }

    console.log('Tentative d\'accès au projet:', newproject);

    const projectData = {
      [days[0].month + '_' + days[0].year]: days, // Array of timesheet items for each day
    };

    console.log('Contenu de projectData aprés la mise à jour:', projectData);


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
      if (user && user.idDomaine == this.profileService.profile.idDomaine) {
        for (const key in item) {
          if (item[key].status === status) {
            // await the return value of the getuserbyid() function before pushing the item to the submittedStatusItems array.
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
      if (user && user.idDomaine == this.profileService.profile.idDomaine) {
        if (item[date]) {
          for (const key in item) {
            if (key == date && item[key].status === status) {
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
  public async checkUserAccessManager() {
    // check if the user exist in bqds-user is an admin using the profileService
    const queryResult = await this.profileService.checkAdmin(
      this.auth.currentUser!.uid
    );

    // Check if the query result has any documents and if the user's role is "admin"
    let isManager =
      queryResult.docs.length > 0 &&
      queryResult.docs[0].data()['role'] === 'manager';

    // Return the value of isAdmin
    return isManager;
  }


  ////////////////////
  async groupUserManager(iduser: string): Promise<string[]> {
    try {
      console.log('iduser ::::', iduser);

      // Get the user's projects
      const projectsSnapshot = await getDocs(
        collection(this.firestore, 'membership_CRA', iduser, 'Projects')
      );

      // Extract user IDs from projects
      const userIds: string[] = [];
      projectsSnapshot.forEach(projectDoc => {
        const projectData = projectDoc.data();
        const users: string[] = projectData['users'] || [];
        userIds.push(...users);
      });

      // Remove duplicate user IDs
      const uniqueUserIds = Array.from(new Set(userIds));

      // Fetch user profiles in parallel
      const userPromises = uniqueUserIds.map(userId =>
        this.getuserbyid(userId).then(user => user?.email || '')
      );
      const emails = await Promise.all(userPromises);

      // Remove duplicate emails and filter out empty strings
      const uniqueEmails = Array.from(new Set(emails.filter(email => email !== '')));

      console.log('Unique Emails of managed users:', uniqueEmails);
      return uniqueEmails;
    } catch (error) {
      console.error('Error in groupUserManager:', error);
      throw error;
    }
  }
  public groupUserManagerObserv(iduser: string): Observable<string[]> {
    return from(this.groupUserManager(iduser));
  }////////////////
  public async sendNotificationToAdmin(data) {
    const adminUsers: Profile[] = [];
    const querySnapshot = await getDocs(
      query(
        collection(this.firestore, 'membership_CRA'),
        where('idDomaine', '==', this.profileService.profile.idDomaine)
      )
    );

    querySnapshot.forEach((doc) => {
      const userData = doc.data() as Profile;
      if ((userData.role === 'admin' || userData.role === 'manager') && userData.notify) {
        this.groupUserManagerObserv(userData.uid).subscribe(managerEmails => {
          // Filter users to exclude those managed by the current user
          if (managerEmails.includes(this.auth.currentUser!.uid)) {
            adminUsers.push(userData);
            console.log('Manager email:', adminUsers);
          }
        });
        adminUsers.push(userData);
      } /*else if (userData.role === 'manager' && userData.notify) {
        this.groupUserManagerObserv(userData.uid).subscribe(managerEmails => {
          // Filter users to exclude those managed by the current user
          if (managerEmails.includes(this.auth.currentUser!.uid)) {
            adminUsers.push(userData);
            console.log('Manager email:', adminUsers);
          }
        }, error => {
          console.error('Error fetching manager emails:', error);
        });
      }*/
    });

    for await (const adminUser of adminUsers) {
      const emailData = { ...data }; // Clone data for each admin user
      emailData.email = adminUser.email;
      emailData.AdminName = adminUser.displayName;

      console.log(emailData); // Optionally log email data before sending

      this.http.post<void>(
        `https://us-central1-dev-cra-390314.cloudfunctions.net/add_mail_cra`,
        emailData
      ).subscribe(
        (response) => {
          console.log('Email sent successfully:', response);
        },
        (error) => {
          console.error('Error sending email:', error);
        }
      );
    }
  }

  public async sendNotificationToUser(data) {
    this.http.post<void>(`https://us-central1-dev-cra-390314.cloudfunctions.net/regectedAccpeted_mail_cra`, data).subscribe(li => {
      console.log('done');

    })

  }
}