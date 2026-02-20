// src/hooks/useSurvivalMath.js
import { useState } from 'react';

export const useSurvivalMath = (monthlyRent = 1200, ramenCost = 1.50) => {
  const [purchasePrice, setPurchasePrice] = useState(0);

  // Daily overhead: Rent per day + 3 meals a day
  const dailyRent = monthlyRent / 30;
  const dailyFood = ramenCost * 3;
  const totalDailyBurn = dailyRent + dailyFood;

  // Key Metrics
  const foodDays = purchasePrice / dailyFood;
  const rentHours = purchasePrice / (dailyRent / 24);
  const totalRunwayDays = purchasePrice / totalDailyBurn;

  return {
    purchasePrice,
    setPurchasePrice,
    metrics: {
      foodDays: foodDays.toFixed(1),
      rentHours: rentHours.toFixed(1),
      totalRunwayDays: totalRunwayDays.toFixed(1),
      percentOfRent: ((purchasePrice / monthlyRent) * 100).toFixed(1)
    }
  };
};