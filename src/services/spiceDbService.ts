/**
 * @file spiceDbService.ts
 * @description کلاؤڈ فائر اسٹور ڈیٹا سروس برائے مصالحہ آرگنائزر
 * Handles synchronization between local state and Cloud Firestore
 * with offline persistence, real-time snapshot listeners, and strict error reporting.
 */

import { 
  doc, 
  setDoc, 
  deleteDoc, 
  collection, 
  onSnapshot, 
  Unsubscribe 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { SpiceItem, RecipeTemplate } from '../types';

export interface UserRecipeStatePayload {
  userId: string;
  spices: SpiceItem[];
  activeTemplateName?: string;
  updatedAt: string;
}

/**
 * Save current active formulation to Cloud Firestore
 */
export async function saveUserRecipeState(
  userId: string, 
  spices: SpiceItem[], 
  activeTemplateName: string | null
): Promise<void> {
  const path = `users/${userId}/recipeState/current`;
  const docRef = doc(db, 'users', userId, 'recipeState', 'current');
  
  const payload: UserRecipeStatePayload = {
    userId,
    spices,
    activeTemplateName: activeTemplateName || 'معیاری مصالحہ مکسچر',
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(docRef, payload);
  } catch (error: any) {
    if (error?.code === 'unavailable') {
      console.warn('Offline cache active for recipe state save:', path);
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Real-time listener for current active recipe state
 */
export function subscribeUserRecipeState(
  userId: string,
  onData: (data: UserRecipeStatePayload | null) => void
): Unsubscribe {
  const path = `users/${userId}/recipeState/current`;
  const docRef = doc(db, 'users', userId, 'recipeState', 'current');

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onData(snapshot.data() as UserRecipeStatePayload);
      } else {
        onData(null);
      }
    },
    (error: any) => {
      if (error?.code === 'unavailable') {
        console.warn('Firestore offline notice for recipe state:', path);
        return;
      }
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * Real-time listener for user's saved templates collection
 */
export function subscribeUserTemplates(
  userId: string,
  onData: (templates: RecipeTemplate[]) => void
): Unsubscribe {
  const path = `users/${userId}/templates`;
  const colRef = collection(db, 'users', userId, 'templates');

  return onSnapshot(
    colRef,
    (snapshot) => {
      const templates: RecipeTemplate[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        templates.push({
          id: d.id,
          name: d.name,
          createdAt: d.createdAt,
          spices: d.spices || [],
        });
      });
      // Sort templates by creation time descending
      templates.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onData(templates);
    },
    (error: any) => {
      if (error?.code === 'unavailable') {
        console.warn('Firestore offline notice for templates:', path);
        return;
      }
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

/**
 * Save a recipe template to Cloud Firestore
 */
export async function saveTemplateToCloud(
  userId: string,
  template: RecipeTemplate
): Promise<void> {
  const path = `users/${userId}/templates/${template.id}`;
  const docRef = doc(db, 'users', userId, 'templates', template.id);

  const payload = {
    id: template.id,
    userId,
    name: template.name,
    createdAt: template.createdAt,
    spices: template.spices,
  };

  try {
    await setDoc(docRef, payload);
  } catch (error: any) {
    if (error?.code === 'unavailable') {
      console.warn('Offline cache active for template save:', path);
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete a recipe template from Cloud Firestore
 */
export async function deleteTemplateFromCloud(
  userId: string,
  templateId: string
): Promise<void> {
  const path = `users/${userId}/templates/${templateId}`;
  const docRef = doc(db, 'users', userId, 'templates', templateId);

  try {
    await deleteDoc(docRef);
  } catch (error: any) {
    if (error?.code === 'unavailable') {
      console.warn('Offline cache active for template delete:', path);
      return;
    }
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
