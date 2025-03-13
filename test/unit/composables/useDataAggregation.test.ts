// test/unit/composables/useDataAggregation.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { useDataAggregation } from "../../../composables/useDataAggregation";

describe("useDataAggregation", () => {
  // Sample test data
  const testData = [
    { id: 1, value: 10, category: "A" },
    { id: 2, value: 20, category: "B" },
    { id: 3, value: 30, category: "A" },
    { id: 4, value: 40, category: "B" },
    { id: 5, value: 50, category: "C" },
  ];

  describe("calculateStats", () => {
    it("should calculate correct statistics for numeric field", () => {
      const { calculateStats } = useDataAggregation();

      const stats = calculateStats(testData, "value");

      expect(stats.count).toBe(5);
      expect(stats.sum).toBe(150);
      expect(stats.avg).toBe(30);
      expect(stats.min).toBe(10);
      expect(stats.max).toBe(50);
      expect(stats.median).toBe(30);
      expect(stats.stdDev).toBeCloseTo(15.81, 1); // Approximation
    });

    it("should handle empty dataset", () => {
      const { calculateStats } = useDataAggregation();

      const stats = calculateStats([], "value");

      expect(stats.count).toBe(0);
      expect(stats.sum).toBe(0);
      expect(stats.avg).toBe(0);
      expect(stats.min).toBe(0);
      expect(stats.max).toBe(0);
    });
  });

  describe("groupByField", () => {
    it("should group data by field and sum values correctly", () => {
      const { groupByField } = useDataAggregation();

      const result = groupByField(testData, "category", "value", "sum");

      expect(result.length).toBe(3);

      // Find groups and verify them
      const groupA = result.find((g) => g.group === "A");
      const groupB = result.find((g) => g.group === "B");
      const groupC = result.find((g) => g.group === "C");

      expect(groupA).toBeDefined();
      expect(groupA?.value).toBe(40); // 10 + 30
      expect(groupA?.count).toBe(2);

      expect(groupB).toBeDefined();
      expect(groupB?.value).toBe(60); // 20 + 40
      expect(groupB?.count).toBe(2);

      expect(groupC).toBeDefined();
      expect(groupC?.value).toBe(50);
      expect(groupC?.count).toBe(1);
    });

    it("should support different aggregation methods", () => {
      const { groupByField } = useDataAggregation();

      // Test average aggregation
      const avgResult = groupByField(testData, "category", "value", "avg");
      const avgGroupA = avgResult.find((g) => g.group === "A");
      expect(avgGroupA?.value).toBe(20); // (10 + 30) / 2

      // Test min aggregation
      const minResult = groupByField(testData, "category", "value", "min");
      const minGroupA = minResult.find((g) => g.group === "A");
      expect(minGroupA?.value).toBe(10);

      // Test max aggregation
      const maxResult = groupByField(testData, "category", "value", "max");
      const maxGroupA = maxResult.find((g) => g.group === "A");
      expect(maxGroupA?.value).toBe(30);

      // Test count aggregation
      const countResult = groupByField(testData, "category", "value", "count");
      const countGroupA = countResult.find((g) => g.group === "A");
      expect(countGroupA?.value).toBe(2);
    });

    it("should handle empty dataset", () => {
      const { groupByField } = useDataAggregation();
      const result = groupByField([], "category", "value", "sum");
      expect(result).toEqual([]);
    });
  });

  describe("frequencyDistribution", () => {
    it("should calculate correct frequency distribution for a field", () => {
      const { frequencyDistribution } = useDataAggregation();

      const result = frequencyDistribution(testData, "category");

      expect(result.length).toBe(3);

      // Verify category A (2 out of 5 items = 40%)
      const categoryA = result.find((item) => item.value === "A");
      expect(categoryA).toBeDefined();
      expect(categoryA?.count).toBe(2);
      expect(categoryA?.percentage).toBe(40);

      // Verify category B (2 out of 5 items = 40%)
      const categoryB = result.find((item) => item.value === "B");
      expect(categoryB).toBeDefined();
      expect(categoryB?.count).toBe(2);
      expect(categoryB?.percentage).toBe(40);

      // Verify category C (1 out of 5 items = 20%)
      const categoryC = result.find((item) => item.value === "C");
      expect(categoryC).toBeDefined();
      expect(categoryC?.count).toBe(1);
      expect(categoryC?.percentage).toBe(20);
    });

    it("should handle numeric fields for frequency distribution", () => {
      const { frequencyDistribution } = useDataAggregation();

      const numericData = [
        { id: 1, score: 10 },
        { id: 2, score: 20 },
        { id: 3, score: 10 },
        { id: 4, score: 30 },
      ];

      const result = frequencyDistribution(numericData, "score");

      expect(result.length).toBe(3);

      // Verify score 10 (2 out of 4 items = 50%)
      const score10 = result.find((item) => item.value === 10);
      expect(score10).toBeDefined();
      expect(score10?.count).toBe(2);
      expect(score10?.percentage).toBe(50);
    });

    it("should handle empty dataset", () => {
      const { frequencyDistribution } = useDataAggregation();

      const result = frequencyDistribution([], "category");

      expect(result).toEqual([]);
    });

    it("should handle missing values", () => {
      const { frequencyDistribution } = useDataAggregation();

      const dataWithMissing = [
        { id: 1, category: "A" },
        { id: 2, category: "B" },
        { id: 3 }, // Missing category
        { id: 4, category: "A" },
      ];

      const result = frequencyDistribution(dataWithMissing, "category");

      // Should have entries for A, B, and undefined
      expect(result.length).toBe(3);

      // Verify handling of undefined values
      const undefinedCategory = result.find((item) => item.value === undefined);
      expect(undefinedCategory).toBeDefined();
      expect(undefinedCategory?.count).toBe(1);
      expect(undefinedCategory?.percentage).toBe(25);
    });
  });

  describe("histogram", () => {
    it("should create correct bins for numeric data", () => {
      const { histogram } = useDataAggregation();

      const numericData = [
        { id: 1, value: 10 },
        { id: 2, value: 15 },
        { id: 3, value: 20 },
        { id: 4, value: 25 },
        { id: 5, value: 30 },
        { id: 6, value: 35 },
        { id: 7, value: 40 },
      ];

      // Default 10 bins
      const result = histogram(numericData, "value");

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("bin");
      expect(result[0]).toHaveProperty("count");
      expect(result[0]).toHaveProperty("min");
      expect(result[0]).toHaveProperty("max");
      expect(result[0]).toHaveProperty("percentage");
    });

    it("should create custom number of bins when specified", () => {
      const { histogram } = useDataAggregation();

      const numericData = [
        { id: 1, value: 10 },
        { id: 2, value: 20 },
        { id: 3, value: 30 },
        { id: 4, value: 40 },
        { id: 5, value: 50 },
      ];

      // Request exactly 5 bins
      const result = histogram(numericData, "value", 5);

      // Should have 5 bins with width of 8 each (10-50 range)
      expect(result.length).toBe(5);

      // Check first and last bin
      expect(result[0].min).toBeCloseTo(10);
      expect(result[4].max).toBeCloseTo(50);
    });

    it("should handle case when all values are the same", () => {
      const { histogram } = useDataAggregation();

      const sameValueData = [
        { id: 1, value: 10 },
        { id: 2, value: 10 },
        { id: 3, value: 10 },
      ];

      const result = histogram(sameValueData, "value");

      // Should return a single bin when all values are the same
      expect(result.length).toBe(1);
      expect(result[0].count).toBe(3);
      expect(result[0].percentage).toBe(100);
    });

    it("should handle empty dataset", () => {
      const { histogram } = useDataAggregation();

      const result = histogram([], "value");

      expect(result).toEqual([]);
    });
  });

  describe("timeAggregation", () => {
    it("should aggregate data by month correctly", () => {
      const { timeAggregation } = useDataAggregation();

      const timeData = [
        { id: 1, date: "2023-01-15", amount: 100 },
        { id: 2, date: "2023-01-20", amount: 200 },
        { id: 3, date: "2023-02-10", amount: 150 },
        { id: 4, date: "2023-02-25", amount: 250 },
        { id: 5, date: "2023-03-05", amount: 300 },
      ];

      const result = timeAggregation(
        timeData,
        "date",
        "amount",
        "month",
        "sum"
      );

      expect(result.length).toBe(3); // 3 months

      // Check January total
      const jan = result.find((item) => item.date === "2023-01");
      expect(jan).toBeDefined();
      expect(jan?.value).toBe(300); // 100 + 200
      expect(jan?.count).toBe(2);

      // Check March total
      const mar = result.find((item) => item.date === "2023-03");
      expect(mar).toBeDefined();
      expect(mar?.value).toBe(300);
      expect(mar?.count).toBe(1);
    });

    it("should aggregate data with different methods", () => {
      const { timeAggregation } = useDataAggregation();

      const timeData = [
        { id: 1, date: "2023-01-15", amount: 100 },
        { id: 2, date: "2023-01-20", amount: 200 },
        { id: 3, date: "2023-02-10", amount: 50 },
        { id: 4, date: "2023-02-25", amount: 250 },
      ];

      // Test average aggregation
      const avgResult = timeAggregation(
        timeData,
        "date",
        "amount",
        "month",
        "avg"
      );
      const janAvg = avgResult.find((item) => item.date === "2023-01");
      expect(janAvg?.value).toBe(150); // avg of 100 and 200

      // Test min aggregation
      const minResult = timeAggregation(
        timeData,
        "date",
        "amount",
        "month",
        "min"
      );
      const febMin = minResult.find((item) => item.date === "2023-02");
      expect(febMin?.value).toBe(50);

      // Test max aggregation
      const maxResult = timeAggregation(
        timeData,
        "date",
        "amount",
        "month",
        "max"
      );
      const febMax = maxResult.find((item) => item.date === "2023-02");
      expect(febMax?.value).toBe(250);

      // Test count aggregation
      const countResult = timeAggregation(
        timeData,
        "date",
        "amount",
        "month",
        "count"
      );
      expect(countResult[0].value).toBe(countResult[0].count);
    });

    it("should aggregate data by different time intervals", () => {
      const { timeAggregation } = useDataAggregation();

      const timeData = [
        { id: 1, date: "2023-01-01", amount: 100 },
        { id: 2, date: "2023-01-02", amount: 200 },
        { id: 3, date: "2023-01-08", amount: 150 }, // Different week than the first two
        { id: 4, date: "2023-02-01", amount: 250 },
      ];

      // Test daily aggregation
      const dayResult = timeAggregation(
        timeData,
        "date",
        "amount",
        "day",
        "sum"
      );
      expect(dayResult.length).toBe(4); // 4 different days

      // Test weekly aggregation
      const weekResult = timeAggregation(
        timeData,
        "date",
        "amount",
        "week",
        "sum"
      );
      expect(weekResult.length).toBe(3); // 3 different weeks

      // Test yearly aggregation
      const yearResult = timeAggregation(
        timeData,
        "date",
        "amount",
        "year",
        "sum"
      );
      expect(yearResult.length).toBe(1); // All in 2023
      expect(yearResult[0].value).toBe(700); // Sum of all amounts
    });

    it("should handle invalid dates", () => {
      const { timeAggregation } = useDataAggregation();

      const mixedData = [
        { id: 1, date: "2023-01-15", amount: 100 },
        { id: 2, date: "invalid-date", amount: 200 },
        { id: 3, date: "2023-02-10", amount: 150 },
      ];

      const result = timeAggregation(
        mixedData,
        "date",
        "amount",
        "month",
        "sum"
      );

      // Should filter out invalid dates
      expect(result.length).toBe(2); // Only Jan and Feb are valid
    });

    it("should handle empty dataset", () => {
      const { timeAggregation } = useDataAggregation();

      const result = timeAggregation([], "date", "amount", "month", "sum");

      expect(result).toEqual([]);
    });
  });

  describe("geoHeatmapData", () => {
    it("should transform geographic data correctly", () => {
      const { geoHeatmapData } = useDataAggregation();

      const geoData = [
        { id: 1, lat: 40.7128, lng: -74.006, value: 100 }, // NYC
        { id: 2, lat: 34.0522, lng: -118.2437, value: 200 }, // LA
        { id: 3, lat: 41.8781, lng: -87.6298, value: 150 }, // Chicago
      ];

      const result = geoHeatmapData(geoData, "lat", "lng", "value");

      expect(result.length).toBe(3);
      expect(result[0].latitude).toBe(40.7128);
      expect(result[0].longitude).toBe(-74.006);
      expect(result[0].weight).toBe(100);
      expect(result[1].weight).toBe(200);
    });

    it("should transform geographic data correctly", () => {
      const { geoHeatmapData } = useDataAggregation();

      const geoData = [
        { id: 1, lat: 40.7128, lng: -74.006, value: 100 }, // NYC
        { id: 2, lat: 34.0522, lng: -118.2437, value: 200 }, // LA
        { id: 3, lat: 41.8781, lng: -87.6298, value: 150 }, // Chicago
      ];

      const result = geoHeatmapData(geoData, "lat", "lng", "value");

      expect(result.length).toBe(3);
      expect(result[0].latitude).toBe(40.7128);
      expect(result[0].longitude).toBe(-74.006);
      expect(result[0].weight).toBe(100);
      expect(result[1].weight).toBe(200);
    });

    it("should use custom radius when provided", () => {
      const { geoHeatmapData } = useDataAggregation();

      const geoData = [{ id: 1, lat: 40.7128, lng: -74.006, value: 100 }];

      const customRadius = 50;
      const result = geoHeatmapData(
        geoData,
        "lat",
        "lng",
        "value",
        customRadius
      );

      expect(result[0].radius).toBe(customRadius);
    });

    it("should use default weight of 1 when no value field provided", () => {
      const { geoHeatmapData } = useDataAggregation();

      const geoData = [
        { id: 1, lat: 40.7128, lng: -74.006 },
        { id: 2, lat: 34.0522, lng: -118.2437 },
      ];

      const result = geoHeatmapData(geoData, "lat", "lng");

      expect(result.length).toBe(2);
      expect(result[0].weight).toBe(1);
      expect(result[1].weight).toBe(1);
    });

    it("should filter out invalid coordinates", () => {
      const { geoHeatmapData } = useDataAggregation();

      const mixedData = [
        { id: 1, lat: 40.7128, lng: -74.006 }, // Valid
        { id: 2, lat: 200, lng: -118.2437 }, // Invalid latitude (>90)
        { id: 3, lat: 41.8781, lng: -200 }, // Invalid longitude (<-180)
        { id: 4, lat: "invalid", lng: -87.6298 }, // Non-numeric
      ];

      const result = geoHeatmapData(mixedData, "lat", "lng");

      expect(result.length).toBe(1); // Only the first point is valid
    });

    it("should handle empty dataset", () => {
      const { geoHeatmapData } = useDataAggregation();

      const result = geoHeatmapData([], "lat", "lng");

      expect(result).toEqual([]);
    });
  });

  describe("calculateCorrelation", () => {
    it("should calculate positive correlation correctly", () => {
      const { calculateCorrelation } = useDataAggregation();

      const data = [
        { x: 1, y: 2 },
        { x: 2, y: 4 },
        { x: 3, y: 6 },
        { x: 4, y: 8 },
      ];

      const result = calculateCorrelation(data, "x", "y");

      expect(result).toBeCloseTo(1.0); // Perfect positive correlation
    });

    it("should calculate negative correlation correctly", () => {
      const { calculateCorrelation } = useDataAggregation();

      const data = [
        { x: 1, y: 8 },
        { x: 2, y: 6 },
        { x: 3, y: 4 },
        { x: 4, y: 2 },
      ];

      const result = calculateCorrelation(data, "x", "y");

      expect(result).toBeCloseTo(-1.0); // Perfect negative correlation
    });

    it("should handle no correlation", () => {
      const { calculateCorrelation } = useDataAggregation();

      const data = [
        { x: 1, y: 5 },
        { x: 2, y: 2 },
        { x: 3, y: 8 },
        { x: 4, y: 1 },
      ];

      const result = calculateCorrelation(data, "x", "y");

      // Should be closer to 0 (no correlation)
      expect(Math.abs(result)).toBeLessThan(0.5);
    });

    it("should handle invalid data", () => {
      const { calculateCorrelation } = useDataAggregation();

      // Empty dataset
      expect(calculateCorrelation([], "x", "y")).toBe(0);

      // Missing values
      const invalidData = [{ x: 1 }, { y: 2 }];
      expect(calculateCorrelation(invalidData, "x", "y")).toBe(0);
    });
  });

  describe("simpleForecast", () => {
    it("should forecast future periods using linear regression", () => {
      const { simpleForecast } = useDataAggregation();

      const timeData = [
        { date: "2023-01-01", value: 100, count: 1 },
        { date: "2023-02-01", value: 120, count: 1 },
        { date: "2023-03-01", value: 140, count: 1 }
      ];

      const forecast = simpleForecast(timeData, 2, "linear");

      expect(forecast.length).toBe(2);
      expect(forecast[0].forecast).toBe(true);
      expect(forecast[0].date).toBeDefined();
      expect(forecast[0].value).toBeGreaterThan(140); // Trend continues upward
      expect(forecast[1].value).toBeGreaterThan(forecast[0].value); // Linear trend continues
    });

    it("should forecast using average method", () => {
      const { simpleForecast } = useDataAggregation();

      const timeData = [
        { date: "2023-01-01", value: 100, count: 1 },
        { date: "2023-02-01", value: 140, count: 1 },
        { date: "2023-03-01", value: 120, count: 1 }
      ];

      const forecast = simpleForecast(timeData, 2, "average");

      expect(forecast.length).toBe(2);
      // Average of last 3 values (100 + 140 + 120) / 3 = 120
      expect(forecast[0].value).toBe(120);
      expect(forecast[1].value).toBe(120); // Same average for all forecasted periods
    });

    it("should forecast using last value method", () => {
      const { simpleForecast } = useDataAggregation();

      const timeData = [
        { date: "2023-01-01", value: 100, count: 1 },
        { date: "2023-02-01", value: 120, count: 1 },
        { date: "2023-03-01", value: 150, count: 1 },
      ];

      const forecast = simpleForecast(timeData, 3, "last");

      expect(forecast.length).toBe(3);
      // All forecasted values should equal the last observed value
      expect(forecast[0].value).toBe(150);
      expect(forecast[1].value).toBe(150);
      expect(forecast[2].value).toBe(150);
    });

    it("should handle different date formats", () => {
      const { simpleForecast } = useDataAggregation();

      // Monthly format
      const monthlyData = [
        { date: "2023-01", value: 100, count: 1 },
        { date: "2023-02", value: 120, count: 1 },
      ];

      const monthForecast = simpleForecast(monthlyData, 1, "linear");
      expect(monthForecast[0].date).toMatch(/^2023-03$/);

      // Weekly format
      const weeklyData = [
        { date: "2023-W01", value: 100, count: 1 },
        { date: "2023-W02", value: 120, count: 1 },
      ];

      const weekForecast = simpleForecast(weeklyData, 1, "linear");
      expect(weekForecast[0].date).toMatch(/^2023-W03$/);
    });

    it("should handle empty dataset", () => {
      const { simpleForecast } = useDataAggregation();

      const forecast = simpleForecast([], 2, "linear");

      expect(forecast).toEqual([]);
    });
  });
});
