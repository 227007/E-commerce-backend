export function predictSales(historicalData, period = 30) {
    if (!historicalData?.length) {
      throw new Error("Historical data is required");
    }
  
    const totalSales = historicalData.reduce((sum, day) => sum + day.sales, 0);
    const avgDailySales = totalSales / historicalData.length;
  
    return {
      predictedSales: avgDailySales * period,
      period,
      lastUpdated: new Date().toISOString(),
      algorithm: "Simple Moving Average" 
    };
  }
  
  export default { predictSales };