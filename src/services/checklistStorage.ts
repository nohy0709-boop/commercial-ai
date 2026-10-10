import AsyncStorage from '@react-native-async-storage/async-storage';

const CHECKLIST_STORAGE_KEY = 'ai_checklists';

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  parentId?: string;
}

export interface SavedChecklist {
  id: string;
  title: string;
  source: 'chatbot';
  sourceMessageId: string;

  businessName?: string;
  areaName?: string;

  items: ChecklistItem[];

  createdAt: string;
  updatedAt: string;
}

export async function getChecklists(): Promise<SavedChecklist[]> {
  try {
    const raw = await AsyncStorage.getItem(
      CHECKLIST_STORAGE_KEY,
    );

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch (error) {
    console.error(
      '체크리스트 조회 실패:',
      error,
    );

    return [];
  }
}

async function saveChecklists(
  checklists: SavedChecklist[],
) {
  await AsyncStorage.setItem(
    CHECKLIST_STORAGE_KEY,
    JSON.stringify(checklists),
  );
}

export async function getChecklistBySourceMessageId(
  sourceMessageId: string,
): Promise<SavedChecklist | null> {
  const checklists =
    await getChecklists();

  return (
    checklists.find(
      checklist =>
        checklist.sourceMessageId ===
        sourceMessageId,
    ) ?? null
  );
}

export async function saveChecklist(
  checklist: Omit<
    SavedChecklist,
    'id' | 'createdAt' | 'updatedAt'
  >,
): Promise<SavedChecklist> {
  const checklists =
    await getChecklists();

  const existing =
    checklists.find(
      item =>
        item.sourceMessageId ===
        checklist.sourceMessageId,
    );

  if (existing) {
    const updated: SavedChecklist = {
      ...existing,
      ...checklist,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt:
        new Date().toISOString(),
    };

    await saveChecklists(
      checklists.map(
        item =>
          item.id === existing.id
            ? updated
            : item,
      ),
    );

    return updated;
  }

  const now =
    new Date().toISOString();

  const newChecklist: SavedChecklist = {
    ...checklist,
    id: `checklist-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,
    createdAt: now,
    updatedAt: now,
  };

  await saveChecklists([
    newChecklist,
    ...checklists,
  ]);

  return newChecklist;
}

export async function updateChecklist(
  checklistId: string,
  updates: Partial<
    Pick<
      SavedChecklist,
      | 'title'
      | 'businessName'
      | 'areaName'
      | 'items'
    >
  >,
): Promise<SavedChecklist | null> {
  const checklists =
    await getChecklists();

  let updatedChecklist:
    | SavedChecklist
    | null = null;

  const updated =
    checklists.map(
      checklist => {
        if (
          checklist.id !==
          checklistId
        ) {
          return checklist;
        }

        updatedChecklist = {
          ...checklist,
          ...updates,
          updatedAt:
            new Date().toISOString(),
        };

        return updatedChecklist;
      },
    );

  await saveChecklists(
    updated,
  );

  return updatedChecklist;
}

export async function toggleChecklistItem(
  checklistId: string,
  itemId: string,
): Promise<SavedChecklist | null> {
  const checklists =
    await getChecklists();

  const target =
    checklists.find(
      checklist =>
        checklist.id ===
        checklistId,
    );

  if (!target) {
    return null;
  }

  const clickedItem =
    target.items.find(
      item =>
        item.id === itemId,
    );

  if (!clickedItem) {
    return null;
  }

  const nextChecked =
    !clickedItem.checked;

  let items =
    target.items.map(
      item =>
        item.id === itemId
          ? {
              ...item,
              checked:
                nextChecked,
            }
          : item,
    );

  const children =
    items.filter(
      item =>
        item.parentId ===
        itemId,
    );

  if (
    children.length > 0
  ) {
    items =
      items.map(
        item =>
          item.parentId ===
          itemId
            ? {
                ...item,
                checked:
                  nextChecked,
              }
            : item,
      );
  }

  if (
    clickedItem.parentId
  ) {
    const parentId =
      clickedItem.parentId;

    const siblings =
      items.filter(
        item =>
          item.parentId ===
          parentId,
      );

    const allChecked =
      siblings.length > 0 &&
      siblings.every(
        item =>
          item.checked,
      );

    items =
      items.map(
        item =>
          item.id ===
          parentId
            ? {
                ...item,
                checked:
                  allChecked,
              }
            : item,
      );
  }

  return updateChecklist(
    checklistId,
    {
      items,
    },
  );
}

export async function deleteChecklist(
  checklistId: string,
) {
  const checklists =
    await getChecklists();

  await saveChecklists(
    checklists.filter(
      checklist =>
        checklist.id !==
        checklistId,
    ),
  );
}

export async function getChecklistById(
  checklistId: string,
): Promise<SavedChecklist | null> {
  const checklists =
    await getChecklists();

  return (
    checklists.find(
      checklist =>
        checklist.id ===
        checklistId,
    ) ?? null
  );
}

export function getChecklistProgress(
  checklist: SavedChecklist,
) {
  const childItems =
    checklist.items.filter(
      item =>
        item.parentId,
    );

  const targetItems =
    childItems.length > 0
      ? childItems
      : checklist.items;

  const total =
    targetItems.length;

  const completed =
    targetItems.filter(
      item =>
        item.checked,
    ).length;

  const percent =
    total === 0
      ? 0
      : Math.round(
          (completed /
            total) *
            100,
        );

  return {
    total,
    completed,
    percent,
  };
}
