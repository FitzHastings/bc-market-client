/**
 * Represents a single candlestick data point in a financial chart
 */
export interface CandlestickData {
  /** Time label for the data point (e.g., "6h ago", "Now") */
  time: string;
  /** Opening price for the period */
  open: number;
  /** Highest price reached during the period */
  high: number;
  /** Lowest price reached during the period */
  low: number;
  /** Closing price for the period */
  close: number;
  /** Trading volume for the period */
  volume: number;
}

/**
 * Represents market data for an item's price history
 */
export interface MarketData {
  /** Array of candlestick data points */
  dataPoints: CandlestickData[];
  /** Current price of the item */
  currentPrice: number;
  /** Price change percentage */
  priceChange: number;
  /** Direction of price change: 'up', 'down', or 'flat' */
  trend: 'up' | 'down' | 'flat';
  /** Total volume over the period */
  totalVolume: number;
  /** Highest price over the period */
  periodHigh: number;
  /** Lowest price over the period */
  periodLow: number;
  /** Number of active listings */
  activeListings: number;
  /** Name of the item */
  itemName: string;
  /** Time period represented (e.g., "Last 24 hours") */
  timePeriod: string;
}

/**
 * Configuration options for the candlestick chart
 */
export interface ChartConfig {
  /** Chart height in pixels */
  chartHeight: number;
  /** Chart width in pixels */
  chartWidth: number;
  /** Width of each candlestick in pixels */
  candleWidth: number;
  /** Maximum price for Y-axis scaling */
  maxPrice: number;
  /** Minimum price for Y-axis scaling */
  minPrice: number;
  /** Labels for the Y-axis */
  yAxisLabels: string[];
  /** Labels for the X-axis */
  xAxisLabels: string[];
}
