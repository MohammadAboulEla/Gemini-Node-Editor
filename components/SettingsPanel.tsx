import React, { useEffect, useRef, useState } from 'react';
import { CogIcon } from './icons';
import { getActiveModels, setActiveModels, getEngineSettings, setEngineSettings } from '../services/geminiService';

interface SettingsPanelProps {
    onClose: () => void;
}

const TEXT_MODELS = [
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (Fast)' },
    { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro (Complex Reasoning)' },
    { id: 'gemini-flash-lite-latest', name: 'Gemini Flash Lite' }
];

const IMAGE_MODELS = [
    { id: 'gemini-2.5-flash-image', name: 'Gemini 2.5 Flash Image' },
    { id: 'gemini-3-pro-image-preview', name: 'Gemini 3 Pro Image (High Quality)' }
];

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
    const panelRef = useRef<HTMLDivElement>(null);
    const [models, setModels] = useState(getActiveModels());
    const [engineSettings, setEngineSettingsState] = useState(getEngineSettings());

    // Close on escape key
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Close on backdrop click
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
            onClose();
        }
    };

    const handleModelChange = (type: 'textModel' | 'imageModel', value: string) => {
        const newModels = { ...models, [type]: value };
        setModels(newModels);
        setActiveModels(newModels.textModel, newModels.imageModel);
    };

    const handleCacheChange = (value: string) => {
        const useCache = value === 'true';
        setEngineSettingsState({ useCache });
        setEngineSettings(useCache);
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 z-[10000] flex justify-end"
            onClick={handleBackdropClick}
            aria-modal="true"
            role="dialog"
        >
            <div
                ref={panelRef}
                className="w-full max-w-sm h-full bg-slate-800 border-l border-slate-700 flex flex-col shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-slate-700">
                    <div className="flex items-center gap-2">
                        <CogIcon className="w-5 h-5 text-cyan-400" />
                        <h2 className="text-lg font-semibold">Settings</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-slate-700 transition-colors"
                        aria-label="Close settings panel"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>

                <div className="flex-grow p-6 space-y-8 overflow-y-auto">
                    <section className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">AI Text & Vision Model</h3>
                        <p className="text-xs text-slate-500">Used for image description and text reasoning tasks.</p>
                        <select
                            value={models.textModel}
                            onChange={(e) => handleModelChange('textModel', e.target.value)}
                            className="w-full p-2.5 bg-slate-900 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                        >
                            {TEXT_MODELS.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Image Generation Model</h3>
                        <p className="text-xs text-slate-500">Used for creating and editing images from prompts.</p>
                        <select
                            value={models.imageModel}
                            onChange={(e) => handleModelChange('imageModel', e.target.value)}
                            className="w-full p-2.5 bg-slate-900 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                        >
                            {IMAGE_MODELS.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Engine Behavior</h3>
                        <p className="text-xs text-slate-500">Control how the Gemini Engine handles identical inputs.</p>
                        <select
                            value={String(engineSettings.useCache)}
                            onChange={(e) => handleCacheChange(e.target.value)}
                            className="w-full p-2.5 bg-slate-900 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                        >
                            <option value="false">Always Regenerate (Default)</option>
                            <option value="true">Return Same Result (Use Cache)</option>
                        </select>
                    </section>

                    <section className="pt-8 border-t border-slate-700">
                        <p className="text-[10px] text-slate-600 text-center leading-relaxed">
                            Persistence: Settings are saved locally to your browser.<br/>
                            Model changes take effect immediately on next run.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;