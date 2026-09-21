/**
 * @file spiceDbService.ts
 * @description کلاؤڈ فائر اسٹور مشترکہ ڈیٹا سروس برائے مصالحہ آرگنائزر
 * Handles shared live synchronization between devices and Cloud Firestore
 * without requiring any user authentication, passwords, or separate accounts.
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

export interface SharedRecipeStatePayload {
  spices: SpiceItem[];
  activeTemplateName?: string;
  updatedAt: string;
}

const SHARED_RECIPE_DOC = 'recipeState';

/**
 * Save current active formulation to Shared Cloud Firestore
 */
export async function saveSharedRecipeState(
  spices: SpiceItem[], 
  activeTemplateName: string | null
): Promise<void> {
  const path = `shared/${SHARED_RECIPE_DOC}`;
  const docRef = doc(db, 'shared', SHARED_RECIPE_DOC);
  
  const payload: SharedRecipeStatePayload = {
    spices,
    activeTemplateName: activeTemplateName || 'معیاری مصالحہ مکسچر',
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(docRef, payload);
  } catch (error: any) {
    if (error?.code === 'unavailable') {
      console.warn('Offline cache active for shared recipe state save:', path);
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Real-time listener for current active shared recipe state
 */
export function subscribeSharedRecipeState(
  onData: (data: SharedRecipeStatePayload | null) => void
): Unsubscribe {
  const path = `shared/${SHARED_RECIPE_DOC}`;
  const docRef = doc(db, 'shared', SHARED_RECIPE_DOC);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onData(snapshot.data() as SharedRecipeStatePayload);
      } else {
        onData(null);
      }
    },
    (error: any) => {
      if (error?.code === 'unavailable') {
        console.warn('Firestore offline notice for shared recipe state:', path);
        return;
      }
      if (error?.code === 'permission-denied') {
        console.warn('Firestore permission notice for shared recipe state (using local cache):', path);
        return;
      }
      console.warn('Firestore error in subscribeSharedRecipeState:', error);
    }
  );
}

/**
 * Real-time listener for shared saved templates collection
 */
export function subscribeSharedTemplates(
  onData: (templates: RecipeTemplate[]) => void
): Unsubscribe {
  const path = 'sharedTemplates';
  const colRef = collection(db, 'sharedTemplates');

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
        console.warn('Firestore offline notice for shared templates:', path);
        return;
      }
      if (error?.code === 'permission-denied') {
        console.warn('Firestore permission notice for shared templates (using local cache):', path);
        return;
      }
      console.warn('Firestore error in subscribeSharedTemplates:', error);
    }
  );
}

/**
 * Save a recipe template to Shared Cloud Firestore
 */
export async function saveSharedTemplate(
  template: RecipeTemplate
): Promise<void> {
  const path = `sharedTemplates/${template.id}`;
  const docRef = doc(db, 'sharedTemplates', template.id);

  const payload = {
    id: template.id,
    name: template.name,
    createdAt: template.createdAt,
    spices: template.spices,
  };

  try {
    await setDoc(docRef, payload);
  } catch (error: any) {
    if (error?.code === 'unavailable') {
      console.warn('Offline cache active for shared template save:', path);
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete a recipe template from Shared Cloud Firestore
 */
export async function deleteSharedTemplate(
  templateId: string
): Promise<void> {
  const path = `sharedTemplates/${templateId}`;
  const docRef = doc(db, 'sharedTemplates', templateId);

  try {
    await deleteDoc(docRef);
  } catch (error: any) {
    if (error?.code === 'unavailable') {
      console.warn('Offline cache active for shared template delete:', path);
      return;
    }
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Aliases for backwards compatibility
export const saveUserRecipeState = (_userId: string, spices: SpiceItem[], activeTemplateName: string | null) => 
  saveSharedRecipeState(spices, activeTemplateName);
export const subscribeUserRecipeState = (_userId: string, onData: (data: any) => void) => 
  subscribeSharedRecipeState(onData);
export const subscribeUserTemplates = (_userId: string, onData: (templates: RecipeTemplate[]) => void) => 
  subscribeSharedTemplates(onData);
export const saveTemplateToCloud = (_userId: string, template: RecipeTemplate) => 
  saveSharedTemplate(template);
export const deleteTemplateFromCloud = (_userId: string, templateId: string) => 
  deleteSharedTemplate(templateId);

