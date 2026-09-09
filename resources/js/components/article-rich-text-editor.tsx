import { AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, Code2, Italic, List, ListOrdered, Minus, Quote, Redo2, RemoveFormatting, Strikethrough, Subscript, Superscript, Underline, Undo2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';

interface ArticleRichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
}

interface EditorTool {
    label: string;
    icon: LucideIcon;
    command: string;
    value?: string;
}

const tools: EditorTool[] = [
    { label: 'Urungkan', icon: Undo2, command: 'undo' },
    { label: 'Ulangi', icon: Redo2, command: 'redo' },
    { label: 'Tebal', icon: Bold, command: 'bold' },
    { label: 'Miring', icon: Italic, command: 'italic' },
    { label: 'Garis bawah', icon: Underline, command: 'underline' },
    { label: 'Coret', icon: Strikethrough, command: 'strikeThrough' },
    { label: 'Rata kiri', icon: AlignLeft, command: 'justifyLeft' },
    { label: 'Rata tengah', icon: AlignCenter, command: 'justifyCenter' },
    { label: 'Rata kanan', icon: AlignRight, command: 'justifyRight' },
    { label: 'Rata penuh', icon: AlignJustify, command: 'justifyFull' },
    { label: 'Daftar bullet', icon: List, command: 'insertUnorderedList' },
    { label: 'Daftar bernomor', icon: ListOrdered, command: 'insertOrderedList' },
    { label: 'Kutipan', icon: Quote, command: 'formatBlock', value: 'blockquote' },
    { label: 'Garis horizontal', icon: Minus, command: 'insertHorizontalRule' },
    { label: 'Superscript', icon: Superscript, command: 'superscript' },
    { label: 'Subscript', icon: Subscript, command: 'subscript' },
    { label: 'Hapus format', icon: RemoveFormatting, command: 'removeFormat' },
];

export function ArticleRichTextEditor({ value, onChange }: ArticleRichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [sourceMode, setSourceMode] = useState(false);
    const [sourceValue, setSourceValue] = useState(value);

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value;
        }
    }, [value]);

    useEffect(() => {
        if (!sourceMode && editorRef.current && editorRef.current.innerHTML !== sourceValue) {
            editorRef.current.innerHTML = sourceValue;
        }
    }, [sourceMode, sourceValue]);

    const runCommand = (command: string, commandValue?: string) => {
        editorRef.current?.focus();
        document.execCommand(command, false, commandValue);
        onChange(editorRef.current?.innerHTML ?? '');
    };

    const preserveSelection = (event: MouseEvent<HTMLButtonElement>) => event.preventDefault();

    const toggleSourceMode = () => {
        if (!sourceMode) {
            setSourceValue(editorRef.current?.innerHTML ?? value);
        }

        setSourceMode((current) => !current);
    };

    return (
        <div className="overflow-hidden rounded-lg border border-input bg-background shadow-sm focus-within:ring-2 focus-within:ring-ring">
            <div className="sticky top-2 z-30 flex flex-wrap items-center gap-1 border-b bg-background p-2 shadow-md">
                <select aria-label="Gaya teks" defaultValue="p" onChange={(event) => runCommand('formatBlock', event.target.value)} className="h-9 rounded-md border bg-background px-2 text-xs font-medium outline-none">
                    <option value="p">Paragraf</option>
                    <option value="h1">Heading 1</option>
                    <option value="h2">Heading 2</option>
                    <option value="h3">Heading 3</option>
                    <option value="blockquote">Kutipan</option>
                </select>
                <select aria-label="Ukuran font" defaultValue="3" onChange={(event) => runCommand('fontSize', event.target.value)} className="h-9 rounded-md border bg-background px-2 text-xs font-medium outline-none">
                    <option value="2">Kecil</option>
                    <option value="3">Normal</option>
                    <option value="4">Besar</option>
                    <option value="5">Sangat besar</option>
                    <option value="6">Judul besar</option>
                </select>
                <label className="flex h-9 items-center gap-1 rounded-md border bg-background px-2 text-xs font-medium" title="Warna teks">
                    <span className="text-muted-foreground">Warna</span>
                    <input aria-label="Warna teks" type="color" defaultValue="#292524" onChange={(event) => runCommand('foreColor', event.target.value)} className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0" />
                </label>
                <span className="mx-1 h-6 w-px bg-border" />
                {tools.map(({ label, icon: Icon, command, value: commandValue }) => (
                    <button key={label} type="button" aria-label={label} title={label} onMouseDown={preserveSelection} onClick={() => runCommand(command, commandValue)} className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-accent-foreground">
                        <Icon className="h-4 w-4" />
                    </button>
                ))}
                <button type="button" aria-label={sourceMode ? 'Kembali ke editor visual' : 'Edit HTML'} title={sourceMode ? 'Kembali ke editor visual' : 'Edit HTML'} onClick={toggleSourceMode} className={`flex h-9 w-9 items-center justify-center rounded-md transition ${sourceMode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}>
                    <Code2 className="h-4 w-4" />
                </button>
            </div>
            {sourceMode ? <textarea aria-label="Sumber HTML artikel" value={sourceValue} onChange={(event) => {
                setSourceValue(event.target.value);
                onChange(event.target.value);
            }} className="min-h-[620px] w-full resize-y bg-slate-950 p-5 font-mono text-sm leading-7 text-emerald-300 outline-none" spellCheck={false} /> : <div ref={editorRef} contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label="Isi artikel" onInput={(event) => onChange(event.currentTarget.innerHTML)} className="min-h-[620px] px-5 py-4 text-[15px] leading-8 outline-none empty:before:text-muted-foreground empty:before:content-['Tulis_isi_artikel_di_sini...'] [&_blockquote]:my-5 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-5 [&_h1]:my-5 [&_h1]:text-4xl [&_h1]:font-black [&_h2]:my-4 [&_h2]:text-3xl [&_h2]:font-bold [&_h3]:my-3 [&_h3]:text-2xl [&_h3]:font-bold [&_ol]:list-decimal [&_ol]:pl-7 [&_p]:my-3 [&_ul]:list-disc [&_ul]:pl-7" />}
        </div>
    );
}
