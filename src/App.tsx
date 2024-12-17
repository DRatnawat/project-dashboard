import React, { useState, useMemo } from 'react';
import { Layout, Responsive, WidthProvider } from 'react-grid-layout';
import { PlusCircle, Filter } from 'lucide-react';
import { Widget, ChartType } from './types';
import AddWidgetForm from './components/AddWidgetForm';
import ChartWidget from './components/ChartWidget';
import FilterPanel from './components/FilterPanel';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

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

// Add type for layout
interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

const App: React.FC = () => {
  const [showForm, setShowForm] = useState<boolean>(false);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [filters, setFilters] = useState<FilterState>({
    title: '',
    type: '',
    minValue: '',
    maxValue: '',
    dateRange: {
      startDate: '',
      endDate: ''
    },
    dataSources: ''
  });

  const handleAddWidget = (newWidget: Omit<Widget, 'id'>) => {
    const widget: Widget = {
      ...newWidget,
      id: `widget-${Date.now()}`,
      layout: newWidget.layout || { x: 0, y: 0, w: 3, h: 3 }, // Fallback layout
    };
    setWidgets([...widgets, widget]);
  };

  const handleLayoutChange = (layout: Layout[]) => {
    const updatedWidgets = widgets.map(widget => {
      const newLayout = layout.find(l => l.i === widget.id);
      if (newLayout) {
        return {
          ...widget,
          layout: {
            x: newLayout.x,
            y: newLayout.y,
            w: newLayout.w,
            h: newLayout.h
          }
        };
      }
      return widget;
    });
    setWidgets(updatedWidgets);
  };

  const filteredWidgets = useMemo(() => {
    return widgets.filter(widget => {
      const titleMatch = widget.title.toLowerCase().includes(filters.title.toLowerCase());
      const typeMatch = !filters.type || widget.type === filters.type;
      const hasValueInRange = widget.data?.some(point => {
        const value = point.value;
        const minValue = filters.minValue ? parseFloat(filters.minValue) : -Infinity;
        const maxValue = filters.maxValue ? parseFloat(filters.maxValue) : Infinity;
        return value >= minValue && value <= maxValue;
      });

      return (
        titleMatch &&
        typeMatch &&
        ((!filters.minValue && !filters.maxValue) || hasValueInRange)
      );
    });
  }, [widgets, filters]);

  const getLayoutConfig = (widget: Widget): LayoutItem => ({
    i: widget.id || '',
    x: widget.layout?.x || 0,
    y: widget.layout?.y || 0,
    w: widget.layout?.w || 3,
    h: widget.layout?.h || 3,
    minW: 3,
    minH: 3
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Builder</h1>
            <div className="flex gap-4">
              <button
                onClick={() => setShowFilter(!showFilter)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-md transition-colors ${
                  showFilter
                    ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Filter size={20} />
                Filter
                {Object.values(filters).some(v => v !== '') && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-blue-200 text-blue-800 rounded-full">
                    Active
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                <PlusCircle size={20} />
                Add Widget
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {filteredWidgets.length === 0 ? (
          <div className="text-center py-12">
            {widgets.length === 0 ? (
              <>
                <h3 className="text-lg font-medium text-gray-900">No widgets yet</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by adding a new widget</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 mx-auto"
                >
                  <PlusCircle size={20} />
                  Add Widget
                </button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium text-gray-900">No matching widgets</h3>
                <p className="mt-1 text-sm text-gray-500">Try adjusting your filters</p>
                <button
                  onClick={() => setFilters({ title: '', type: '', minValue: '', maxValue: '', dateRange: { startDate: '', endDate: '' }, dataSources: '' })}
                  className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 mx-auto"
                >
                  Clear Filters
                </button>
              </>
            )}
          </div>
        ) : (
          <ResponsiveGridLayout
            className="layout"
            layouts={{
              lg: filteredWidgets.map(widget => getLayoutConfig(widget)),
              md: filteredWidgets.map(widget => getLayoutConfig(widget)),
              sm: filteredWidgets.map(widget => getLayoutConfig(widget)),
              xs: filteredWidgets.map(widget => getLayoutConfig(widget)),
              xxs: filteredWidgets.map(widget => getLayoutConfig(widget))
            }}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={100}
            onLayoutChange={handleLayoutChange}
            isDraggable
            isResizable
          >
            {filteredWidgets.map(widget => (
              <div key={widget.id}>
                <ChartWidget widget={widget} />
              </div>
            ))}
          </ResponsiveGridLayout>
        )}
      </main>

      {/* Add Widget Form */}
      {showForm && (
        <AddWidgetForm
          onAdd={handleAddWidget}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Filter Panel */}
      {showFilter && (
        <FilterPanel
          filters={filters}
          setFilters={setFilters}
          onClose={() => setShowFilter(false)}
        />
      )}
    </div>
  );
};

export default App;
