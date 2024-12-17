import { Widget } from '../types';
import { useState } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

interface ChartWidgetProps {
  widget: Widget;
}

// Add sample data
const SAMPLE_DATA = {
  line: [
    { name: 'Jan', value1: 400, value2: 240 },
    { name: 'Feb', value1: 300, value2: 139 },
    { name: 'Mar', value1: 200, value2: 980 },
    { name: 'Apr', value1: 278, value2: 390 },
    { name: 'May', value1: 189, value2: 480 },
    { name: 'Jun', value1: 239, value2: 380 },
  ],
  bar: [
    { name: 'Q1', sales: 4000, profit: 2400 },
    { name: 'Q2', sales: 3000, profit: 1398 },
    { name: 'Q3', sales: 2000, profit: 9800 },
    { name: 'Q4', sales: 2780, profit: 3908 },
  ],
  area: [
    { name: '2019', users: 4000, sessions: 2400 },
    { name: '2020', users: 3000, sessions: 1398 },
    { name: '2021', users: 2000, sessions: 9800 },
    { name: '2022', users: 2780, sessions: 3908 },
    { name: '2023', users: 1890, sessions: 4800 },
  ],
  pie: [
    { name: 'Mobile', value: 400 },
    { name: 'Desktop', value: 300 },
    { name: 'Tablet', value: 200 },
    { name: 'Other', value: 100 },
  ],
};

// Add new interface for chart settings
interface ChartSettings {
  title: string;
  type: 'line' | 'bar' | 'area' | 'pie';
  dataKeys: string[];
}

// Common responsive options - add this at the top of renderChart function
const commonOptions = {
  chart: {
    toolbar: {
      show: false
    },
    redrawOnWindowResize: true,
    redrawOnParentResize: true,
    animations: {
      enabled: true
    },
    fontFamily: 'inherit',
    height: '100%',
    width: '100%',
    margin: {
      bottom: 60,
      left: 20,
      right: 20,
      top: 20
    }
  },
  responsive: [
    {
      breakpoint: 1200,
      options: {
        chart: {
          height: 'auto'
        },
        dataLabels: {
          style: {
            fontSize: '14px',
          }
        }
      }
    },
    {
      breakpoint: 768,
      options: {
        chart: {
          height: 'auto'
        },
        dataLabels: {
          style: {
            fontSize: '12px',
          }
        }
      }
    },
    {
      breakpoint: 480,
      options: {
        chart: {
          height: 'auto'
        },
        dataLabels: {
          style: {
            fontSize: '10px',
          }
        },
        xaxis: {
          labels: {
            style: {
              fontSize: '10px',
            }
          }
        },
        yaxis: {
          labels: {
            style: {
              fontSize: '10px',
            }
          }
        }
      }
    }
  ],
  dataLabels: {
    enabled: true,
    style: {
      fontSize: '16px',
    },
    textAnchor: 'middle' as const,
    distributed: true,
    offsetX: 0,
    offsetY: 0
  }
};

export default function ChartWidget({ widget }: ChartWidgetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [chartSettings, setChartSettings] = useState<ChartSettings>({
    title: widget.title || 'Untitled Chart',
    type: widget.type || 'line',
    dataKeys: Array.isArray(widget.dataKey) ? widget.dataKey : [widget.dataKey],
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    setChartSettings(prev => ({
      title: prev.title,
      type: prev.type,
      dataKeys: prev.dataKeys
    }));
    setIsEditing(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Simulate data refresh with timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      setChartSettings(prev => ({ ...prev }));
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderChart = (): JSX.Element => {
    // Get the data from the widget or sample data
    const chartData = widget.data || SAMPLE_DATA[widget.type];
    
    if (!chartData) {
      return <div>No data available to display.</div>;
    }

    // Transform API response if needed
    const transformedData = Array.isArray(chartData) 
      ? chartData 
      : Object.entries(chartData).map(([key, value]) => ({
          name: key,
          value: Array.isArray(value) ? value[0] : value
        }));

    // Determine data keys based on the data structure
    const dataKeys = Array.isArray(widget.dataKey) 
      ? widget.dataKey 
      : widget.dataKey 
      ? [widget.dataKey]
      : ['value']; // Default to 'value' for API response data

      console.log("tra: "+JSON.stringify(transformedData,null,2));
    switch (widget.type) {
      
      case 'bar':
        // Transform the data for ApexCharts format
        const barCategories = transformedData.map(item => item.name);
        const barValues = transformedData.map(item => Number(item.value));

        const barOptions = {
          ...commonOptions,
          plotOptions: {
            bar: {
              borderRadius: 4,
              columnWidth: '60%',
              distributed: true,
            },
          },
          colors: COLORS,
          dataLabels: {
            enabled: true,
          },
          xaxis: {
            categories: barCategories,
            labels: {
              rotate: -45,
              trim: true,
              hideOverlappingLabels: true,
              style: {
                fontSize: '12px',
              },
              maxHeight: 100
            }
          },
          grid: {
            borderColor: '#f3f4f6',
          },
          legend: {
            show: false
          }
        };

        const barSeries: ApexAxisChartSeries = [{
          name: 'Value',
          data: barValues
        }];

        return (
          <div className="h-full w-full">
            <Chart
              options={barOptions}
              series={barSeries}
              type="bar"
              height="100%"
              width="100%"
            />
          </div>
        );

      case 'pie':
        const pieOptions: ApexOptions = {
          chart: {
            type: 'pie' as const,
          },
          labels: transformedData.map(item => item.name),
          colors: COLORS,
          legend: {
            position: 'bottom',
            horizontalAlign: 'center',
          },
          dataLabels: {
            enabled: true,
          }
        };

        const pieSeries = transformedData.map(item => item[dataKeys[0]]);

        return (
          <div className="h-full w-full">
            <Chart
              options={pieOptions}
              series={pieSeries}
              type="pie"
              height="100%"
              width="100%"
            />
          </div>
        );

      case 'line':
        const lineCategories = transformedData.map(item => item.name);
        const lineSeries: ApexAxisChartSeries = dataKeys.map((key, index) => ({
          name: key,
          data: transformedData.map(item => Number(item[key])),
          color: COLORS[index % COLORS.length]
        }));

        const lineOptions: ApexOptions = {
          ...commonOptions,
          chart: {
            ...commonOptions.chart,
            type: 'line' as const,
            animations: {
              enabled: true
            },
            zoom: {
              enabled: false
            }
          },
          stroke: {
            curve: 'smooth',
            width: 3,
          },
          colors: COLORS,
          markers: {
            size: 4,
            strokeWidth: 2,
            hover: {
              size: 6,
            }
          },
          xaxis: {
            categories: lineCategories,
            labels: {
              rotate: -45,
              style: {
                fontSize: '12px',
              }
            }
          },
          grid: {
            borderColor: '#f3f4f6',
            xaxis: {
              lines: {
                show: true
              }
            },
            yaxis: {
              lines: {
                show: true
              }
            },
          },
          tooltip: {
            shared: true,
            intersect: false,
            y: {
              formatter: function(value: number) {
                return value.toString();
              }
            }
          }
        };

        return (
          <div className="h-full w-full">
            <Chart
              options={lineOptions}
              series={lineSeries}
              type="line"
              height="100%"
              width="100%"
            />
          </div>
        );

      case 'area':
        const areaOptions: ApexOptions = {
          ...commonOptions,
          stroke: {
            curve: 'smooth',
            width: 2
          },
          xaxis: {
            categories: transformedData.map(item => item.name),
            labels: {
              rotate: -45,
              trim: true,
              hideOverlappingLabels: true,
              style: {
                fontSize: '12px',
              },
              maxHeight: 100
            }
          }
        };

        const areaSeries = dataKeys.map((key, index) => ({
          name: key,
          data: transformedData.map(item => item[key]),
          color: COLORS[index % COLORS.length]
        }));

        return (
          <div className="h-full w-full">
            <Chart
              options={areaOptions}
              series={areaSeries}
              type="area"
              height="100%"
              width="100%"
            />
          </div>
        );

      default:
        return <div>Invalid chart type</div>;
    }
  };

  return (
    <>
      {/* Main Chart Container */}
      <div className="h-[400px] w-full p-4 bg-white rounded-lg shadow-md relative">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">{chartSettings.title}</h3>
          <div className="flex gap-2">
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`px-3 py-1 text-sm border rounded-md transition-colors ${
                isRefreshing ? 'opacity-50 cursor-not-allowed' : 'text-gray-600 hover:text-gray-800 border-gray-600 hover:border-gray-800 cursor-pointer'
              }`}
            >
              <svg 
                className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button 
              onClick={() => setIsEditing(true)}
              className="px-3 py-1 text-sm border rounded-md transition-colors text-blue-600 hover:text-blue-800 border-blue-600 hover:border-blue-800 cursor-pointer"
            >
              Edit
            </button>
          </div>
        </div>
        <div className="h-[calc(100%-2rem)]">
          {chartSettings.type && renderChart()}
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="bg-white p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Chart</h2>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEditSave}>
              {/* Title Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chart Title
                </label>
                <input
                  type="text"
                  value={chartSettings.title}
                  onChange={(e) => setChartSettings(prev => ({
                    ...prev,
                    title: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* Chart Type Select */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chart Type
                </label>
                <select
                  value={chartSettings.type}
                  onChange={(e) => setChartSettings(prev => ({
                    ...prev,
                    type: e.target.value as ChartSettings['type']
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="line">Line Chart</option>
                  <option value="bar">Bar Chart</option>
                  <option value="area">Area Chart</option>
                  <option value="pie">Pie Chart</option>
                </select>
              </div>

              {/* Data Keys Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Keys
                </label>
                <input
                  type="text"
                  value={chartSettings.dataKeys.join(', ')}
                  onChange={(e) => setChartSettings(prev => ({
                    ...prev,
                    dataKeys: e.target.value.split(',').map(key => key.trim())
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter keys separated by commas"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
