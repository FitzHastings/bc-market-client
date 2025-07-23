import { Component, Input, OnInit, ElementRef, ViewChild, AfterViewInit, HostListener, OnChanges, SimpleChanges, OnDestroy, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CandlestickData, MarketData, ChartConfig } from '../../models/candlestick-chart.model';

@Component({
  selector: 'app-item-candlestick-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './item-candlestick-chart.component.html',
  styleUrl: './item-candlestick-chart.component.css'
})
export class ItemCandlestickChartComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  /**
   * Input market data for the chart
   */
  @Input() marketData: MarketData | null = null;

  /**
   * Reference to the chart container element
   */
  @ViewChild('chartContainer') chartContainer!: ElementRef<HTMLDivElement>;

  /**
   * Reference to the tooltip element
   */
  @ViewChild('tooltip') tooltip!: ElementRef<HTMLDivElement>;

  /**
   * Default sample data if no input is provided
   */
  private sampleMarketData: MarketData = {
    dataPoints: [
      { time: '6h ago', open: 1180, high: 1220, low: 1150, close: 1200, volume: 45 },
      { time: '5h ago', open: 1200, high: 1250, low: 1180, close: 1230, volume: 67 },
      { time: '4h ago', open: 1230, high: 1280, low: 1200, close: 1210, volume: 89 },
      { time: '3h ago', open: 1210, high: 1240, low: 950, close: 980, volume: 156 },
      { time: '2h ago', open: 980, high: 1100, low: 891, close: 1050, volume: 234 },
      { time: '1h ago', open: 1050, high: 1200, low: 1040, close: 1180, volume: 178 },
      { time: 'Now', open: 1180, high: 1389, low: 1160, close: 1247, volume: 98 }
    ],
    currentPrice: 1247,
    priceChange: 2.4,
    trend: 'up',
    totalVolume: 1423,
    periodHigh: 1389,
    periodLow: 891,
    activeListings: 47,
    itemName: 'Dragon Sword',
    timePeriod: 'Last 24 hours'
  };

  /**
   * Chart configuration
   */
  chartConfig: ChartConfig = {
    chartHeight: 360,
    chartWidth: 1040,
    candleWidth: 20,
    maxPrice: 1400,
    minPrice: 800,
    yAxisLabels: ['1,400', '1,300', '1,200', '1,100', '1,000', '900', '800'],
    xAxisLabels: ['6h ago', '5h ago', '4h ago', '3h ago', '2h ago', '1h ago', 'Now']
  };

  /**
   * DOM elements for candlesticks
   */
  private candlesticks: HTMLElement[] = [];

  /**
   * DOM elements for volume bars
   */
  private volumeBars: HTMLElement[] = [];

  /**
   * Flag to track if component is initialized
   */
  private initialized = false;

  /**
   * Resize observer to handle container size changes
   */
  private resizeObserver: ResizeObserver | null = null;

  constructor(private renderer: Renderer2) {}

  /**
   * Initialize the component
   */
  ngOnInit(): void {
    this.initializeData();
  }

  /**
   * Handle changes to input properties
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['marketData'] && !changes['marketData'].firstChange) {
      this.initializeData();
      if (this.initialized) {
        this.renderChart();
      }
    }
  }

  /**
   * After view is initialized, render the chart
   */
  ngAfterViewInit(): void {
    this.initialized = true;
    this.renderChart();
    this.setupResizeObserver();
  }

  /**
   * Clean up resources when component is destroyed
   */
  ngOnDestroy(): void {
    this.clearChart();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  /**
   * Initialize data with defaults if needed
   */
  private initializeData(): void {
    // Use sample data if no input is provided
    if (!this.marketData) {
      this.marketData = this.sampleMarketData;
    }

    // Calculate min and max prices from data if not set
    if (this.marketData && this.marketData.dataPoints.length > 0) {
      const prices: number[] = [];
      this.marketData.dataPoints.forEach(point => {
        prices.push(point.high, point.low, point.open, point.close);
      });

      const minDataPrice = Math.min(...prices);
      const maxDataPrice = Math.max(...prices);

      // Add 10% padding to price range
      const padding = (maxDataPrice - minDataPrice) * 0.1;
      this.chartConfig.minPrice = Math.floor((minDataPrice - padding) / 100) * 100;
      this.chartConfig.maxPrice = Math.ceil((maxDataPrice + padding) / 100) * 100;

      // Update Y-axis labels
      const range = this.chartConfig.maxPrice - this.chartConfig.minPrice;
      const step = range / 6;
      this.chartConfig.yAxisLabels = Array.from({ length: 7 }, (_, i) => {
        return (this.chartConfig.maxPrice - i * step).toLocaleString();
      });

      // Update X-axis labels if needed
      if (this.chartConfig.xAxisLabels.length !== this.marketData.dataPoints.length) {
        this.chartConfig.xAxisLabels = this.marketData.dataPoints.map(point => point.time);
      }
    }
  }

  /**
   * Set up resize observer to handle container size changes
   */
  private setupResizeObserver(): void {
    if (typeof ResizeObserver !== 'undefined' && this.chartContainer) {
      this.resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          if (entry.contentRect.width > 0) {
            this.chartConfig.chartWidth = entry.contentRect.width - 80; // Adjust for padding and y-axis
            this.renderChart();
          }
        }
      });
      this.resizeObserver.observe(this.chartContainer.nativeElement);
    }
  }

  /**
   * Renders the candlestick chart
   */
  private renderChart(): void {
    if (!this.marketData || !this.chartContainer || !this.marketData.dataPoints.length) {
      console.warn('Cannot render chart: missing data or container');
      return;
    }

    try {
      // Clear any existing chart elements
      this.clearChart();

      // Get the chart container element
      const chart = this.chartContainer.nativeElement;

      // Render each candlestick
      this.marketData.dataPoints.forEach((data, index) => {
        const { candlestick, volumeBar } = this.createCandlestick(data, index);
        this.renderer.appendChild(chart, candlestick);
        this.renderer.appendChild(chart, volumeBar);

        // Store references for cleanup
        this.candlesticks.push(candlestick);
        this.volumeBars.push(volumeBar);
      });
    } catch (error) {
      console.error('Error rendering chart:', error);
    }
  }

  /**
   * Creates a candlestick element for a data point
   */
  private createCandlestick(data: CandlestickData, index: number): { candlestick: HTMLElement, volumeBar: HTMLElement } {
    const { chartHeight, chartWidth, candleWidth, maxPrice, minPrice } = this.chartConfig;
    const priceRange = maxPrice - minPrice;
    const spacing = chartWidth / (this.marketData?.dataPoints.length || 1);

    // Calculate positions
    const x = 20 + (index * spacing) + (spacing - candleWidth) / 2;
    const openY = chartHeight - ((data.open - minPrice) / priceRange * chartHeight) + 20;
    const closeY = chartHeight - ((data.close - minPrice) / priceRange * chartHeight) + 20;
    const highY = chartHeight - ((data.high - minPrice) / priceRange * chartHeight) + 20;
    const lowY = chartHeight - ((data.low - minPrice) / priceRange * chartHeight) + 20;

    const isGreen = data.close > data.open;
    const bodyTop = Math.min(openY, closeY);
    const bodyHeight = Math.abs(closeY - openY);

    // Create candlestick container
    const candlestick = this.renderer.createElement('div');
    this.renderer.addClass(candlestick, 'candlestick');
    this.renderer.setStyle(candlestick, 'left', `${x}px`);

    // Create wick
    const wick = this.renderer.createElement('div');
    this.renderer.addClass(wick, 'candle-wick');
    this.renderer.setStyle(wick, 'top', `${highY}px`);
    this.renderer.setStyle(wick, 'height', `${lowY - highY}px`);

    // Create body
    const body = this.renderer.createElement('div');
    this.renderer.addClass(body, 'candle-body');
    this.renderer.addClass(body, isGreen ? 'candle-green' : 'candle-red');
    this.renderer.setStyle(body, 'top', `${bodyTop}px`);
    this.renderer.setStyle(body, 'height', `${Math.max(bodyHeight, 2)}px`);

    // Create volume bar
    const volumeBar = this.renderer.createElement('div');
    this.renderer.addClass(volumeBar, 'volume-bar');
    this.renderer.setStyle(volumeBar, 'left', `${x}px`);
    this.renderer.setStyle(volumeBar, 'height', `${(data.volume / 250 * 60)}px`);

    // Add hover tooltip
    this.renderer.listen(candlestick, 'mouseenter', (e) => this.showTooltip(e, data));
    this.renderer.listen(candlestick, 'mouseleave', () => this.hideTooltip());

    this.renderer.appendChild(candlestick, wick);
    this.renderer.appendChild(candlestick, body);

    return { candlestick, volumeBar };
  }

  /**
   * Shows the tooltip with data information
   */
  private showTooltip(event: MouseEvent, data: CandlestickData): void {
    if (!this.tooltip) return;

    const tooltipElement = this.tooltip.nativeElement;
    const tooltipContent = `
      <strong>${data.time}</strong><br>
      Open: ${data.open.toLocaleString()} gold<br>
      High: ${data.high.toLocaleString()} gold<br>
      Low: ${data.low.toLocaleString()} gold<br>
      Close: ${data.close.toLocaleString()} gold<br>
      Volume: ${data.volume.toLocaleString()} items
    `;

    this.renderer.setProperty(tooltipElement, 'innerHTML', tooltipContent);
    this.renderer.setStyle(tooltipElement, 'display', 'block');
    this.renderer.setStyle(tooltipElement, 'left', `${event.pageX + 10}px`);
    this.renderer.setStyle(tooltipElement, 'top', `${event.pageY - 10}px`);
  }

  /**
   * Hides the tooltip
   */
  private hideTooltip(): void {
    if (this.tooltip) {
      this.renderer.setStyle(this.tooltip.nativeElement, 'display', 'none');
    }
  }

  /**
   * Clears the chart by removing all candlestick elements
   */
  private clearChart(): void {
    // Remove all candlesticks and volume bars
    this.candlesticks.forEach(element => {
      if (element.parentNode) {
        this.renderer.removeChild(element.parentNode, element);
      }
    });

    this.volumeBars.forEach(element => {
      if (element.parentNode) {
        this.renderer.removeChild(element.parentNode, element);
      }
    });

    // Reset arrays
    this.candlesticks = [];
    this.volumeBars = [];
  }

  /**
   * Updates the chart when window is resized
   * Note: This is a fallback for browsers that don't support ResizeObserver
   */
  @HostListener('window:resize')
  onResize(): void {
    if (!this.resizeObserver && this.chartContainer) {
      const containerWidth = this.chartContainer.nativeElement.clientWidth;
      if (containerWidth > 0) {
        this.chartConfig.chartWidth = containerWidth - 80; // Adjust for padding and y-axis
        this.renderChart();
      }
    }
  }
}
