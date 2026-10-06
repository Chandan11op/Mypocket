package com.mypocket.app.models;

import com.google.gson.annotations.SerializedName;

public class FinancialPositionResponse {
    @SerializedName("success")
    private boolean success;

    @SerializedName("data")
    private PositionData data;

    public boolean isSuccess() {
        return success;
    }

    public PositionData getData() {
        return data;
    }

    public static class PositionData {
        @SerializedName("net_worth")
        private double netWorth;

        @SerializedName("total_assets")
        private double totalAssets;

        @SerializedName("total_liabilities")
        private double totalLiabilities;

        public double getNetWorth() {
            return netWorth;
        }

        public double getTotalAssets() {
            return totalAssets;
        }

        public double getTotalLiabilities() {
            return totalLiabilities;
        }
    }
}
