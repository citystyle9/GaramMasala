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
  getDoc,
  getDocs,
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
const SHARED_TEMPLATES_DOC = 'templatesList';

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
    activeTemplateName: activeTemplateName || 'گرم مصالحہ (روایتی فارمولا)',
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
 * Direct one-time fetch of all shared templates from Cloud Firestore
 * Ensures instant template availability on fresh browser sessions without waiting for snapshot
 */
export async function fetchSharedTemplatesOnce(): Promise<RecipeTemplate[]> {
  const templatesMap = new Map<string, RecipeTemplate>();

  try {
    // 1. Try unified list document first (fastest single-doc read)
    const listDocRef = doc(db, 'shared', SHARED_TEMPLATES_DOC);
    const listSnap = await getDoc(listDocRef);
    if (listSnap.exists()) {
      const data = listSnap.data();
      if (Array.isArray(data.templates)) {
        data.templates.forEach((t: RecipeTemplate) => {
          if (t && t.id && t.name) {
            templatesMap.set(t.id, t);
          }
        });
      }
    }
  } catch (err) {
    console.warn('Direct read of shared templatesList doc failed/offline:', err);
  }

  try {
    // 2. Also check sharedTemplates collection to merge any independently saved templates
    const colRef = collection(db, 'sharedTemplates');
    const colSnap = await getDocs(colRef);
    colSnap.forEach((docSnap) => {
      const d = docSnap.data();
      if (d && d.id && d.name) {
        templatesMap.set(d.id, {
          id: d.id,
          name: d.name,
          createdAt: d.createdAt || '',
          spices: d.spices || [],
        });
      }
    });
  } catch (err) {
    console.warn('Direct read of sharedTemplates collection failed/offline:', err);
  }

  const result = Array.from(templatesMap.values());
  result.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  return result;
}

/**
 * Real-time listener for shared saved templates
 * Listens to both the unified templatesList document and the sharedTemplates collection
 */
export function subscribeSharedTemplates(
  onData: (templates: RecipeTemplate[]) => void
): Unsubscribe {
  const colRef = collection(db, 'sharedTemplates');
  const listDocRef = doc(db, 'shared', SHARED_TEMPLATES_DOC);

  let listDocTemplates: RecipeTemplate[] = [];
  let colTemplates: RecipeTemplate[] = [];

  const emitMerged = () => {
    const map = new Map<string, RecipeTemplate>();
    // Add from listDoc
    listDocTemplates.forEach((t) => {
      if (t && t.id) map.set(t.id, t);
    });
    // Add/merge from collection
    colTemplates.forEach((t) => {
      if (t && t.id) map.set(t.id, t);
    });

    const merged = Array.from(map.values());
    merged.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    if (merged.length > 0) {
      onData(merged);
    }
  };

  // Listener 1: Unified Document
  const unsubDoc = onSnapshot(
    listDocRef,
    (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (Array.isArray(d.templates)) {
          listDocTemplates = d.templates;
          emitMerged();
        }
      }
    },
    (err) => console.warn('templatesList snapshot notice:', err)
  );

  // Listener 2: Collection
  const unsubCol = onSnapshot(
    colRef,
    (snapshot) => {
      const list: RecipeTemplate[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        if (d && d.id && d.name) {
          list.push({
            id: d.id,
            name: d.name,
            createdAt: d.createdAt || '',
            spices: d.spices || [],
          });
        }
      });
      colTemplates = list;
      emitMerged();
    },
    (error: any) => {
      console.warn('sharedTemplates collection snapshot notice:', error);
    }
  );

  return () => {
    unsubDoc();
    unsubCol();
  };
}

/**
 * Save full list of templates to Shared Cloud Firestore
 */
export async function saveSharedTemplatesList(
  templates: RecipeTemplate[]
): Promise<void> {
  const path = `shared/${SHARED_TEMPLATES_DOC}`;
  const docRef = doc(db, 'shared', SHARED_TEMPLATES_DOC);

  try {
    await setDoc(docRef, {
      templates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    if (error?.code === 'unavailable') {
      console.warn('Offline cache active for shared templates list save:', path);
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Save a single recipe template to Shared Cloud Firestore (both in collection and list)
 */
export async function saveSharedTemplate(
  template: RecipeTemplate,
  currentAllTemplates?: RecipeTemplate[]
): Promise<void> {
  const path = `sharedTemplates/${template.id}`;
  const docRef = doc(db, 'sharedTemplates', template.id);

  const payload = {
    id: template.id,
    name: template.name,
    createdAt: template.createdAt || new Date().toISOString(),
    spices: template.spices,
  };

  try {
    await setDoc(docRef, payload);
  } catch (error: any) {
    if (error?.code === 'unavailable') {
      console.warn('Offline cache active for shared template save:', path);
    } else {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  // Also update the unified templatesList document so all browsers see it instantly
  if (currentAllTemplates && Array.isArray(currentAllTemplates)) {
    const updatedList = [
      template,
      ...currentAllTemplates.filter((t) => t.id !== template.id),
    ];
    await saveSharedTemplatesList(updatedList).catch(console.warn);
  }
}

/**
 * Delete a recipe template from Shared Cloud Firestore
 */
export async function deleteSharedTemplate(
  templateId: string,
  currentAllTemplates?: RecipeTemplate[]
): Promise<void> {
  const path = `sharedTemplates/${templateId}`;
  const docRef = doc(db, 'sharedTemplates', templateId);

  try {
    await deleteDoc(docRef);
  } catch (error: any) {
    if (error?.code === 'unavailable') {
      console.warn('Offline cache active for shared template delete:', path);
    } else {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  if (currentAllTemplates && Array.isArray(currentAllTemplates)) {
    const updatedList = currentAllTemplates.filter((t) => t.id !== templateId);
    await saveSharedTemplatesList(updatedList).catch(console.warn);
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

