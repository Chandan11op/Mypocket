package com.mypocket.app.models;

import com.google.gson.annotations.SerializedName;
import java.util.List;

public class BalanceSheetResponse {
    @SerializedName("success")
    private boolean success;

    @SerializedName("data")
    private Data data;

    public boolean isSuccess() {
        return success;
    }

    public Data getData() {
        return data;
    }

    public static class Data {
        @SerializedName("total_assets")
        private double totalAssets;

        @SerializedName("total_liabilities")
        private double totalLiabilities;

        @SerializedName("net_worth")
        private double netWorth;

        public double getTotalAssets() {
            return totalAssets;
        }

        public double getTotalLiabilities() {
            return totalLiabilities;
        }

        public double getNetWorth() {
            return netWorth;
        }
    }
}
