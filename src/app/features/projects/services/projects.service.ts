import { Project } from './../models/Project.model';
import { Injectable, inject } from '@angular/core';
import { ProfileService } from '../../../services/profile.service';
import {
  DocumentData,
  collection,
  deleteDoc,
  getDocs,
  updateDoc,
  where,
  setDoc, doc, query, CollectionReference, getDoc,
  collectionData
} from '@angular/fire/firestore';
import { Firestore } from '@angular/fire/firestore';

import { Auth, User } from '@angular/fire/auth';
import { Profile, UserRole } from 'src/app/models/profile.model';
import { HttpClient } from '@angular/common/http';
import { from, Observable } from 'rxjs';
import { Brand, Group, Marque, Media, Product } from '../models/Project.model';
import { id } from 'date-fns/locale';


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
  //////////////
  // Check if a group with the same name and idDomain already exists
async findGroupByNameAndDomain(groupName: string, idDomain: string): Promise<string | null> {
  const groupsQuery = query(
    collection(this.firestore, 'Groups'),
    where('name', '==', groupName),
    where('iddomain', '==', idDomain)
  );

  const querySnapshot = await getDocs(groupsQuery);
  if (!querySnapshot.empty) {
    const group = querySnapshot.docs[0];
    console.log('Group already exists:', group.id);
    return group.id; // Return the existing group ID
  }
  return null; // No existing group found
}
  // Create a new group
  async createGroup(idGroup: string, groupName: string, idDomain: string): Promise<string|void> {
    if (idGroup.trim() === "") {
      console.log('Group ID is empty');
      return;
    }

    const groupData = {
      idGroup: idGroup,
      name: groupName,
      iddomain: idDomain
    };

    const groupRef = doc(this.firestore, 'Groups', idGroup);

    try {
      await setDoc(groupRef, groupData);
      console.log('Group added to Firestore:', groupData);
    } catch (error) {
      console.error('Error adding group to Firestore:', error);
    }
  }

  // Check if a brand with the same name already exists within the group
  async findBrandByNameAndGroup(brandName: string, groupId: string): Promise<string | null> {
    const brandsQuery = query(
      collection(this.firestore, 'Groups', groupId, 'Brands'),
      where('name', '==', brandName)
    );
  
    const querySnapshot = await getDocs(brandsQuery);
    if (!querySnapshot.empty) {
      const brand = querySnapshot.docs[0];
      console.log('Brand already exists:', brand.id);
      return brand.id; // Return the existing brand ID
    }
    return null; // No existing brand found
  }

  // Create a new brand within a group
  async createBrand(idBrand: string, brandName: string, groupId: string): Promise<string|void> {
    if (idBrand.trim() === "") {
      console.log('Brand ID is empty');
      return;
    }
    const brandData = {
      idBrand:idBrand,
      name: brandName,
    };

    const brandRef = doc(this.firestore,  'Groups', // Remplacez par 'Groups' ou le nom de votre collection de groupes
      groupId,
      'Brands', // Remplacez par 'Brands' ou le nom de votre collection de marques
      idBrand);
 
    try {
      await setDoc(brandRef, brandData);
      console.log('Brand added to Firestore:', brandData);
    } catch (error) {
      console.error('Error adding brand to Firestore:', error);
    }
  }

  // Check if a product with the same name already exists within the brand
async findProductByNameAndBrand(productName: string, groupId: string, brandId: string): Promise<string | null> {
  const productsQuery = query(
    collection(this.firestore, 'Groups', groupId, 'Brands', brandId, 'Products'),
    where('name', '==', productName)
  );

  const querySnapshot = await getDocs(productsQuery);
  if (!querySnapshot.empty) {
    const product = querySnapshot.docs[0];
    console.log('Product already exists:', product.id);
    return product.id; // Return the existing product ID
  }
  return null; // No existing product found
}

  // Create a new product within a brand
  async createProduct(idProduct: string, productName: string,groupId:string, brandId: string): Promise<string|void> {
    if (idProduct.trim() === "") {
      console.log('Product ID is empty');
      return;
    }
    const productData = {
      idProduct:idProduct,
      name: productName,
    };

    const productRef = doc(this.firestore,  'Groups', // Remplacez par 'Groups' ou le nom de votre collection de groupes
      groupId,
      'Brands', // Remplacez par 'Brands' ou le nom de votre collection de marques
      brandId ,'Products', idProduct);

    try {
      await setDoc(productRef, productData);
      console.log('Product added to Firestore:', productData);
    } catch (error) {
      console.error('Error adding product to Firestore:', error);
    }
  }
  // Check if a marque with the same name already exists within the product
async findMarqueByNameAndProduct(MarqueName: string, groupId: string, brandId: string,productId:string): Promise<string | null> {
  const MarquesQuery = query(
    collection(this.firestore, 'Groups', groupId, 'Brands', brandId, 'Products',productId,'Marques'),
    where('name', '==', MarqueName)
  );

  const querySnapshot = await getDocs(MarquesQuery);
  if (!querySnapshot.empty) {
    const marque = querySnapshot.docs[0];
    console.log('Product already exists:', marque.id);
    return marque.id; // Return the existing product ID
  }
  return null; // No existing product found
}
  // Create a new product within a brand
  async createMarque(idMarque: string, MarqueName: string,groupId:string, brandId: string,productId:string): Promise<string|void> {
    if (idMarque.trim() === "") {
      console.log('Product ID is empty');
      return;
    }
    const MarqueData = {
      idMarque:idMarque,
      name: MarqueName,
    };

    const marqueRef = doc(this.firestore,  'Groups', // Remplacez par 'Groups' ou le nom de votre collection de groupes
      groupId,
      'Brands', // Remplacez par 'Brands' ou le nom de votre collection de marques
      brandId ,'Products', productId,'Marques',idMarque);

    try {
      await setDoc(marqueRef, MarqueData);
      console.log('Product added to Firestore:', MarqueData);
    } catch (error) {
      console.error('Error adding product to Firestore:', error);
    }
  }
  // Check if the media already exists within a marque
async findMediaByNameAndMarque(mediaName: string, groupId: string, brandId: string, productId: string, marqueId: string): Promise<string | null> {
  const mediaQuery = query(
    collection(this.firestore, 'Groups', groupId, 'Brands', brandId, 'Products', productId, 'Marques', marqueId, 'Medias'),
    where('name', '==', mediaName)
  );

  const querySnapshot = await getDocs(mediaQuery);
  if (!querySnapshot.empty) {
    const media = querySnapshot.docs[0];
    console.log('Media already exists:', media.id);
    return media.id; // Return the existing media ID
  }
  return null; // No existing media found
}

// Create a new media within a marque
async createMedia(idMedia: string, mediaName: string, groupId: string, brandId: string, productId: string, marqueId: string): Promise<string | void> {
  if (idMedia.trim() === "") {
    console.log('Media ID is empty');
    return;
  }
  const mediaData = {
    idMedia: idMedia,
    name: mediaName,
  };

  const mediaRef = doc(this.firestore, 'Groups', groupId, 'Brands', brandId, 'Products', productId, 'Marques', marqueId, 'Medias', idMedia);

  try {
    await setDoc(mediaRef, mediaData);
    console.log('Media added to Firestore:', mediaData);
  } catch (error) {
    console.error('Error adding media to Firestore:', error);
  }
}

  async addNewProject(
    idproject: string,
    newprojects: string,
    iduser: string,
    managerId: string,
    users: string[],
    groupId: string,
    brandId: string,
    productId: string,
    marqueId:string,mediaId:string,groupName:string,brandName:string,productName:string,marqueName:string,mediaName:string
  ): Promise<void> {
    const usersList: Profile[] = [];
    console.log('newProject:', newprojects);
    if (idproject.trim() === "") {
      console.log('Champ vide');
      return;
    }
    
    console.log('Users:', users);
    const usersWithManager = [...users, managerId];
  
    const projectData = {
      id: idproject,
      name: newprojects,
      projectTotal: 0,
      managerId: managerId,
      users: usersWithManager,
      groupId: groupId,
      groupName:groupName,
      brandId: brandId,
      brandName:brandName,
      productId: productId,
      productName:productName,
      marqueId:marqueId,
      marqueName:marqueName,
      mediaId:mediaId,
      mediaName:mediaName
    };
    
    console.log('Project data:', projectData.id);

    const projectDocRef = doc(this.firestore, 'membership_CRA', iduser, 'Projects', idproject);
    // Récupérer les utilisateurs avec le rôle de manager
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
      if (user.uid === managerId) {
        console.log('Manager trouvé:', user);
        this.updateUserRoleManager(user.uid, UserRole.Manager, projectData.users);
      }
    }
  
    try {
      // Ajout du projet à Firestore
      await setDoc(projectDocRef, projectData);
      console.log('Projet ajouté à Firestore:', idproject);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du projet à Firestore:', error);
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

  async updateProjectsMonth(idproject: string, iduser: string, days): Promise<void> {

    if (idproject.trim() === "") {
      console.log('champ vide');
      return;
    }

    console.log('Tentative d\'accès au projet:', idproject);

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
      await updateDoc(doc(domaineRef, idproject), projectData);
      console.log('Project added to Firestore:', idproject);
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
  public async fetchAllProjects(
    selectedMarque?: string): Promise<any[]> {
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
    //  allProjects.push(...projects.filter((project) => project.name !== "Disponible" && project.name !== "Maladie" && project.name !== "Vacances"));
 // Apply filtering based on the selected criteria
 const filteredProjects = projects.filter((project) => {
  let isValid = project.name !== "Disponible" && project.name !== "Maladie" && project.name !== "Vacances";

  if (selectedMarque) {
    isValid = isValid && project.marqueId === selectedMarque;
  }

  return isValid;
});

allProjects.push(...filteredProjects);
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

async groupUserManager(iduser: string): Promise<Profile[]> {
  try {
    console.log('ID utilisateur soumis ::::', iduser);

    // Obtenir les projets associés à l'utilisateur
    const projectsSnapshot = await getDocs(
      collection(this.firestore, 'membership_CRA', iduser, 'Projects')
    );

    // Extraire les `managerId` de chaque projet
    const managerIds: string[] = [];
    projectsSnapshot.forEach((projectDoc) => {
      const projectData = projectDoc.data();
      const managerId = projectData['managerId'];
      if (managerId) {
        managerIds.push(managerId);
        console.log('Manager ID trouvé:', managerId);
      }
    });

    // Supprimer les doublons
    const uniqueManagerIds = Array.from(new Set(managerIds));
    console.log('Unique Manager IDs:', uniqueManagerIds);

    if (uniqueManagerIds.length === 0) {
      console.log('Aucun manager trouvé pour cet utilisateur.');
      return [];
    }

    // Rechercher les données des managers dans Firebase
    const managerProfiles: Profile[] = [];
    const querySnapshot = await getDocs(
      collection(this.firestore, 'membership_CRA')
    );

    querySnapshot.forEach((doc) => {
      const userData = doc.data() as Profile;
      if (uniqueManagerIds.includes(userData.uid)) {
        managerProfiles.push(userData);
        console.log('Profil du manager ajouté:', userData);
      }
    });

    return managerProfiles;
  } catch (error) {
    console.error('Erreur dans groupUserManager:', error);
    throw error;
  }
}
public async sendNotificationToAdmin(data) {
  try {
    const adminUsers: Profile[] = [];
    const querySnapshot = await getDocs(
      query(
        collection(this.firestore, 'membership_CRA'),
        where('idDomaine', '==', this.profileService.profile.idDomaine)
      )
    );

    const managerProfiles = await this.groupUserManager(data.uid);

    querySnapshot.forEach((doc) => {
      const userData = doc.data() as Profile;
      console.log('Utilisateur trouvé:', userData);

      // Vérifier si l'utilisateur est un manager notifié
      if (userData.role === 'manager' && userData.notify) {
        const isManaged = managerProfiles.some((manager) => manager.uid === userData.uid);

        if (isManaged) {
          console.log('Manager trouvé parmi les utilisateurs :', userData);
          adminUsers.push(userData);
        }
      }
    });

    console.log('Admins à notifier:', adminUsers);

    for await (const adminUser of adminUsers) {
      const emailData = { ...data };
      emailData.email = adminUser.email;
      emailData.AdminName = adminUser.displayName;

      console.log('Données de l\'email :', emailData);

      this.http.post<void>(
        `https://us-central1-dev-cra-390314.cloudfunctions.net/add_mail_cra`,
        emailData
      ).subscribe(
        (response) => console.log('Email envoyé avec succès:', response),
        (error) => console.error('Erreur lors de l\'envoi de l\'email:', error)
      );
    }
  } catch (error) {
    console.error('Erreur dans sendNotificationToAdmin:', error);
  }
}

///////
  public async sendNotificationToUser(data) {
    this.http.post<void>(`https://us-central1-dev-cra-390314.cloudfunctions.net/regectedAccpeted_mail_cra`, data).subscribe(li => {
      console.log('done');

    })

  }
  /////////// testtetettete
  // Fetch Origine by idDomaine and return their names
async getGroupsByDomain(idDomaine: string): Promise<Group[]> {
  const groupsQuery = query(
    collection(this.firestore, 'Groups'),
    where('iddomain', '==', idDomaine)
  );

  const querySnapshot = await getDocs(groupsQuery);
  const groups: Group[] = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data() as Group;
    groups.push({
      id: doc.id, 
      name: data.name, 
      iddomain: data.iddomain
    });
  });
  return groups;
}
// Fetch Group by origine ID and return their names
async getBrandsByGroup(groupId: string): Promise<Brand[]> {
  const brandsQuery = collection(this.firestore, 'Groups', groupId, 'Brands');
  const querySnapshot = await getDocs(brandsQuery);
  const brands: Brand[] = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data() as Brand;
    brands.push({
      id: doc.id, 
      name: data.name, 
      groupId: data.groupId
    });
  });

  return brands;

}
/////
// Fetch a specific group by idGroup and idDomain and return their names
async getGroupByIdAndDomain(idDomaine: string, idGroup: string): Promise<Group | null> {
  const groupsQuery = query(
    collection(this.firestore, 'Groups'),
    where('iddomain', '==', idDomaine),
    where('id', '==', idGroup) // Assuming 'id' is the field name for idGroup in the Firestore
  );

  const querySnapshot = await getDocs(groupsQuery);
  
  // Check if the group exists
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0]; // Get the first matching document
    const data = doc.data() as Group;
    
    return {
      id: doc.id,
      name: data.name,
      iddomain: data.iddomain
    };
  }
  
  return null; // Return null if no matching group was found
}


// Fetch Client by group ID within a group and return their names
async getProductsByBrand(groupId: string, brandId: string): Promise<Product[]> {
  const productsQuery = collection(this.firestore, 'Groups', groupId, 'Brands', brandId, 'Products');
  const querySnapshot = await getDocs(productsQuery);
  const products: Product[] = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data() as Product;
    products.push({
      id: doc.id, 
      name: data.name, 
      brandId: data.brandId
    });
  });

  return products;
}
// Fetch projects by product ID and return their details
async getMarquesByProduct(groupId: string, brandId: string, productId: string): Promise<Marque[]> {
  const marquesQuery = collection(
    this.firestore, 
    'Groups', 
    groupId, 
    'Brands', 
    brandId, 
    'Products', 
    productId, 
    'Marques'
  );

  const querySnapshot = await getDocs(marquesQuery);
  const marques: Marque[] = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data() as Marque;
    marques.push({
      id: doc.id, 
      name: data.name, 
      productId: productId
    });
  });

  return marques;
}
// Fetch media items by marque ID and return their details
async getMediaByMarque(groupId,brandId,productId,marqueId): Promise<Media[]> {
  const mediaCollectionRef = collection(
    this.firestore, 
    'Groups', 
    groupId, 
    'Brands', 
    brandId, 
    'Products', 
    productId, 
    'Marques', 
    marqueId, 
    'Medias'
  );

  const querySnapshot = await getDocs(mediaCollectionRef);
  const mediaList: Media[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data() as Media;
    mediaList.push({
      id: doc.id,
      name: data.name,
      marqueId: marqueId
    });
  });
  console.log("media",mediaList)

  return mediaList;
}
// Assuming these are defined in your TimesheetComponent

async getBrandName(project): Promise<string> {
  const brands = await this.getBrandsByGroup(project.groupId);
  console.log("groupId",project.groupId)
  const brand = brands.find(b => b.id === project.brandId);
  return brand ? brand.name : 'Unknown Brand';
}

async getProductName(project): Promise<string> {
  const products = await this.getProductsByBrand(project.groupId, project.brandId);
  const product = products.find(p => p.id === project.productId);
  return product ? product.name : 'Unknown Product';
}

async getMarqueName(project): Promise<string> {
  const marques = await this.getMarquesByProduct(
    project.groupId, 
    project.brandId, 
    project.productId
  );
  const marque = marques.find(m => m.id === project.marqueId);
  return marque ? marque.name : 'Unknown Marque';
}

async getMediaName(project): Promise<string> {
  const medias = await this.getMediaByMarque(
    project.groupId, 
    project.brandId, 
    project.productId, 
    project.marqueId
  );
  const media = medias.find(m => m.id === project.mediaId);
  return media ? media.name : 'Unknown Media';
}

// Update the name of a group
async updateGroupName(groupId: string, newName: string): Promise<void> {
  if (newName.trim() === "") {
    console.log("New group name is empty");
    return;
  }

  const groupRef = doc(this.firestore, "Groups", groupId);

  try {
    await updateDoc(groupRef, { name: newName });
    console.log("Group name updated successfully:", newName);
  } catch (error) {
    console.error("Error updating group name:", error);
  }
}

// Update the name of a brand within a group
async updateBrandName(groupId: string, brandId: string, newName: string): Promise<void> {
  if (newName.trim() === "") {
    console.log("New brand name is empty");
    return;
  }

  const brandRef = doc(this.firestore, "Groups", groupId, "Brands", brandId);

  try {
    await updateDoc(brandRef, { name: newName });
    console.log("Brand name updated successfully:", newName);
  } catch (error) {
    console.error("Error updating brand name:", error);
  }
}

// Update the name of a product within a brand
async updateProductName(groupId: string, brandId: string, productId: string, newName: string): Promise<void> {
  if (newName.trim() === "") {
    console.log("New product name is empty");
    return;
  }

  const productRef = doc(this.firestore, "Groups", groupId, "Brands", brandId, "Products", productId);

  try {
    await updateDoc(productRef, { name: newName });
    console.log("Product name updated successfully:", newName);
  } catch (error) {
    console.error("Error updating product name:", error);
  }
}

// Update the name of a marque within a product
async updateMarqueName(groupId: string, brandId: string, productId: string, marqueId: string, newName: string): Promise<void> {
  if (newName.trim() === "") {
    console.log("New marque name is empty");
    return;
  }
console.log("marque",marqueId,", name",newName)
const marqueRef = doc(this.firestore, "Groups", groupId, "Brands", brandId, "Products", productId,'Marques',marqueId);

  const marqu = doc(this.firestore,"Groups", groupId, "Brands", brandId, "Products", productId, "Marques", marqueId);

  try {
    await updateDoc(marqueRef, { name: newName });
    console.log("Marque name updated successfully:", newName);
  } catch (error) {
    console.error("Error updating marque name:", error);
  }
}
// Update the name of a media within a marque
async updateMediaName(groupId: string, brandId: string, productId: string, marqueId: string, mediaId: string, newName: string): Promise<void> {
  if (newName.trim() === "") {
    console.log("New media name is empty");
    return;
  }
  
  console.log("Updating media", mediaId, "to new name:", newName);

  const mediaRef = doc(this.firestore, "Groups", groupId, "Brands", brandId, "Products", productId, "Marques", marqueId, "Medias", mediaId);

  try {
    await updateDoc(mediaRef, { name: newName });
    console.log("Media name updated successfully:", newName);
  } catch (error) {
    console.error("Error updating media name:", error);
  }
}
////////////
async updateDescription(uid, month, year, description) {
  try {
    // Reference to the document in Firestore
    const docRef = doc(this.firestore, 'dateship_CRA', uid);

    // Fetch the document snapshot
    const docSnap = await getDoc(docRef);

    // Check if the document exists
    if (docSnap.exists()) {
      const data = docSnap.data();
      const monthYearField = data[`${month}_${year}`];

      // If the month-year field exists, update the description
      if (monthYearField) {
        // Update the description in the document field
        monthYearField.description = description;

        // Save the updated document back to Firestore
        await setDoc(docRef, data);
        console.log("Description updated:", monthYearField.description);
      } else {
        console.error("Month-Year field does not exist in the document.");
      }
    } else {
      console.error("Document not found.");
    }

    return description; // Return the updated description

  } catch (error) {
    console.error('Error updating description:', error);
  }
}

async getDescription(uid, month, year): Promise<string | null> {
  try {
    // Reference to the document in Firestore
    const docRef = doc(this.firestore, 'dateship_CRA', uid);

    // Fetch the document snapshot
    const docSnap = await getDoc(docRef);

    // Check if the document exists
    if (docSnap.exists()) {
      const data = docSnap.data();
      const monthYearField = data[`${month}_${year}`];

      // If the month-year field exists, return the description
      if (monthYearField && monthYearField.description) {
        return monthYearField.description;
      } else {
        console.error("Description not found for the specified month and year.");
        return null; // Return null if the description is not found
      }
    } else {
      console.error("Document not found.");
      return null; // Return null if the document doesn't exist
    }
  } catch (error) {
    console.error('Error getting description:', error);
    return null; // Return null in case of an error
  }
}
}
