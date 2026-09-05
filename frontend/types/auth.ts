export interface UserProfile {
  first_name: string;
  last_name: string;
  phone: string;
  fax: string;
  designation: string;
  department: string;
  state: string;
  headquarters: string;
  reporting_to: string;
  joining_date: string | null;
  profile_photo: string | null;
  address: string;
}

export interface User {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  profile: UserProfile;
}

export interface LoginResponse {
  refresh: string;
  access: string;
  user: User;
}