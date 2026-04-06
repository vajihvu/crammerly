// src/components/ui/StudyHeatmap.jsx
import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';

const StudyHeatmap = ({ activity = {} }) => {
    const [hoveredCell, setHoveredCell] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0, align: 'center' });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const today = new Date();
    const cells = [];

    // Last 24 weeks (~6 months)
    for (let i = 0; i < 24 * 7; i++) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const intensity = activity[dateStr] || 0;
        cells.push({ date: dateStr, intensity });
    }

    // Calculate month labels
    const monthLabels = [];
    let currentMonth = -1;
    const reversedCells = [...cells].reverse();

    for (let i = 0; i < reversedCells.length; i += 7) {
        const d = new Date(reversedCells[i].date);
        const month = d.getMonth();
        if (month !== currentMonth) {
            monthLabels.push({ label: months[month], index: i / 7 });
            currentMonth = month;
        }
    }

    return (
        <div className="bg-brand-surface rounded-[24px] p-5 border border-brand-border shadow-premium">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand-primary/10 rounded-xl flex items-center justify-center border border-brand-primary/20">
                        <CheckCircle size={14} className="text-brand-primary" />
                    </div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-text-dim">Study History</h4>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[8px] font-bold text-brand-text-dim uppercase tracking-widest opacity-40">Less</span>
                    <div className="flex gap-1">
                        <div className="w-2.5 h-2.5 bg-brand-card border border-brand-border rounded-[2px]"></div>
                        <div className="w-2.5 h-2.5 bg-brand-primary/30 rounded-[2px]"></div>
                        <div className="w-2.5 h-2.5 bg-brand-primary/60 rounded-[2px]"></div>
                        <div className="w-2.5 h-2.5 bg-brand-primary rounded-[2px]"></div>
                    </div>
                    <span className="text-[8px] font-bold text-brand-text-dim uppercase tracking-widest opacity-40">More</span>
                </div>
            </div>

            <div className="relative">
                {/* Month Labels */}
                <div className="flex mb-2 h-4 relative">
                    {(monthLabels || []).map((m, idx) => (
                        <span
                            key={idx}
                            className="absolute text-[8px] font-black text-brand-text-dim uppercase tracking-widest opacity-50"
                            style={{ left: `${(m.index / 24) * 100}%` }}
                        >
                            {m.label}
                        </span>
                    ))}
                </div>

                <div className="grid grid-flow-col grid-rows-7 gap-1.5 overflow-x-auto no-scrollbar pb-2">
                    {(reversedCells || []).map((cell, idx) => {
                        const intensityClass = cell.intensity === 0
                            ? 'bg-brand-card border border-brand-border'
                            : cell.intensity < 3 ? 'bg-brand-primary/30' :
                                cell.intensity < 6 ? 'bg-brand-primary/60' : 'bg-brand-primary';
                        return (
                            <div
                                key={idx}
                                className={`w-3.5 h-3.5 rounded-[3px] transition-all hover:scale-125 hover:shadow-accent cursor-help ${intensityClass}`}
                                onMouseEnter={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const containerRect = e.currentTarget.closest('.relative').getBoundingClientRect();
                                    const x = rect.left - containerRect.left + (rect.width / 2);
                                    const isFarLeft = x < 80;
                                    const isFarRight = x > containerRect.width - 80;

                                    setHoveredCell(cell);
                                    setTooltipPos({
                                        x,
                                        y: rect.top - containerRect.top - 12,
                                        align: isFarLeft ? 'left' : isFarRight ? 'right' : 'center'
                                    });
                                }}
                                onMouseLeave={() => setHoveredCell(null)}
                            />
                        );
                    })}
                </div>

                {/* Premium Tooltip */}
                {hoveredCell && (
                    <div
                        className="absolute z-[250] pointer-events-none animate-in fade-in zoom-in duration-200"
                        style={{
                            left: `${tooltipPos.x}px`,
                            top: `${tooltipPos.y}px`,
                            transform: tooltipPos.align === 'left' ? 'translate(-20%, -100%)' :
                                tooltipPos.align === 'right' ? 'translate(-80%, -100%)' :
                                    'translate(-50%, -100%)'
                        }}
                    >
                        <div className="bg-brand-primary text-brand-bg px-3 py-1.5 rounded-xl shadow-premium border border-white/10 whitespace-nowrap relative">
                            <div className="flex flex-col items-center gap-0.5">
                                <span className="text-[8px] font-black uppercase tracking-widest opacity-60">
                                    {new Date(hoveredCell.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-widest">
                                    {hoveredCell.intensity} activities
                                </span>
                            </div>
                            {/* Intelligent Pointer Arrow */}
                            <div
                                className={`absolute top-full -mt-1 transition-all duration-300 ${tooltipPos.align === 'left' ? 'left-[20%]' :
                                    tooltipPos.align === 'right' ? 'right-[20%]' :
                                        'left-1/2'
                                    }`}
                                style={{ transform: tooltipPos.align === 'center' ? 'translateX(-50%)' : 'none' }}
                            >
                                <div className="border-8 border-transparent border-t-brand-primary"></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudyHeatmap;
