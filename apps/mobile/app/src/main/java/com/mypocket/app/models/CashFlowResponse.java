package com.mypocket.app.models;

import com.google.gson.annotations.SerializedName;

public class CashFlowResponse {
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
        @SerializedName("operating_cash_flow")
        private double operatingCashFlow;

        @SerializedName("net_cash_flow")
        private double netCashFlow;

        public double getOperatingCashFlow() {
            return operatingCashFlow;
        }

        public double getNetCashFlow() {
            return netCashFlow;
        }
    }
}
