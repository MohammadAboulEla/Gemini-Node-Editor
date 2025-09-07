
import React, { useState, useRef, ReactNode, useMemo } from 'react';
import ReactDOM from 'react-dom';

interface TooltipProps {
    content: ReactNode;
    children: React.ReactElement;
    placement?: 'top' | 'right' | 'bottom' | 'left';
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, placement = 'right' }) => {
    const [visible, setVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const isDisabled = (children.props as { disabled?: boolean }).disabled;

    const showTooltip = () => {
        if (isDisabled || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        
        const gap = 8;
        let top = 0;
        let left = 0;

        switch (placement) {
            case 'top':
                top = rect.top - gap;
                left = rect.left + rect.width / 2;
                break;
            case 'bottom':
                top = rect.bottom + gap;
                left = rect.left + rect.width / 2;
                break;
            case 'left':
                top = rect.top + rect.height / 2;
                left = rect.left - gap;
                break;
            case 'right':
            default:
                top = rect.top + rect.height / 2;
                left = rect.right + gap;
                break;
        }

        setPosition({ top, left });
        setVisible(true);
    };

    const hideTooltip = () => {
        setVisible(false);
    };
    
    const tooltipStyle = useMemo((): React.CSSProperties => {
        const style: React.CSSProperties = {
            top: position.top,
            left: position.left,
            position: 'absolute',
        };
        switch (placement) {
            case 'top':
                style.transform = 'translateX(-50%) translateY(-100%)';
                break;
            case 'bottom':
                style.transform = 'translateX(-50%)';
                break;
            case 'left':
                style.transform = 'translateY(-50%) translateX(-100%)';
                break;
            case 'right':
            default:
                style.transform = 'translateY(-50%)';
                break;
        }
        return style;
    }, [position, placement]);

    const arrow = useMemo(() => {
        switch (placement) {
            case 'top':
                return <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-slate-700"></div>;
            case 'bottom':
                return <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-b-4 border-b-slate-700"></div>;
            case 'left':
                return <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-4 border-l-slate-700"></div>;
            case 'right':
            default:
                return <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-r-4 border-r-slate-700"></div>;
        }
    }, [placement]);

    return (
        <>
            <div
                ref={containerRef}
                onMouseEnter={showTooltip}
                onMouseLeave={hideTooltip}
                onFocus={showTooltip}
                onBlur={hideTooltip}
                style={{ display: 'inline-block' }}
            >
                {children}
            </div>
            {visible && ReactDOM.createPortal(
                <div
                    ref={tooltipRef}
                    className="z-50 bg-slate-700 text-white text-xs px-2 py-1 rounded-md shadow-lg pointer-events-none transition-opacity duration-200"
                    style={tooltipStyle}
                    role="tooltip"
                >
                    {content}
                    {arrow}
                </div>,
                document.body
            )}
        </>
    );
};

export default Tooltip;
