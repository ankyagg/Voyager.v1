
import { Client, Storage, Account } from 'appwrite';

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT!)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT!);

export const storage = new Storage(client);
export const account = new Account(client);
