
import React, { useEffect, useRef, useState } from 'react';
import { CogIcon, CheckIcon } from './icons'; 
import { 
    getActiveModels, setActiveModels, 
    getEngineSettings, setEngineSettings, 
    clearAllSavedData
} from '../services/geminiService';

interface SettingsPanelProps {
    onClose: () => void;
}

const TEXT_MODELS = ['gemini-3-flash-preview', 'gemini-3-pro-preview', 'gemini-flash-lite-latest'];
const IMAGE_MODELS = ['gemini-2.5-flash-image', 'gemini-3-pro-image-preview'];

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
    const panelRef = useRef<HTMLDivElement>(null);
    const [models, setModels] = useState(getActiveModels());
    const [engineSettings, setEngineSettingsState] = useState(getEngineSettings());
    const [clearConfirmation, setClearConfirmation] = useState(false);

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

    const handleSettingChange = (key: keyof typeof engineSettings, value: boolean) => {
        const newSettings = { ...engineSettings, [key]: value };
        setEngineSettingsState(newSettings);
        setEngineSettings(newSettings.useCache, newSettings.restoreWorkflowOnLoad);
    };

    const handleClearAllData = () => {
        clearAllSavedData();
        setModels(getActiveModels());
        setEngineSettingsState(getEngineSettings());
        setClearConfirmation(true);
        setTimeout(() => setClearConfirmation(false), 2000);
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
                className="w-full max-sm:max-w-none max-w-sm h-full bg-slate-800 border-l border-slate-700 flex flex-col shadow-2xl"
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
                        <select
                            value={models.textModel}
                            onChange={(e) => handleModelChange('textModel', e.target.value)}
                            className="w-full p-2.5 bg-slate-900 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                        >
                            {TEXT_MODELS.map(id => (
                                <option key={id} value={id}>{id}</option>
                            ))}
                        </select>
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Image Generation Model</h3>
                        <select
                            value={models.imageModel}
                            onChange={(e) => handleModelChange('imageModel', e.target.value)}
                            className="w-full p-2.5 bg-slate-900 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                        >
                            {IMAGE_MODELS.map(id => (
                                <option key={id} value={id}>{id}</option>
                            ))}
                        </select>
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Engine Behavior</h3>
                        <div className="space-y-2">
                            <p className="text-xs text-slate-500">Node Execution Caching</p>
                            <select
                                value={String(engineSettings.useCache)}
                                onChange={(e) => handleSettingChange('useCache', e.target.value === 'true')}
                                className="w-full p-2.5 bg-slate-900 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                            >
                                <option value="false">Always Regenerate (Default)</option>
                                <option value="true">Return Same Result (Use Cache)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <p className="text-xs text-slate-500">Startup State</p>
                            <select
                                value={String(engineSettings.restoreWorkflowOnLoad)}
                                onChange={(e) => handleSettingChange('restoreWorkflowOnLoad', e.target.value === 'true')}
                                className="w-full p-2.5 bg-slate-900 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                            >
                                <option value="true">Restore Last Workflow</option>
                                <option value="false">Start Fresh</option>
                            </select>
                        </div>
                    </section>
                    
                    <section className="space-y-4 pt-8 border-t border-slate-700">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Data Management</h3>
                        <button
                            onClick={handleClearAllData}
                            className="w-full py-2 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-sm font-bold rounded flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg"
                        >
                            {clearConfirmation ? (
                                <span className="flex items-center gap-2"><CheckIcon className="w-4 h-4" /> Cleared!</span>
                            ) : (
                                'Clear Saved Workflow & Settings'
                            )}
                        </button>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;
