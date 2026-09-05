export interface Expense {
  id: string;
  user: string;
  expense_date: string;
  category:
    | "TRAVEL"
    | "MEALS"
    | "ACCOMMODATION"
    | "OFFICE"
    | "TRANSPORT"
    | "OTHER";

  from_location: string;
  to_location: string;
  distance_km: string | null;
  mode_of_conveyance: string;
  departure_time: string | null;
  arrival_time: string | null;

  fare: string;
  stay: string;
  food: string;
  da: string;

  // Miscellaneous — Fixed expenses
  phone: string;
  mobile: string;
  postage: string;
  fax: string;
  email_expense: string;

  // Miscellaneous — Other reimbursements
  stationary: string;
  telegram: string;
  photo_copies: string;
  octroi: string;
  demurrage: string;
  collie_cartage: string;

  // Legacy fields
  miscellaneous_1: string;
  miscellaneous_2: string;

  description: string;
  remarks: string;

  created_at: string;
  updated_at: string;
}