import React, {StrictMode, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Upload} from 'lucide-react';
import {MathQuestionInput, type MathQuestionInputHandle} from '../../src/components/ui/MathQuestionInput';
import '../../src/index.css';

function Fixture() {
  const ref = useRef<MathQuestionInputHandle>(null);
  const [value, setValue] = useState('');
  const [sent, setSent] = useState('');
  const [disabled, setDisabled] = useState(false);
  return <div className="p-4 max-w-4xl">
    <div className="flex min-h-[72px] items-center gap-2 rounded-xl border border-slate-300 bg-white px-2 py-2">
      <button aria-label="Upload question image" className="flex h-10 w-10 shrink-0 items-center justify-center"><Upload className="h-5 w-5"/></button>
      <MathQuestionInput ref={ref} value={value} disabled={disabled} onChange={setValue} onSubmit={() => {setSent(value); setValue('');}} onPaste={() => {}}/>
    </div>
    <button onClick={() => ref.current?.insertLatex('\\frac{a}{b}')}>Fraction</button>
    <button onClick={() => ref.current?.insertLatex('\\sqrt{x}')}>Root</button>
    <button onClick={() => ref.current?.insertLatex('x^2')}>Power</button>
    <button onClick={() => setDisabled(!disabled)}>Toggle disabled</button>
    <output data-testid="value">{value}</output>
    <output data-testid="sent">{sent}</output>
  </div>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><Fixture/></StrictMode>);
