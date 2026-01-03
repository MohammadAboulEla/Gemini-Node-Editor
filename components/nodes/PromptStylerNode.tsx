import React, { useMemo, useEffect, useState } from 'react';
import { NodeContentProps } from './types';
import { getStyleFiles, getStylesForFile, fetchStyles } from '../../services/styleService';

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

    return (
        <div className="p-2 h-full flex flex-col gap-2">
            <textarea
                className="w-full flex-grow min-h-[60px] p-2 bg-slate-900 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm resize-none select-text"
                placeholder="Base prompt..."
                value={userPrompt}
                onChange={(e) => updateNodeData(node.id, { userPrompt: e.target.value })}
            />
            
            <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Category</label>
                <select
                    className="w-full p-1.5 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500 text-xs"
                    value={selectedFile}
                    onChange={handleFileChange}
                >
                    {files.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
            </div>

            <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Style</label>
                <select
                    className="w-full p-1.5 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500 text-xs disabled:opacity-50"
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
    );
};
