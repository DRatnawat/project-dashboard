import React from 'react';
import { X } from 'lucide-react';
import { ChartType } from '../types';

// Add this interface definition to match the structure in App.tsx
interface FilterState {
  title: string;
  type: ChartType | '';
  minValue: string;
  maxValue: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  dataSources: string;
}

interface FilterPanelProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onClose: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ onClose, filters, setFilters }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Update the filters for date range
    setFilters({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [name]: value,
      },
    });
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
      <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-6 transform transition-transform duration-300 ease-in-out">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Filter Widgets</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <div className="flex gap-2">
              <input
                type="date"
                name="startDate"
                value={filters.dateRange.startDate}
                onChange={handleChange}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                name="endDate"
                value={filters.dateRange.endDate}
                onChange={handleChange}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          <button
            onClick={() =>
              setFilters({
                title: '',
                type: '',
                minValue: '',
                maxValue: '',
                dateRange: { startDate: '', endDate: '' },
                dataSources: ''
              })
            }
            className="w-full px-4 py-2 text-blue-500 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
