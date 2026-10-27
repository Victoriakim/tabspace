import { createNote, documentToNotes, useCanvasStore } from './canvasStorage';

jest.mock('nanoid', () => {
  let nextId = 0;
  return { nanoid: () => `note-${nextId++}` };
});

beforeEach(() => {
  localStorage.clear();
  useCanvasStore.setState({ mode: 'document', notes: [] });
});

test('copies nonempty text blocks without changing the original document', () => {
  const document = {
    type: 'doc',
    content: [
      { type: 'heading', content: [{ type: 'text', text: 'Ideas', marks: [{ type: 'bold' }] }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'One' }, { type: 'hardBreak' }, { type: 'text', text: 'Two' }] },
      { type: 'bulletList', content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'First' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Second' }] }] },
      ] },
      { type: 'image', attrs: { src: 'example.png' } },
      { type: 'paragraph' },
    ],
  };
  const before = JSON.stringify(document);
  const notes = documentToNotes(document);
  expect(notes.map(note => note.text)).toEqual(['Ideas', 'One\nTwo', 'First\nSecond']);
  expect(new Set(notes.map(note => note.id)).size).toBe(3);
  expect(JSON.stringify(document)).toBe(before);
});

test('lays out imported notes after existing notes', () => {
  const notes = documentToNotes({ content: [{ type: 'paragraph', content: [{ type: 'text', text: 'New' }] }] }, 4);
  expect(notes[0]).toMatchObject({ x: 40, y: 320 });
  expect(documentToNotes({})).toEqual([]);
});

test('persists mode, note text, color and position separately from the document', () => {
  localStorage.setItem('blocks', 'original document');
  const note = createNote();
  useCanvasStore.getState().addNote(note);
  useCanvasStore.getState().setMode('canvas');
  useCanvasStore.getState().updateNote(note.id, { text: 'Remember this', color: 'pink', x: 120, y: 200 });
  const saved = JSON.parse(localStorage.getItem('tabspace-canvas')).state;
  expect(saved.mode).toBe('canvas');
  expect(saved.notes[0]).toMatchObject({ text: 'Remember this', color: 'pink', x: 120, y: 200 });
  expect(localStorage.getItem('blocks')).toBe('original document');
  useCanvasStore.getState().removeNote(note.id);
  expect(useCanvasStore.getState().notes).toEqual([]);
  useCanvasStore.getState().addNote(saved.notes[0]);
  expect(useCanvasStore.getState().notes).toEqual(saved.notes);
});
