package com.mypocket.app.models;

import com.google.gson.annotations.SerializedName;

public class Account {
    @SerializedName("id")
    private String id;

    @SerializedName("_id")
    private String mongoId;

    @SerializedName("name")
    private String name;

    @SerializedName("account_class")
    private String accountClass; // ASSET, LIABILITY, EQUITY, INCOME, EXPENSE

    @SerializedName("account_type")
    private String accountType; // CASH, BANK, WALLET, INVESTMENT, CREDIT_CARD, LOAN, etc.

    @SerializedName("institution_name")
    private String institutionName;

    @SerializedName("description")
    private String description;

    @SerializedName("calculated_balance")
    private double calculatedBalance;

    @SerializedName("balance")
    private double balance;

    public String getId() {
        return id != null ? id : mongoId;
    }

    public String getName() {
        return name;
    }

    public String getAccountClass() {
        return accountClass != null ? accountClass : "";
    }

    public String getAccountType() {
        return accountType != null ? accountType : "";
    }

    public String getInstitutionName() {
        return institutionName;
    }

    public String getDescription() {
        return description;
    }

    public double getBalance() {
        return calculatedBalance != 0 ? calculatedBalance : balance;
    }
}
