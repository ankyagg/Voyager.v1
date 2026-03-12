import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { auth, db, User as DbUser } from "../../lib/firebase";

interface AuthContextType {
  currentUser: FirebaseUser | null;
  dbUser: DbUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  dbUser: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubDb: (() => void) | null = null;
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const userRef = doc(db, "users", user.uid);
        unsubDb = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            setDbUser(docSnap.data() as DbUser);
          } else {
            try {
              console.log("Creating new user document in Firestore for:", user.uid);
              const newDbUser = {
                displayName: user.displayName || "Explorer",
                email: user.email || "",
                photoURL: user.photoURL || "",
                createdAt: new Date(),
              };
              await setDoc(userRef, newDbUser, { merge: true });
              console.log("Firestore User Document successfully created.");
            } catch (error) {
              console.error("Error creating Firestore User Document:", error);
            }
          }
          setLoading(false);
        }, (error) => {
          console.error("Firestore Snapshot Error:", error);
          setLoading(false);
        });
      } else {
        setDbUser(null);
        if (unsubDb) unsubDb();
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubDb) unsubDb();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, dbUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
