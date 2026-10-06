package com.mypocket.app.models;

import com.google.gson.annotations.SerializedName;

public class ReconciliationResponse {
    @SerializedName("success")
    private boolean success;

    @SerializedName("message")
    private String message;

    @SerializedName("data")
    private Data data;

    public boolean isSuccess() {
        return success;
    }

    public String getMessage() {
        return message;
    }

    public Data getData() {
        return data;
    }

    public static class Data {
        @SerializedName("calculated_balance")
        private double calculatedBalance;

        @SerializedName("actual_balance")
        private double actualBalance;

        @SerializedName("variance")
        private double variance;

        @SerializedName("is_reconciled")
        private boolean isReconciled;

        public double getCalculatedBalance() {
            return calculatedBalance;
        }

        public double getActualBalance() {
            return actualBalance;
        }

        public double getVariance() {
            return variance;
        }

        public boolean isReconciled() {
            return isReconciled;
        }
    }
}
