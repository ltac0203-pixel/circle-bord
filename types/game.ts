export interface Game {
  id: string
  teamName: string
  date: string
  time: string
  location: string
  participants: number
  description?: string
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}