package com.mypocket.app.models;

import com.google.gson.annotations.SerializedName;
import java.util.List;

public class AccountsListResponse {
    @SerializedName("success")
    private boolean success;

    @SerializedName("data")
    private AccountsData data;

    public boolean isSuccess() {
        return success;
    }

    public List<Account> getAccounts() {
        return data != null ? data.accounts : null;
    }

    public static class AccountsData {
        @SerializedName("accounts")
        private List<Account> accounts;
    }
}
