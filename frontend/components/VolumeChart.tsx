"use client";

import React from "react";

interface VolumeChartProps {
    data: {
        week: string; // e.g. "Week 1", "Week 2"
        volume: number;
    }[];
}

export default function VolumeChart({ data }: VolumeChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-100 border-dashed">
                <p className="text-gray-500 text-sm">No volume data available.</p>
            </div>
        );
    }

    const maxVolume = Math.max(...data.map(d => d.volume));
    // Provide a minimum maxVolume to avoid divide by zero if all values are 0
    const chartMax = maxVolume > 0 ? maxVolume : 1;

    return (
        <div className="w-full h-64 flex flex-col pt-4">
            <div className="flex-1 flex items-end space-x-2 sm:space-x-4 mb-2">
                {data.map((item, index) => {
                    const heightPercentage = Math.max((item.volume / chartMax) * 100, 2); // Min 2% height for visibility

                    return (
                        <div key={index} className="flex-1 flex flex-col justify-end h-full">
                            <div className="w-full flex justify-center mb-1 group relative">
                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                                    {item.volume.toLocaleString()} kg
                                </div>
                                {/* Bar */}
                                <div
                                    className="w-full bg-blue-500 rounded-t-sm transition-all duration-300 hover:bg-blue-600"
                                    style={{ height: `${heightPercentage}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>
            {/* X-Axis Labels */}
            <div className="flex space-x-2 sm:space-x-4 border-t border-gray-200 pt-2">
                {data.map((item, index) => (
                    <div key={index} className="flex-1 text-center">
                        <span className="text-[10px] sm:text-xs text-gray-500 font-medium truncate block">
                            {item.week}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
