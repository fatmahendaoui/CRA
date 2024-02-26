import { inject } from "@angular/core";
import { ProfileService } from "../services/profile.service";
import { Auth } from "@angular/fire/auth";
import { Profile } from "../models/profile.model";

export const fetchProfile = async (): Promise<Profile> => {
  const auth = inject(Auth);
  const service = inject(ProfileService);

  try {
    return service.fetchProfile(auth.currentUser!);
  }
  catch (e) {
    // ---- TODO: Handle error
    return {} as Profile;
  }
};
