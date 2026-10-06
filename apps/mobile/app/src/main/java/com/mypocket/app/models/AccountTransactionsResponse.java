package com.mypocket.app.models;

import com.google.gson.annotations.SerializedName;
import java.util.List;

public class AccountTransactionsResponse {
    @SerializedName("success")
    private boolean success;

    @SerializedName("data")
    private Data data;

    public boolean isSuccess() {
        return success;
    }

    public List<AccountTransactionItem> getTransactions() {
        return data != null ? data.transactions : null;
    }

    public static class Data {
        @SerializedName("account_name")
        private String accountName;

        @SerializedName("transactions")
        private List<AccountTransactionItem> transactions;
    }
}
