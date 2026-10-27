import { JSONContent } from '@tiptap/react';
import { nanoid } from 'nanoid';
import create from 'zustand';
import { persist } from 'zustand/middleware';

export const NOTE_COLORS = ['yellow', 'pink', 'blue', 'green'] as const;
export type NoteColor = typeof NOTE_COLORS[number];
export interface StickyNote {
  id: string;
  text: string;
  x: number;
  y: number;
  color: NoteColor;
}

export const NOTE_WIDTH = 244;
export const NOTE_HEIGHT = 244;

export function createNote(text = '', index = 0): StickyNote {
  return {
    id: nanoid(),
    text,
    x: 40 + (index % 4) * 280,
    y: 40 + Math.floor(index / 4) * 280,
    color: NOTE_COLORS[index % NOTE_COLORS.length],
  };
}

function blockText(block: JSONContent): string {
  if (block.type === 'text') return block.text || '';
  if (block.type === 'hardBreak') return '\n';
  const separator = ['bulletList', 'orderedList', 'taskList', 'listItem', 'taskItem', 'blockquote'].includes(block.type || '') ? '\n' : '';
  return (block.content || []).map(blockText).join(separator);
}

// Copy text only. The rich-text document (including images and formatting) is never changed.
export function documentToNotes(document: JSONContent, offset = 0): StickyNote[] {
  return (document.content || [])
    .map(blockText)
    .map(text => text.trim())
    .filter(Boolean)
    .map((text, index) => createNote(text, offset + index));
}

interface CanvasState {
  mode: 'document' | 'canvas';
  notes: StickyNote[];
  setMode: (mode: CanvasState['mode']) => void;
  addNote: (note: StickyNote) => void;
  addNotes: (notes: StickyNote[]) => void;
  updateNote: (id: string, changes: Partial<Omit<StickyNote, 'id'>>) => void;
  removeNote: (id: string) => void;
}

export const useCanvasStore = create<CanvasState>()(persist(
  (set) => ({
    mode: 'document',
    notes: [],
    setMode: mode => set({ mode }),
    addNote: note => set(state => ({ notes: [...state.notes, note] })),
    addNotes: notes => set(state => ({ notes: [...state.notes, ...notes] })),
    updateNote: (id, changes) => set(state => ({
      notes: state.notes.map(note => note.id === id ? { ...note, ...changes } : note),
    })),
    removeNote: id => set(state => ({ notes: state.notes.filter(note => note.id !== id) })),
  }),
  { name: 'tabspace-canvas', version: 1 }
));
