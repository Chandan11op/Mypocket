package com.mypocket.app.models;

import com.google.gson.annotations.SerializedName;

public class ProfitLossResponse {
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
        @SerializedName("total_income")
        private double totalIncome;

        @SerializedName("total_expenses")
        private double totalExpenses;

        @SerializedName("net_profit")
        private double netProfit;

        public double getTotalIncome() {
            return totalIncome;
        }

        public double getTotalExpenses() {
            return totalExpenses;
        }

        public double getNetProfit() {
            return netProfit;
        }
    }
}
