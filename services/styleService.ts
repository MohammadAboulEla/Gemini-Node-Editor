export interface StyleItem {
    name: string;
    prompt: string;
    negative_prompt?: string;
}

/**
 * List of available style files in the /yaml_files/ folder.
 * These correspond to the .yaml files provided in the project structure.
 */
const AVAILABLE_FILES = [
    "3D", "Art", "Artist", "Basic", "Craft", "Design",
    "Drawing", "Experimental", "Fashion", "Illustration", "Milehigh", "Mood",
    "Original", "Painting", "Photography", "Pixaroma", "Sculpture", "Vector"
];

// Cache to store parsed styles: { fileName: StyleItem[] }
const stylesCache: Record<string, StyleItem[]> = {};

/**
 * Parses a YAML-like string into StyleItem objects.
 * Designed to handle the specific format provided in the project's .yaml files.
 */
export const parseYamlStyles = (raw: string): StyleItem[] => {
    const items: StyleItem[] = [];
    // Split by the dash that starts a new list item
    const entries = raw.split(/\n-\s+/);
    
    entries.forEach(entry => {
        if (!entry.trim()) return;
        
        const lines = entry.split('\n');
        let name = '';
        let prompt = '';
        let negative_prompt = '';
        
        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('name:')) {
                name = trimmed.slice(5).trim().replace(/^['"]|['"]$/g, '');
            } else if (trimmed.startsWith('prompt:')) {
                prompt = trimmed.slice(7).trim().replace(/^['"]|['"]$/g, '');
            } else if (trimmed.startsWith('negative_prompt:')) {
                negative_prompt = trimmed.slice(16).trim().replace(/^['"]|['"]$/g, '');
            }
        });
        
        // Only add if at least a name exists
        if (name) {
            items.push({ name, prompt, negative_prompt });
        }
    });

    // Handle first item if file doesn't start with a newline before the first '-'
    if (items.length === 0 && raw.trim().startsWith('- name:')) {
        const lines = raw.split('\n');
        let name = '', prompt = '', negative_prompt = '';
        lines.forEach(line => {
            const t = line.trim();
            if (t.startsWith('- name:')) name = t.slice(7).trim().replace(/^['"]|['"]$/g, '');
            else if (t.startsWith('name:')) name = t.slice(5).trim().replace(/^['"]|['"]$/g, '');
            else if (t.startsWith('prompt:')) prompt = t.slice(7).trim().replace(/^['"]|['"]$/g, '');
            else if (t.startsWith('negative_prompt:')) negative_prompt = t.slice(16).trim().replace(/^['"]|['"]$/g, '');
        });
        if (name) items.push({ name, prompt, negative_prompt });
    }

    return items;
};

/**
 * Fetches and parses a style file, caching the result.
 */
export const fetchStyles = async (fileName: string): Promise<StyleItem[]> => {
    if (stylesCache[fileName]) return stylesCache[fileName];

    try {
        const response = await fetch(`/yaml_files/${fileName}.yaml`);
        if (!response.ok) throw new Error(`Failed to load ${fileName}.yaml`);
        const text = await response.text();
        const parsed = parseYamlStyles(text);
        stylesCache[fileName] = parsed;
        return parsed;
    } catch (error) {
        console.error(`Error loading style file ${fileName}:`, error);
        return [];
    }
};

export const getStyleFiles = () => AVAILABLE_FILES;

/**
 * Synchronous access to cached styles. 
 * Use fetchStyles first to ensure data is available.
 */
export const getStylesForFile = (fileName: string): StyleItem[] => {
    return stylesCache[fileName] || [];
};
