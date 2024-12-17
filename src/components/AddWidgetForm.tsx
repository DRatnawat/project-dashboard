import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';
import { Widget } from '../types';

// Axios client configuration
const client = axios.create({
  baseURL: 'https://368c-103-83-254-78.ngrok-free.app/api/reports',
  headers: {
    'ngrok-skip-browser-warning': '69420',
    'Content-Type': 'application/json',
  },
});

type DataPoint = {
  dataSource: string;
  field: string;
  aggregation: string;
  metricSource: string;
  metric: string;
};

type ChartType = 'line' | 'bar' | 'area' | 'pie';

interface AddWidgetFormProps {
  onAdd: (newWidget: Omit<Widget, 'id'>) => void;
  onClose: () => void;
}

// Add new type definitions
type Payload = {
  entities: string[];
  fields: string[];
  join: string[];
  filters: string[];
  aggregations: string[];
};

const AddWidgetForm: React.FC<AddWidgetFormProps> = ({ onAdd, onClose }) => {
  const [title, setTitle] = useState<string>('');
  const [type, setType] = useState<ChartType>('line');
  const [dataPoint, setDataPoint] = useState<DataPoint>({
    dataSource: '',
    field: '',
    aggregation: '',
    metricSource: '',
    metric: '',
  });

  const [tables, setTables] = useState<string[]>([]);
  const [fields, setFields] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<string[]>([]);
  const [metricSources, setMetricSources] = useState<Array<{
    id: string;
    relationshipType: string;
    scolumn: string;
    ttable: string;
    stable: string;
    tcolumn: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metricFields, setMetricFields] = useState<string[]>([]);
  const [filterField, setFilterField] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');
  const [filterOperator, setFilterOperator] = useState<string>('='); // Default operator

  // Define filter operators with symbols
  const filterOperators = [
    { value: '=', label: 'Equals (=)' },
    { value: '!=', label: 'Not Equals (!=)' },
    { value: '>', label: 'Greater Than (>)' },
    { value: '<', label: 'Less Than (<)' },
    // Add more operators as needed
  ];

  // Add new state for filters
  const [filters, setFilters] = useState<{ field: string; operator: string; value: string }[]>([]);
  const [showFilterOptions, setShowFilterOptions] = useState<boolean>(false); // State to manage visibility

  // Function to handle adding a new filter
  const addFilter = () => {
    setFilters([...filters, { field: '', operator: '=', value: '' }]);
    setShowFilterOptions(true); // Show filter options when adding a new filter
  };

  // Function to handle removing a filter
  const removeFilter = (index: number) => {
    const updatedFilters = filters.filter((_, i) => i !== index);
    setFilters(updatedFilters);
  };

  // Function to handle filter change
  const handleFilterChange = (index: number, key: 'field' | 'operator' | 'value', value: string) => {
    const updatedFilters = [...filters];
    updatedFilters[index][key] = value;
    setFilters(updatedFilters);
  };

  // Fetch tables only once on mount
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await client.get('/fields');
        const uniqueTables = [...new Set(response.data.map((item: { entityName: string }) => item.entityName))] as string[];
        setTables(uniqueTables || []);
      } catch (error) {
        console.error('Error fetching tables:', error);
      }
    };

    fetchTables();
  }, []); // Empty dependency array means this runs once on mount

  // Update fetchDependentData to handle errors better
  const fetchDependentData = async (dataSource: string, metricSource?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      if (dataSource) {
        // Fetch fields for main data source
        try {
          const fieldsRes = await client.get(`/fields/${dataSource}`);
          if (fieldsRes.data) {
            setFields(fieldsRes.data.map((item: { columnName: string }) => item.columnName) || []);
          }
        } catch (error) {
          console.error('Error fetching fields:', error);
          setFields([]);
        }

        // Fetch relations
        try {
          const sourcesRes = await client.get(`/relations/${dataSource}`);
          if (sourcesRes.data) {
            setMetricSources(sourcesRes.data || []);
          }
        } catch (error) {
          console.error('Error fetching relations:', error);
          setMetricSources([]);
        }

        // Fetch fields for metric source if provided
        if (metricSource) {
          try {
            const metricFieldsRes = await client.get(`/fields/${metricSource}`);
            if (metricFieldsRes.data) {
              setMetricFields(metricFieldsRes.data.map((item: { columnName: string }) => item.columnName) || []);
            }
          } catch (error) {
            console.error('Error fetching metric fields:', error);
            setMetricFields([]);
          }
        } else {
          setMetricFields([]); // Clear metric fields if no metric source
        }
      }
    } catch (error) {
      console.error('Error in fetchDependentData:', error);
      setError('Failed to fetch data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Update handleFieldChange to fetch metric fields when metric source changes
  const handleFieldChange = (field: keyof DataPoint, value: string) => {
    try {
      setDataPoint(prev => {
        const newDataPoint = { ...prev, [field]: value };
        
        // Clear dependent fields
        if (field === 'dataSource') {
          newDataPoint.field = '';
          newDataPoint.metricSource = '';
          newDataPoint.metric = '';
          setTimeout(() => {
            fetchDependentData(value);
          }, 0);
        } else if (field === 'metricSource') {
          newDataPoint.metric = '';
          if (value) {
            setTimeout(() => {
              fetchDependentData(newDataPoint.dataSource, value);
            }, 0);
          } else {
            setMetricFields([]); // Clear metric fields if metric source is cleared
          }
        }
        
        return newDataPoint;
      });
    } catch (error) {
      console.error('Error in handleFieldChange:', error);
    }
  };

  const constructPayload = (dataPoint: DataPoint): Payload => {
    const payload: Payload = {
      entities: [dataPoint.dataSource],
      fields: [],
      join: [],
      filters: [],
      aggregations: [`${dataPoint.aggregation}(${dataPoint.dataSource}.${dataPoint.field})`]
    };

    // Add filters to payload
    filters.forEach(filter => {
      if (filter.field && filter.value) {
        payload.filters.push(`${filter.field} ${filter.operator} '${filter.value}'`);
      }
    });

    if (dataPoint.metricSource && dataPoint.metric) {
      payload.entities.push(dataPoint.metricSource);
      payload.fields = [`${dataPoint.metricSource}.${dataPoint.metric}`]; // Add metric field as regular field
      console.log(dataPoint.metricSource);
      console.log(metricSources);
      // Add join condition if needed
      const joinCondition = metricSources.find(source => 
        source.ttable === dataPoint.metricSource
      );
      console.log(joinCondition);
      if (joinCondition) {
        payload.join = [
          `${joinCondition.ttable}.${joinCondition.tcolumn} = ${joinCondition.stable}.${joinCondition.scolumn}`
        ];
      }
    }

    return payload;
  };

  // Update handleSubmit to handle the 500 error
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const payload = constructPayload(dataPoint);
      console.log('Sending payload:', payload);
      
      const response = await client.post('/query/new/bar', payload);
      
      // Check if response exists and has the expected structure
      if (!response?.data?.message?.data) {
        throw new Error('Invalid response format from server');
      }

      // Transform the data for the chart
      const rawData = response.data.message.data;
      const chartData = Object.entries(rawData).map(([key, value]) => ({
        name: key,
        value: Array.isArray(value) ? value[0] : value
      }));

      console.log('Transformed chart data:', chartData);

      // Add the widget with the transformed data
      onAdd({
        type,
        title,
        data: chartData,
        dataKey: 'value',
        layout: { x: 0, y: 0, w: 6, h: 4 },
        queryPayload: payload,
      });

      onClose();
    } catch (error: any) {
      console.error('Error details:', error);
      
      let errorMessage = 'Failed to create widget. ';
      if (error.response) {
        errorMessage += `Server error: ${error.response.status}. `;
        if (error.response.data?.error) {
          errorMessage += error.response.data.error;
        }
      } else if (error.request) {
        errorMessage += 'No response received from server.';
      } else {
        errorMessage += error.message || 'Unknown error occurred.';
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Add validation before enabling submit
  const isFormValid = () => {
    return (
      title.trim() !== '' &&
      dataPoint.dataSource !== '' &&
      dataPoint.field !== '' &&
      dataPoint.aggregation !== ''
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md relative max-h-[80vh] overflow-y-auto">
        
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}

       
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Create New Widget</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isLoading}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700">Widget Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter widget title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700">Chart Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ChartType)}
              className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="line">Line Chart</option>
              <option value="bar">Bar Chart</option>
              <option value="area">Area Chart</option>
              <option value="pie">Pie Chart</option>
            </select>
          </div>

          <div className="space-y-4 border-b pb-4">
            <div>
              <label className="block text-sm font-bold text-gray-700">Data Source</label>
              <select
                value={dataPoint.dataSource}
                onChange={(e) => handleFieldChange('dataSource', e.target.value)}
                className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                disabled={isLoading}
                required
              >
                <option value="">Select Data Source</option>
                {tables.map((table) => (
                  <option key={table} value={table}>{table}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700">Field</label>
              <select
                value={dataPoint.field}
                onChange={(e) => handleFieldChange('field', e.target.value)}
                className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                disabled={isLoading || !dataPoint.dataSource}
              >
                <option value="">Select Field</option>
                {fields.map((field) => (
                  <option key={field} value={field}>{field}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700">Aggregation</label>
              <select
                value={dataPoint.aggregation}
                onChange={(e) => handleFieldChange('aggregation', e.target.value)}
                className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select Aggregation</option>
                <option value="count">Count</option>
                <option value="sum">Sum</option>
                <option value="avg">Average</option>
                <option value="min">Minimum</option>
                <option value="max">Maximum</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700">Metric Source</label>
              <select
                value={dataPoint.metricSource}
                onChange={(e) => handleFieldChange('metricSource', e.target.value)}
                className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                disabled={isLoading || !dataPoint.dataSource}
              >
                <option value="">Select Metric Source</option>
                {metricSources.map((source) => (
                  <option key={source.id} value={source.ttable}>
                    {source.ttable}
                  </option>
                ))}
              </select>
            </div>

            
            {dataPoint.metricSource && (
              <div>
                <label className="block text-sm font-bold text-gray-700">Metric Field</label>
                <select
                  value={dataPoint.metric}
                  onChange={(e) => handleFieldChange('metric', e.target.value)}
                  className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  disabled={isLoading || !dataPoint.metricSource}
                >
                  <option value="">Select Metric Field</option>
                  {metricFields.map((field) => (
                    <option key={field} value={field}>{field}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-4 border-b pb-4">
              <button
                type="button"
                onClick={addFilter}
                className="mt-4 px-4 py-2 bg-blue-500 text-white font-bold rounded hover:bg-blue-600"
              >
                Add Filter
              </button>

              {showFilterOptions && filters.map((filter, index) => (
                <div key={index} className="relative space-y-4 border p-4 rounded-md">
                  <button
                    type="button"
                    onClick={() => removeFilter(index)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  >
                    X
                  </button>

                  <div>
                    <label className="block text-sm font-bold text-gray-700">Filter Field</label>
                    <select
                      value={filter.field}
                      onChange={(e) => handleFilterChange(index, 'field', e.target.value)}
                      className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">Select Filter Field</option>
                      {fields.map((field) => (
                        <option key={field} value={field}>{field}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700">Filter Operator</label>
                    <select
                      value={filter.operator}
                      onChange={(e) => handleFilterChange(index, 'operator', e.target.value)}
                      className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      {filterOperators.map((operator) => (
                        <option key={operator.value} value={operator.value}>{operator.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700">Filter Value</label>
                    <input
                      type="text"
                      value={filter.value}
                      onChange={(e) => handleFilterChange(index, 'value', e.target.value)}
                      className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter filter value"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <button
                type="submit"
                disabled={!isFormValid() || isLoading}
                className={`px-4 py-2 ${
                  isFormValid() && !isLoading
                    ? 'bg-blue-500 hover:bg-blue-600'
                    : 'bg-gray-300 cursor-not-allowed'
                } text-white font-bold rounded`}
              >
                {isLoading ? 'Creating...' : 'Create Widget'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddWidgetForm;
