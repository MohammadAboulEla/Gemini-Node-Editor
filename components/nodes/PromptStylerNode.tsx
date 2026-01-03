import React, { useMemo, useEffect, useState } from 'react';
import { NodeContentProps } from './types';
import { getStyleFiles, getStylesForFile, fetchStyles } from '../../services/styleService';
import { MagicWandIcon } from '../icons';

export const PromptStylerNode: React.FC<NodeContentProps> = ({ node, updateNodeData }) => {
    const { 
        userPrompt = '', 
        selectedFile = 'Art', 
        selectedStyleName = 'none' 
    } = node.data;

    const [loading, setLoading] = useState(false);
    const files = useMemo(() => getStyleFiles(), []);
    const styles = useMemo(() => getStylesForFile(selectedFile), [selectedFile, loading]);

    // Fetch styles for the selected file if not already cached
    useEffect(() => {
        const ensureStyles = async () => {
            if (getStylesForFile(selectedFile).length === 0) {
                setLoading(true);
                await fetchStyles(selectedFile);
                setLoading(false);
            }
        };
        ensureStyles();
    }, [selectedFile]);

    // Validation effect: ensure selected category is valid
    useEffect(() => {
        if (!files.includes(selectedFile)) {
            const defaultFile = files.find(f => f === 'Art') || files[0];
            updateNodeData(node.id, { selectedFile: defaultFile });
        }
    }, [files, selectedFile, node.id, updateNodeData]);

    const handleFileChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newFile = e.target.value;
        // Optimization: Reset style name to 'none' or first available when file changes
        updateNodeData(node.id, { 
            selectedFile: newFile, 
            selectedStyleName: 'none' 
        });
    };

    const handleMergeStyle = () => {
        if (selectedStyleName === 'none') return;

        let stylizedText = userPrompt;
        const availableStyles = getStylesForFile(selectedFile);
        let styleToApply = selectedStyleName;

        // If random, pick one now to bake it in
        if (selectedStyleName === 'random') {
            const filteredStyles = availableStyles.filter(s => 
                s.name.toLowerCase() !== 'none' && 
                s.name.toLowerCase() !== 'random'
            );
            if (filteredStyles.length > 0) {
                const randomIndex = Math.floor(Math.random() * filteredStyles.length);
                styleToApply = filteredStyles[randomIndex].name;
            } else {
                styleToApply = 'none';
            }
        }

        if (styleToApply !== 'none') {
            const selectedStyle = availableStyles.find(s => s.name === styleToApply);
            if (selectedStyle && selectedStyle.prompt) {
                if (selectedStyle.prompt.includes('{prompt}')) {
                    stylizedText = selectedStyle.prompt.replace('{prompt}', userPrompt);
                } else {
                    stylizedText = userPrompt.trim() 
                        ? `${userPrompt.trim()}, ${selectedStyle.prompt}` 
                        : selectedStyle.prompt;
                }
            }
        }

        updateNodeData(node.id, {
            userPrompt: stylizedText,
            selectedStyleName: 'none'
        });
    };

    return (
        <div className="p-2 h-full flex flex-col gap-2">
            <textarea
                className="w-full flex-grow min-h-[60px] p-2 bg-slate-900 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm resize-none select-text"
                placeholder="Base prompt..."
                value={userPrompt}
                onChange={(e) => updateNodeData(node.id, { userPrompt: e.target.value })}
                onWheel={(e) => e.stopPropagation()}
            />
            
            <div className="flex flex-col gap-2 bg-slate-900/50 p-1.5 rounded-md border border-slate-700/50">
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Category</label>
                        <select
                            className="w-full p-1 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500 text-[11px]"
                            value={selectedFile}
                            onChange={handleFileChange}
                        >
                            {files.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Style</label>
                        <select
                            className="w-full p-1 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500 text-[11px] disabled:opacity-50"
                            value={selectedStyleName}
                            disabled={loading}
                            onChange={(e) => updateNodeData(node.id, { selectedStyleName: e.target.value })}
                        >
                            {loading ? (
                                <option>Loading...</option>
                            ) : (
                                styles.map(s => <option key={s.name} value={s.name}>{s.name}</option>)
                            )}
                        </select>
                    </div>
                </div>

                <button
                    onClick={handleMergeStyle}
                    disabled={selectedStyleName === 'none' || loading}
                    className="w-full py-1 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-[10px] font-bold rounded flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg"
                    title="Merge style into prompt and reset"
                >
                    <MagicWandIcon className="w-3 h-3" />
                    MERGE STYLE
                </button>
            </div>
        </div>
    );
};