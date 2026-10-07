package com.mypocket.app.models;

import com.google.gson.annotations.SerializedName;
import java.util.List;

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
        @SerializedName("financial_position")
        private FinancialPositionObj financialPosition;

        @SerializedName("profit_and_loss")
        private ProfitLossObj profitAndLoss;

        @SerializedName("accounts")
        private List<Account> accounts;

        public FinancialPositionObj getFinancialPosition() {
            return financialPosition;
        }

        public ProfitLossObj getProfitAndLoss() {
            return profitAndLoss;
        }

        public List<Account> getAccounts() {
            return accounts;
        }

        public double getNetWorth() {
            return financialPosition != null ? financialPosition.getNetWorth() : 0;
        }

        public double getTotalAssets() {
            return financialPosition != null ? financialPosition.getTotalAssets() : 0;
        }

        public double getTotalLiabilities() {
            return financialPosition != null ? financialPosition.getTotalLiabilities() : 0;
        }

        public double getTotalIncome() {
            return profitAndLoss != null ? profitAndLoss.getTotalIncome() : 0;
        }

        public double getTotalExpenses() {
            return profitAndLoss != null ? profitAndLoss.getTotalExpenses() : 0;
        }

        public double getNetProfit() {
            return profitAndLoss != null ? profitAndLoss.getNetProfit() : 0;
        }
    }

    public static class FinancialPositionObj {
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

    public static class ProfitLossObj {
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
