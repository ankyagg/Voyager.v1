// src/lib/firebase.ts
// ARCHITECTURE: Uses Firebase for Authentication and Firestore for Database.
// NOTE: Storage (Images) are handled via Appwrite (see src/lib/storage.ts).

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// …import any other products you’ll use…

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

export const analytics = getAnalytics(app);
export const db = getFirestore(app);        // export whatever other SDKs you need
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// --- Firestore schema typings ------------------------------------------------
// These interfaces mirror the structure of documents stored in the database.  
// They help provide compile‑time safety when reading/writing data.

export interface User {
  displayName: string;
  email: string;
  photoURL?: string;
  createdAt: Date;
  // add more fields as your profile expands
}

export interface Trip {
  title: string;
  host: string;              // userId
  participants: string[];
  startDate: Date;
  endDate: Date;
  baseLocation: { name: string; lat: number; lng: number };
  status: "draft" | "confirmed" | "cancelled";
  budgetTotal: number;
  currency: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ItineraryItem {
  day?: number;               // optional day index relative to trip
  order: number;              // sort key within a day
  type: "flight" | "hotel" | "activity" | "transport";
  title: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  location?: { name: string; lat: number; lng: number };
  url?: string;
}

export interface Expense {
  category: string;
  amount: number;
  paidBy: string;            // userId of payer
  date: Date;
  description?: string;
  participants: string[];    // who shared this cost
  splitType: "equal" | "shares" | "percent";
  shares?: Record<string, number>;
  settled?: boolean;
}

export interface Message {
  author: string;
  text: string;
  createdAt: Date;
  replyTo?: string;          // message id
}

export interface Destination {
  name: string;
  location: string;
  coords?: { lat: number; lng: number };
  category: string;
  rating?: number;
  reviewsCount?: number;
  imageUrl?: string;
}

// --- convenience helpers ------------------------------------------------------
import {
  collection,
  CollectionReference,
  doc,
} from "firebase/firestore";

export const usersCollection = () =>
  collection(db, "users") as CollectionReference<User>;

export const tripsCollection = () =>
  collection(db, "trips") as CollectionReference<Trip>;

export const itineraryCollection = (tripId: string) =>
  collection(db, `trips/${tripId}/itinerary`) as CollectionReference<ItineraryItem>;

export const expensesCollection = (tripId: string) =>
  collection(db, `trips/${tripId}/expenses`) as CollectionReference<Expense>;

export const messagesCollection = (tripId: string) =>
  collection(db, `trips/${tripId}/messages`) as CollectionReference<Message>;

export const destinationsCollection = () =>
  collection(db, "globalDestinations") as CollectionReference<Destination>;

// helper to reference a specific trip document
export const tripDoc = (tripId: string) => doc(db, "trips", tripId);

// ...add more helpers as needed for queries, etc. ...