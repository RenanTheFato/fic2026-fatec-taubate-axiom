export interface UserInterface{
  id: string,
  email: string,
  name: string,
  hashed_password: string,
  role: string,
  created_at: Date,
  updated_at: Date
}