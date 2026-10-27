import React, { useRef, useState } from 'react';
import { createNote, documentToNotes, NOTE_COLORS, NOTE_HEIGHT, NOTE_WIDTH, StickyNote, useCanvasStore } from './canvasStorage';
import { load } from './storage';
import './Canvas.css';

function Note({ note, onDelete, autoFocus }: {
  note: StickyNote;
  onDelete: (note: StickyNote) => void;
  autoFocus: boolean;
}) {
  const updateNote = useCanvasStore(state => state.updateNote);
  const drag = useRef<{ pointer: number; x: number; y: number; left: number; top: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const move = (x: number, y: number) => updateNote(note.id, { x: Math.max(16, x), y: Math.max(16, y) });

  return (
    <article className={`sticky-note sticky-${note.color}${dragging ? ' is-dragging' : ''}`}
      style={{ left: note.x, top: note.y }} aria-label="Sticky note">
      <div className="sticky-heading">
        <button type="button" className="sticky-drag" aria-label="Move sticky note"
          title="Drag to move, or use arrow keys (Shift for bigger steps)"
          onPointerDown={event => {
            if (event.button !== 0) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            drag.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY, left: note.x, top: note.y };
            setDragging(true);
          }}
          onPointerMove={event => {
            const start = drag.current;
            if (start && start.pointer === event.pointerId) {
              move(start.left + event.clientX - start.x, start.top + event.clientY - start.y);
            }
          }}
          onPointerUp={event => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
            drag.current = null;
            setDragging(false);
          }}
          onLostPointerCapture={() => { drag.current = null; setDragging(false); }}
          onPointerCancel={() => { drag.current = null; setDragging(false); }}
          onKeyDown={event => {
            const step = event.shiftKey ? 40 : 10;
            const directions: Record<string, [number, number]> = {
              ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step],
            };
            const direction = directions[event.key];
            if (direction) {
              event.preventDefault();
              move(note.x + direction[0], note.y + direction[1]);
            }
          }}>
          <span aria-hidden="true">⠿</span> <span>Drag note</span>
        </button>
        <button type="button" className="sticky-delete" aria-label="Delete sticky note"
          onClick={() => onDelete(note)} title="Delete note">×</button>
      </div>
      <textarea aria-label="Sticky note text" placeholder="Write a thought…" value={note.text}
        autoFocus={autoFocus} onChange={event => updateNote(note.id, { text: event.target.value })} />
      <div className="sticky-colors" role="group" aria-label="Note color">
        {NOTE_COLORS.map(color => (
          <button type="button" key={color} className={`color-swatch sticky-${color}`}
            aria-label={`${color} note`} aria-pressed={note.color === color}
            onClick={() => updateNote(note.id, { color })} />
        ))}
      </div>
    </article>
  );
}

export default function Canvas() {
  const { notes, addNote, addNotes, removeNote } = useCanvasStore();
  const viewport = useRef<HTMLDivElement>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [deleted, setDeleted] = useState<StickyNote | null>(null);
  const [message, setMessage] = useState('');

  function addSticky() {
    const note = createNote('', notes.length);
    // New notes appear in the visible area, even on a scrolled board.
    const view = viewport.current;
    note.x = (view?.scrollLeft || 0) + 40 + (notes.length % 3) * 28;
    note.y = (view?.scrollTop || 0) + 40 + (notes.length % 3) * 28;
    addNote(note);
    setFocusId(note.id);
    setMessage('Sticky note added.');
  }

  function copyDocument() {
    const copied = documentToNotes(load(), notes.length);
    addNotes(copied);
    setMessage(copied.length ? `${copied.length} text blocks copied. Your original document is unchanged.` : 'No text to copy. Your original document is unchanged.');
    if (copied.length) {
      const view = viewport.current;
      view?.scrollTo({ left: copied[0].x - 24, top: copied[0].y - 24 });
    }
  }

  const width = Math.max(1200, ...notes.map(note => note.x + NOTE_WIDTH + 120));
  const height = Math.max(900, ...notes.map(note => note.y + NOTE_HEIGHT + 120));

  return (
    <section className="canvas-workspace" aria-label="Sticky note canvas">
      <div className="canvas-toolbar">
        <div>
          <h1>Your canvas</h1>
          <p>Room for every little thought. Drag notes to make it yours.</p>
        </div>
        <div className="canvas-actions">
          <button type="button" className="canvas-button" onClick={copyDocument}
            title="Copy text blocks as notes, leaving the original document and formatting untouched">
            Copy document to canvas
          </button>
          <button type="button" className="canvas-button primary" onClick={addSticky}>+ Add sticky note</button>
        </div>
      </div>
      <div className="canvas-status" role="status">
        <span>{message || `${notes.length} ${notes.length === 1 ? 'note' : 'notes'} · Saved on this device`}</span>
        {deleted && <button type="button" onClick={() => {
          addNote(deleted);
          setDeleted(null);
          setMessage('Note restored.');
        }}>Undo delete</button>}
      </div>
      <div className="canvas-viewport" ref={viewport} tabIndex={0} aria-label="Scrollable canvas">
        <div className="canvas-board" style={{ width, height }}>
          {notes.length === 0 && <div className="canvas-empty">
            <span aria-hidden="true">✦</span>
            <h2>A little space to think freely</h2>
            <p>Add a sticky note, or copy your document’s text here.<br />Your document will stay just as you left it.</p>
            <button type="button" className="canvas-button primary" onClick={addSticky}>+ Add your first note</button>
          </div>}
          {notes.map(note => <Note key={note.id} note={note} autoFocus={note.id === focusId}
            onDelete={removed => {
              removeNote(removed.id);
              setDeleted(removed);
              setMessage('Note deleted.');
            }} />)}
        </div>
      </div>
      <p className="canvas-footnote">Everything stays in this browser · Copying brings text only, not images or formatting</p>
    </section>
  );
}
