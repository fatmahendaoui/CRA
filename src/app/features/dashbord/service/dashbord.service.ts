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

@Injectable({
  providedIn: 'root'
})
export class DashbordService {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(Auth);
  constructor() { }
}
