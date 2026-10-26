import React, {forwardRef, useEffect, useImperativeHandle, useRef} from 'react';
import {MathfieldElement} from 'mathlive';
import 'mathlive/fonts.css';
import './MathQuestionInput.css';

// Vite bundles these fonts locally; no external CDN or sound requests are needed.
MathfieldElement.fontsDirectory = null;
MathfieldElement.soundsDirectory = null;

export interface MathQuestionInputHandle {
  insertLatex: (latex: string) => void;
}

interface Props {
  value: string;
  disabled: boolean;
  onChange: (latex: string) => void;
  onSubmit: () => void;
  onPaste: (event: ClipboardEvent) => void;
}

export const MathQuestionInput = forwardRef<MathQuestionInputHandle, Props>(function MathQuestionInput(
  {value, disabled, onChange, onSubmit, onPaste}, ref,
) {
  const host = useRef<HTMLDivElement>(null);
  const field = useRef<MathfieldElement | null>(null);
  const handlers = useRef({onChange, onSubmit, onPaste});
  handlers.current = {onChange, onSubmit, onPaste};

  useEffect(() => {
    const editor = new MathfieldElement();
    editor.defaultMode = 'text';
    editor.smartMode = true;
    editor.mathVirtualKeyboardPolicy = 'manual';
    // Menu controls are hidden by CSS. The menuItems setter requires a mounted
    // field and must not run during construction.
    editor.setAttribute('aria-label', 'Type or upload your problem here');
    editor.setAttribute('placeholder', '\\text{Type or upload your problem here…}');
    editor.className = 'mayf-question-mathfield';
    const input = () => handlers.current.onChange(editor.value);
    const paste = (event: ClipboardEvent) => handlers.current.onPaste(event);
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
        event.preventDefault();
        event.stopPropagation();
        handlers.current.onSubmit();
      }
    };
    editor.addEventListener('input', input);
    editor.addEventListener('paste', paste);
    editor.addEventListener('keydown', keydown, true);
    host.current?.append(editor);
    field.current = editor;
    return () => {
      editor.removeEventListener('input', input);
      editor.removeEventListener('paste', paste);
      editor.removeEventListener('keydown', keydown, true);
      editor.remove();
      field.current = null;
    };
  }, []);

  useEffect(() => {
    if (field.current && field.current.value !== value) field.current.value = value;
  }, [value]);
  useEffect(() => { if (field.current) field.current.readOnly = disabled; }, [disabled]);
  useImperativeHandle(ref, () => ({
    insertLatex(latex) {
      const editor = field.current;
      if (!editor || editor.readOnly) return;
      editor.insert(latex, {mode: 'math', format: 'latex', focus: true, selectionMode: 'after'});
      handlers.current.onChange(editor.value);
    },
  }), []);

  return <div ref={host} className="min-w-0 flex-1 overflow-hidden"/>;
});
